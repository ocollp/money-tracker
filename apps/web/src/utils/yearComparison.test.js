import { describe, it, expect } from 'vitest';
import { buildYearComparison } from './statistics.js';

describe('buildYearComparison', () => {
  it('returns years sorted ascending', () => {
    const summary = {
      2026: { year: 2026, total: 2_000, months: 4, positive: 3, negative: 1 },
      2024: { year: 2024, total: 10_000, months: 12, positive: 8, negative: 4 },
    };
    expect(buildYearComparison(summary).map((y) => y.year)).toEqual([2024, 2026]);
  });
});
