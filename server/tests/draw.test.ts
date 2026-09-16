import { DrawStatus, DrawStrategy, PrizeTier, Role } from '@prisma/client';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { supabaseServer } from '../src/config/supabase.js';
import { calculateMatchCount, RandomDrawStrategy, ScoreWeightedDrawStrategy } from '../src/services/drawEngine.service.js';
import { PrizeService } from '../src/services/prize.service.js';
import { normalizeDrawNumbers } from '../src/utils/numberNormalizer.js';

vi.mock('../src/config/supabase.js', () => ({
  supabaseServer: { auth: { getUser: vi.fn() } },
}));

vi.mock('../src/config/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    subscription: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    score: {
      findMany: vi.fn(),
    },
    draw: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    drawEntry: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    prizePool: {
      create: vi.fn(),
    },
    drawWinner: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

const mockUser = {
  id: 'user-1',
  email: 'golfer@example.com',
  role: Role.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAdmin = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: Role.ADMIN,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Draw System & Prize Pool Engine Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Number Normalization Unit Tests
  describe('normalizeDrawNumbers Utility', () => {
    it('returns 5 sorted unique numbers when inputs are already unique', () => {
      const scores = [41, 35, 29, 38, 32];
      const result = normalizeDrawNumbers(scores);
      expect(result).toEqual([29, 32, 35, 38, 41]);
    });

    it('resolves duplicate score values deterministically using cyclic forward replacement', () => {
      // 29 is duplicated. 29 -> 30
      const scores = [29, 29, 35, 38, 41];
      const result = normalizeDrawNumbers(scores);
      expect(result).toEqual([29, 30, 35, 38, 41]);
    });

    it('wraps 45 -> 1 when 45 is duplicated and 1 is available', () => {
      const scores = [45, 45, 10, 20, 30];
      const result = normalizeDrawNumbers(scores);
      // 45 is placed first. Second 45 wraps to 1.
      expect(result).toEqual([1, 10, 20, 30, 45]);
    });

    it('throws error if fewer than 5 scores are provided', () => {
      expect(() => normalizeDrawNumbers([10, 20, 30])).toThrow('At least 5 scores');
    });
  });

  // 2. Draw Strategy Unit Tests
  describe('Draw Strategies', () => {
    it('RandomDrawStrategy generates 5 unique numbers in 1-45 deterministically with injected RNG', () => {
      const strategy = new RandomDrawStrategy();
      // Mock RNG returning sequential floats
      let step = 0;
      const fakeRng = () => {
        step++;
        return step * 0.1; // 0.1 -> 5, 0.2 -> 10, 0.3 -> 14, 0.4 -> 19, 0.5 -> 23
      };

      const numbers = strategy.generateWinningNumbers([], fakeRng);
      expect(numbers).toHaveLength(5);
      expect(new Set(numbers).size).toBe(5);
      numbers.forEach((n) => expect(n).toBeGreaterThanOrEqual(1));
      numbers.forEach((n) => expect(n).toBeLessThanOrEqual(45));
    });

    it('ScoreWeightedDrawStrategy weights selection by frequency deterministically with injected RNG', () => {
      const strategy = new ScoreWeightedDrawStrategy();
      const entries = [
        { numbers: [10, 20, 30, 40, 45] },
        { numbers: [10, 20, 30, 40, 45] },
        { numbers: [10, 20, 30, 40, 45] },
      ];

      const fakeRng = () => {
        return 0.01; // Picks top weighted candidates
      };

      const numbers = strategy.generateWinningNumbers(entries, fakeRng);
      expect(numbers).toHaveLength(5);
      expect(new Set(numbers).size).toBe(5);
      expect(numbers).toEqual([10, 20, 30, 40, 45]);
    });
  });

  // 3. Match Calculation Unit Tests
  describe('calculateMatchCount', () => {
    const winningNumbers = [5, 12, 23, 34, 42];

    it('calculates 0 matches correctly', () => {
      expect(calculateMatchCount([1, 2, 3, 4, 6], winningNumbers)).toBe(0);
    });

    it('calculates 3 matches correctly', () => {
      expect(calculateMatchCount([5, 12, 23, 1, 2], winningNumbers)).toBe(3);
    });

    it('calculates 5 matches correctly', () => {
      expect(calculateMatchCount([5, 12, 23, 34, 42], winningNumbers)).toBe(5);
    });
  });

  // 4. Prize Allocation & Rollover Unit Tests
  describe('PrizeService Math & Rollover', () => {
    const prizeService = new PrizeService();

    it('allocates minor unit prize pool splits (40% FIVE, 35% FOUR, 25% THREE)', () => {
      // 10 subscribers @ 1000 paise = 10000 paise revenue. 50% pool = 5000 paise.
      const pools = prizeService.calculateTierPools(10, 0, 1000, 50);

      const five = pools.find((p) => p.matchType === PrizeTier.FIVE)!;
      const four = pools.find((p) => p.matchType === PrizeTier.FOUR)!;
      const three = pools.find((p) => p.matchType === PrizeTier.THREE)!;

      expect(five.poolAmount).toBe(2000); // 40% of 5000
      expect(four.poolAmount).toBe(1750); // 35% of 5000
      expect(three.poolAmount).toBe(1250); // 25% of 5000
    });

    it('splits tier pool equally among multiple winners', () => {
      const pools = prizeService.calculateTierPools(10, 0, 1000, 50);
      const tierMatches = {
        [PrizeTier.FIVE]: ['u1'],
        [PrizeTier.FOUR]: ['u2', 'u3'],
        [PrizeTier.THREE]: [],
      };

      const { winners } = prizeService.calculateWinnersAndPayouts(pools, tierMatches);

      const u1Payout = winners.find((w) => w.userId === 'u1')!;
      expect(u1Payout.prizeAmount).toBe(2000);

      const u2Payout = winners.find((w) => w.userId === 'u2')!;
      const u3Payout = winners.find((w) => w.userId === 'u3')!;
      expect(u2Payout.prizeAmount).toBe(875); // 1750 / 2
      expect(u3Payout.prizeAmount).toBe(875);
    });

    it('rolls over 5-number jackpot when 0 five-number winners exist, but NOT four/three tiers', () => {
      const pools = prizeService.calculateTierPools(10, 500, 1000, 50);
      // Total FIVE pool = 2000 + 500 rollover = 2500
      const tierMatches = {
        [PrizeTier.FIVE]: [],
        [PrizeTier.FOUR]: [],
        [PrizeTier.THREE]: [],
      };

      const { nextJackpotRollover } = prizeService.calculateWinnersAndPayouts(pools, tierMatches);
      expect(nextJackpotRollover).toBe(2500); // 2500 rolls over to next draw
    });
  });

  // 5. Admin Authorization & Draw Lifecycle Integration Tests
  describe('Admin Endpoints & RBAC', () => {
    it('rejects non-admin user trying to create a draw', async () => {
      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'user-1', email: 'golfer@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/admin/draws')
        .set('Authorization', 'Bearer user-token')
        .send({ month: 10, year: 2026, strategy: 'RANDOM' });

      expect(response.status).toBe(403);
    });

    it('allows admin to create draft draw', async () => {
      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockAdmin);
      (prisma.draw.findUnique as any).mockResolvedValue(null);
      (prisma.draw.create as any).mockResolvedValue({
        id: 'draw-1',
        month: 10,
        year: 2026,
        strategy: DrawStrategy.RANDOM,
        status: DrawStatus.DRAFT,
        winningNumbers: [],
      });

      const response = await request(app)
        .post('/api/v1/admin/draws')
        .set('Authorization', 'Bearer admin-token')
        .send({ month: 10, year: 2026, strategy: 'RANDOM' });

      expect(response.status).toBe(201);
      expect(response.body.data.draw.status).toBe('DRAFT');
    });

    it('allows admin to simulate a draft draw', async () => {
      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockAdmin);
      (prisma.draw.findUnique as any).mockResolvedValue({
        id: 'draw-1',
        month: 10,
        year: 2026,
        strategy: DrawStrategy.RANDOM,
        status: DrawStatus.DRAFT,
        winningNumbers: [],
      });
      (prisma.subscription.findMany as any).mockResolvedValue([]);
      (prisma.draw.update as any).mockResolvedValue({});

      const response = await request(app)
        .post('/api/v1/admin/draws/draw-1/simulate')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.data.simulation).toHaveProperty('winningNumbers');
    });

    it('prevents simulating or modifying an already published draw', async () => {
      (supabaseServer.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
        error: null,
      });
      (prisma.user.findUnique as any).mockResolvedValue(mockAdmin);
      (prisma.draw.findUnique as any).mockResolvedValue({
        id: 'draw-published',
        month: 9,
        year: 2026,
        strategy: DrawStrategy.RANDOM,
        status: DrawStatus.PUBLISHED,
        winningNumbers: [1, 2, 3, 4, 5],
      });

      const response = await request(app)
        .post('/api/v1/admin/draws/draw-published/simulate')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('published');
    });
  });

  // 6. User / Public Endpoint Tests
  describe('Public & User Endpoints', () => {
    it('returns published draws on GET /api/v1/draws', async () => {
      (prisma.draw.findMany as any).mockResolvedValue([
        {
          id: 'draw-pub-1',
          month: 9,
          year: 2026,
          strategy: DrawStrategy.RANDOM,
          status: DrawStatus.PUBLISHED,
          winningNumbers: [5, 10, 15, 20, 25],
          publishedAt: new Date(),
          prizePools: [],
          winners: [],
        },
      ]);

      const response = await request(app).get('/api/v1/draws');

      expect(response.status).toBe(200);
      expect(response.body.data.draws).toHaveLength(1);
      expect(response.body.data.draws[0].winningNumbers).toEqual([5, 10, 15, 20, 25]);
    });
  });
});
