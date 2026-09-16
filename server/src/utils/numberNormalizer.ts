/**
 * Deterministically normalizes an array of score numbers (1-45) into 5 unique draw numbers.
 * Duplicate score values are resolved by searching forward cyclically:
 * candidate + 1, wrapping 45 -> 1, until an unused number is found.
 * Final 5 unique numbers are sorted in ascending order.
 */
export function normalizeDrawNumbers(scores: number[]): number[] {
  if (!scores || scores.length < 5) {
    throw new Error('At least 5 scores are required to generate a draw entry');
  }

  const result: number[] = [];

  for (let i = 0; i < 5; i++) {
    let candidate = scores[i];

    // Ensure candidate is in 1-45 range initially
    if (candidate < 1) candidate = 1;
    if (candidate > 45) candidate = 45;

    // Cyclic forward search if candidate is already in result
    while (result.includes(candidate)) {
      candidate = candidate === 45 ? 1 : candidate + 1;
    }

    result.push(candidate);
  }

  return result.sort((a, b) => a - b);
}
