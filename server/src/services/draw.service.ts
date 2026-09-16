import { DrawStatus, DrawStrategy, Prisma, PrizeTier } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { calculateMatchCount, DrawEngine, RNG } from './drawEngine.service.js';
import { PrizeService, TierPoolResult, WinnerPayout } from './prize.service.js';
import { normalizeDrawNumbers } from '../utils/numberNormalizer.js';

export interface EligibleUserEntry {
  userId: string;
  numbers: number[];
}

export interface SimulationResult {
  drawId: string;
  month: number;
  year: number;
  strategy: DrawStrategy;
  winningNumbers: number[];
  eligibleEntriesCount: number;
  matchBreakdown: Record<PrizeTier, number>;
  prizePools: TierPoolResult[];
  winners: WinnerPayout[];
  nextJackpotRollover: number;
}

interface AppError extends Error {
  statusCode?: number;
}

function createAppError(message: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export class DrawService {
  private drawEngine: DrawEngine;
  private prizeService: PrizeService;

  constructor() {
    this.drawEngine = new DrawEngine();
    this.prizeService = new PrizeService();
  }

  /**
   * Helper to fetch eligible active subscribers and normalize their latest 5 scores into draw entries.
   */
  async getEligibleSubscribersEntries(): Promise<EligibleUserEntry[]> {
    const now = new Date();
    // Active or Trialing subscribers whose currentPeriodEnd has not elapsed
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'TRIALING' },
        ],
        NOT: {
          cancelAtPeriodEnd: true,
          currentPeriodEnd: { lte: now },
        },
      },
      select: { userId: true },
    });

    const userIds = activeSubscriptions.map((s) => s.userId);
    if (userIds.length === 0) return [];

    const eligibleEntries: EligibleUserEntry[] = [];

    for (const userId of userIds) {
      const scores = await prisma.score.findMany({
        where: { userId },
        orderBy: { playedAt: 'desc' },
        take: 5,
        select: { score: true },
      });

      if (scores.length >= 5) {
        const rawScoreValues = scores.map((s) => s.score);
        const normalizedNumbers = normalizeDrawNumbers(rawScoreValues);
        eligibleEntries.push({
          userId,
          numbers: normalizedNumbers,
        });
      }
    }

    return eligibleEntries;
  }

  /**
   * Fetches the 5-number jackpot rollover from the latest published draw before target month/year (or any previous published draw).
   */
  async getPreviousFiveRollover(month: number, year: number): Promise<number> {
    // Find the latest published draw prior to or equal to this draw
    const previousDraw = await prisma.draw.findFirst({
      where: {
        status: DrawStatus.PUBLISHED,
        OR: [
          { year: { lt: year } },
          { year, month: { lt: month } },
        ],
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { prizePools: true },
    });

    if (!previousDraw) return 0;

    const fivePool = previousDraw.prizePools.find((p) => p.matchType === PrizeTier.FIVE);
    if (!fivePool) return 0;

    // Check if previous FIVE pool had any winners
    const fiveWinnersCount = await prisma.drawWinner.count({
      where: {
        drawId: previousDraw.id,
        matchType: PrizeTier.FIVE,
      },
    });

    if (fiveWinnersCount === 0) {
      // 5-number pool rolled over
      return fivePool.totalAmount;
    }

    return 0;
  }

  async createDraw(month: number, year: number, strategy: DrawStrategy) {
    const existing = await prisma.draw.findUnique({
      where: { month_year: { month, year } },
    });

    if (existing) {
      throw createAppError(`Draw already exists for month ${month} and year ${year}`, 400);
    }

    return prisma.draw.create({
      data: {
        month,
        year,
        strategy,
        status: DrawStatus.DRAFT,
        winningNumbers: [],
      },
    });
  }

  async simulateDraw(drawId: string, customRng?: RNG): Promise<SimulationResult> {
    const draw = await prisma.draw.findUnique({ where: { id: drawId } });
    if (!draw) {
      throw createAppError('Draw not found', 404);
    }

    if (draw.status === DrawStatus.PUBLISHED) {
      throw createAppError('Cannot simulate an already published draw', 400);
    }

    const eligibleEntries = await this.getEligibleSubscribersEntries();
    const winningNumbers = this.drawEngine.generateWinningNumbers(
      draw.strategy,
      eligibleEntries,
      customRng
    );

    const tierMatches: Record<PrizeTier, string[]> = {
      [PrizeTier.FIVE]: [],
      [PrizeTier.FOUR]: [],
      [PrizeTier.THREE]: [],
    };

    for (const entry of eligibleEntries) {
      const matchCount = calculateMatchCount(entry.numbers, winningNumbers);
      if (matchCount === 5) {
        tierMatches[PrizeTier.FIVE].push(entry.userId);
      } else if (matchCount === 4) {
        tierMatches[PrizeTier.FOUR].push(entry.userId);
      } else if (matchCount === 3) {
        tierMatches[PrizeTier.THREE].push(entry.userId);
      }
    }

    const previousRollover = await this.getPreviousFiveRollover(draw.month, draw.year);
    const tierPools = this.prizeService.calculateTierPools(
      eligibleEntries.length,
      previousRollover
    );

    const { winners, nextJackpotRollover } = this.prizeService.calculateWinnersAndPayouts(
      tierPools,
      tierMatches
    );

    const simulationResult: SimulationResult = {
      drawId: draw.id,
      month: draw.month,
      year: draw.year,
      strategy: draw.strategy,
      winningNumbers,
      eligibleEntriesCount: eligibleEntries.length,
      matchBreakdown: {
        [PrizeTier.FIVE]: tierMatches[PrizeTier.FIVE].length,
        [PrizeTier.FOUR]: tierMatches[PrizeTier.FOUR].length,
        [PrizeTier.THREE]: tierMatches[PrizeTier.THREE].length,
      },
      prizePools: tierPools,
      winners,
      nextJackpotRollover,
    };

    await prisma.draw.update({
      where: { id: drawId },
      data: {
        status: DrawStatus.SIMULATED,
        winningNumbers,
        simulationResult: simulationResult as unknown as Prisma.InputJsonValue,
      },
    });

    return simulationResult;
  }

  async publishDraw(drawId: string, customRng?: RNG) {
    const draw = await prisma.draw.findUnique({ where: { id: drawId } });
    if (!draw) {
      throw createAppError('Draw not found', 404);
    }

    if (draw.status === DrawStatus.PUBLISHED) {
      throw createAppError('Draw is already published', 400);
    }

    const eligibleEntries = await this.getEligibleSubscribersEntries();
    const winningNumbers = this.drawEngine.generateWinningNumbers(
      draw.strategy,
      eligibleEntries,
      customRng
    );

    const tierMatches: Record<PrizeTier, string[]> = {
      [PrizeTier.FIVE]: [],
      [PrizeTier.FOUR]: [],
      [PrizeTier.THREE]: [],
    };

    for (const entry of eligibleEntries) {
      const matchCount = calculateMatchCount(entry.numbers, winningNumbers);
      if (matchCount === 5) {
        tierMatches[PrizeTier.FIVE].push(entry.userId);
      } else if (matchCount === 4) {
        tierMatches[PrizeTier.FOUR].push(entry.userId);
      } else if (matchCount === 3) {
        tierMatches[PrizeTier.THREE].push(entry.userId);
      }
    }

    const previousRollover = await this.getPreviousFiveRollover(draw.month, draw.year);
    const tierPools = this.prizeService.calculateTierPools(
      eligibleEntries.length,
      previousRollover
    );

    const { winners } = this.prizeService.calculateWinnersAndPayouts(tierPools, tierMatches);

    // Atomic Prisma Transaction
    return prisma.$transaction(async (tx) => {
      // 1. Freeze winning numbers and update draw status to PUBLISHED
      await tx.draw.update({
        where: { id: drawId },
        data: {
          status: DrawStatus.PUBLISHED,
          winningNumbers,
          publishedAt: new Date(),
        },
      });

      // 2. Freeze eligible entries
      for (const entry of eligibleEntries) {
        await tx.drawEntry.create({
          data: {
            drawId,
            userId: entry.userId,
            numbers: entry.numbers,
          },
        });
      }

      // 3. Create Prize Pool records
      for (const pool of tierPools) {
        await tx.prizePool.create({
          data: {
            drawId,
            matchType: pool.matchType,
            percentage: pool.percentage,
            poolAmount: pool.poolAmount,
            rolloverAmount: pool.rolloverAmount,
            totalAmount: pool.totalAmount,
          },
        });
      }

      // 4. Create Draw Winner records
      for (const winner of winners) {
        await tx.drawWinner.create({
          data: {
            drawId,
            userId: winner.userId,
            matchType: winner.matchType,
            prizeAmount: winner.prizeAmount,
          },
        });
      }

      return tx.draw.findUnique({
        where: { id: drawId },
        include: {
          entries: true,
          prizePools: true,
          winners: true,
        },
      });
    });
  }

  async getPublicDraws() {
    return prisma.draw.findMany({
      where: { status: DrawStatus.PUBLISHED },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        prizePools: true,
        winners: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
      },
    });
  }

  async getDrawById(id: string) {
    return prisma.draw.findUnique({
      where: { id },
      include: {
        entries: true,
        prizePools: true,
        winners: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
      },
    });
  }

  async listAllDrawsForAdmin() {
    return prisma.draw.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        prizePools: true,
        _count: {
          select: { entries: true, winners: true },
        },
      },
    });
  }

  async getUserEntry(drawId: string, userId: string) {
    // Check if draw is published
    const existingEntry = await prisma.drawEntry.findUnique({
      where: { drawId_userId: { drawId, userId } },
    });

    if (existingEntry) {
      return existingEntry;
    }

    // If not yet published, check if user is eligible to see draft entry
    const sub = await prisma.subscription.findUnique({
      where: { userId },
    });

    const now = new Date();
    if (!sub) return null;

    const isExpired = Boolean(sub.cancelAtPeriodEnd && sub.currentPeriodEnd && sub.currentPeriodEnd <= now);
    const isActiveOrTrialing = sub.status === 'ACTIVE' || sub.status === 'TRIALING';

    if (!isActiveOrTrialing || isExpired) {
      return null;
    }

    const scores = await prisma.score.findMany({
      where: { userId },
      orderBy: { playedAt: 'desc' },
      take: 5,
      select: { score: true },
    });

    if (scores.length < 5) {
      return null;
    }

    const rawScores = scores.map((s) => s.score);
    const numbers = normalizeDrawNumbers(rawScores);

    return {
      drawId,
      userId,
      numbers,
      isDraftPreview: true,
    };
  }

  async getUserWinnings(userId: string) {
    return prisma.drawWinner.findMany({
      where: { userId },
      include: {
        draw: {
          select: {
            id: true,
            month: true,
            year: true,
            publishedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
