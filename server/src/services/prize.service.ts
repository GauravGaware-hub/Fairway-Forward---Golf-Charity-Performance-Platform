import { PrizeTier } from '@prisma/client';

export interface TierPoolResult {
  matchType: PrizeTier;
  percentage: number;
  poolAmount: number;
  rolloverAmount: number;
  totalAmount: number;
}

export interface WinnerPayout {
  userId: string;
  matchType: PrizeTier;
  prizeAmount: number;
}

export interface PrizeCalculationResult {
  prizePools: TierPoolResult[];
  winners: WinnerPayout[];
  nextJackpotRollover: number;
}

export class PrizeService {
  /**
   * Calculates total prize pool and per-tier allocation in integer minor units (paise).
   * Default subscription monthly rate: 1000 paise (or standard monthly unit rate).
   * Prize Pool Percentage: derived from PRIZE_POOL_PERCENTAGE env (default 50%).
   */
  calculateTierPools(
    activeSubscriberCount: number,
    previousFiveRollover: number = 0,
    subscriptionFeeMinorUnits: number = 1000,
    prizePoolPercentage: number = Number(process.env.PRIZE_POOL_PERCENTAGE || 50)
  ): TierPoolResult[] {
    const totalRevenue = activeSubscriberCount * subscriptionFeeMinorUnits;
    const totalPrizePool = Math.floor((totalRevenue * prizePoolPercentage) / 100);

    const fivePool = Math.floor(totalPrizePool * 0.40);
    const fourPool = Math.floor(totalPrizePool * 0.35);
    const threePool = Math.floor(totalPrizePool * 0.25);

    return [
      {
        matchType: PrizeTier.FIVE,
        percentage: 40,
        poolAmount: fivePool,
        rolloverAmount: previousFiveRollover,
        totalAmount: fivePool + previousFiveRollover,
      },
      {
        matchType: PrizeTier.FOUR,
        percentage: 35,
        poolAmount: fourPool,
        rolloverAmount: 0,
        totalAmount: fourPool,
      },
      {
        matchType: PrizeTier.THREE,
        percentage: 25,
        poolAmount: threePool,
        rolloverAmount: 0,
        totalAmount: threePool,
      },
    ];
  }

  /**
   * Calculates winner payouts and calculates rollover for the next draw.
   * If FIVE tier has 0 winners, totalAmount rolls over to next draw's FIVE jackpot.
   * If FOUR or THREE tiers have 0 winners, no rollover occurs.
   */
  calculateWinnersAndPayouts(
    tierPools: TierPoolResult[],
    tierMatches: Record<PrizeTier, string[]>
  ): { winners: WinnerPayout[]; nextJackpotRollover: number } {
    const winners: WinnerPayout[] = [];
    let nextJackpotRollover = 0;

    for (const pool of tierPools) {
      const matchUsers = tierMatches[pool.matchType] || [];
      const winnerCount = matchUsers.length;

      if (winnerCount > 0) {
        const prizePerWinner = Math.floor(pool.totalAmount / winnerCount);
        for (const userId of matchUsers) {
          winners.push({
            userId,
            matchType: pool.matchType,
            prizeAmount: prizePerWinner,
          });
        }
      } else {
        // No winners in this tier
        if (pool.matchType === PrizeTier.FIVE) {
          // 5-number jackpot rolls over
          nextJackpotRollover = pool.totalAmount;
        }
      }
    }

    return { winners, nextJackpotRollover };
  }
}
