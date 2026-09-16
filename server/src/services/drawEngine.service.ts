import { DrawStrategy } from '@prisma/client';

export type RNG = () => number;

export interface IDrawStrategy {
  generateWinningNumbers(entries?: { numbers: number[] }[], rng?: RNG): number[];
}

export class RandomDrawStrategy implements IDrawStrategy {
  generateWinningNumbers(_entries: { numbers: number[] }[] = [], rng: RNG = Math.random): number[] {
    const selected = new Set<number>();
    while (selected.size < 5) {
      // Scale rng() [0, 1) to integer [1, 45]
      const r = rng();
      const num = Math.floor(r * 45) + 1;
      if (num >= 1 && num <= 45) {
        selected.add(num);
      }
    }
    return Array.from(selected).sort((a, b) => a - b);
  }
}

export class ScoreWeightedDrawStrategy implements IDrawStrategy {
  generateWinningNumbers(entries: { numbers: number[] }[] = [], rng: RNG = Math.random): number[] {
    // Calculate frequencies of 1..45
    const freqMap: Record<number, number> = {};
    for (let i = 1; i <= 45; i++) {
      freqMap[i] = 0;
    }

    for (const entry of entries) {
      for (const num of entry.numbers) {
        if (num >= 1 && num <= 45) {
          freqMap[num] = (freqMap[num] || 0) + 1;
        }
      }
    }

    // Prepare items with weights. If total weight is 0, give each item weight 1.
    const items: { num: number; weight: number }[] = [];
    let totalWeight = 0;

    for (let i = 1; i <= 45; i++) {
      const weight = freqMap[i] || 0;
      items.push({ num: i, weight });
      totalWeight += weight;
    }

    if (totalWeight === 0) {
      for (const item of items) {
        item.weight = 1;
      }
    }

    // Weighted sampling without replacement
    const selected: number[] = [];
    const pool = [...items];

    while (selected.length < 5 && pool.length > 0) {
      const currentTotalWeight = pool.reduce((sum, item) => sum + item.weight, 0);

      if (currentTotalWeight === 0) {
        // Fall back to picking remaining unselected items uniformly
        const randomIndex = Math.floor(rng() * pool.length);
        const picked = pool.splice(randomIndex, 1)[0];
        selected.push(picked.num);
        continue;
      }

      const randomWeight = rng() * currentTotalWeight;
      let cumulativeWeight = 0;
      let pickedIndex = -1;

      for (let i = 0; i < pool.length; i++) {
        cumulativeWeight += pool[i].weight;
        if (randomWeight <= cumulativeWeight) {
          pickedIndex = i;
          break;
        }
      }

      if (pickedIndex === -1) {
        pickedIndex = pool.length - 1;
      }

      const picked = pool.splice(pickedIndex, 1)[0];
      selected.push(picked.num);
    }

    return selected.sort((a, b) => a - b);
  }
}

export class DrawEngine {
  private strategies: Record<DrawStrategy, IDrawStrategy>;

  constructor() {
    this.strategies = {
      [DrawStrategy.RANDOM]: new RandomDrawStrategy(),
      [DrawStrategy.SCORE_WEIGHTED]: new ScoreWeightedDrawStrategy(),
    };
  }

  generateWinningNumbers(
    strategy: DrawStrategy,
    entries: { numbers: number[] }[] = [],
    rng: RNG = Math.random
  ): number[] {
    const selectedStrategy = this.strategies[strategy];
    if (!selectedStrategy) {
      throw new Error(`Unsupported draw strategy: ${strategy}`);
    }
    return selectedStrategy.generateWinningNumbers(entries, rng);
  }
}

/**
 * Calculates match count (0-5) between user entry numbers and winning numbers.
 * Assumes numbers are unique in 1-45.
 */
export function calculateMatchCount(entryNumbers: number[], winningNumbers: number[]): number {
  const winningSet = new Set(winningNumbers);
  let matches = 0;
  for (const num of entryNumbers) {
    if (winningSet.has(num)) {
      matches++;
    }
  }
  return matches;
}
