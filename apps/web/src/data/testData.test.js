import { describe, it, expect } from 'vitest';
import { getTestStats, getTestMonths } from './testData.js';

describe('getTestStats', () => {
  it('returns rich stats from synthetic CSV', () => {
    const stats = getTestStats();
    expect(stats).not.toBeNull();
    expect(stats.months.length).toBeGreaterThan(18);
    expect(stats.current).toBeGreaterThan(0);
    expect(stats.hasHousing).toBe(true);
    expect(stats.hasTravel).toBe(true);
  });

  it('keeps housing equity consistent with value and debt', () => {
    const { housing } = getTestStats();
    const expected = housing.value - housing.debt;
    expect(Math.round(housing.equity)).toBe(Math.round(expected));
    expect(housing.equity).toBeGreaterThan(0);
  });

  it('has monotonically decreasing mortgage principal in evolution', () => {
    const { housing } = getTestStats();
    expect(housing.evolution.length).toBeGreaterThan(5);
    let prev = Infinity;
    for (const point of housing.evolution) {
      expect(point.debt).toBeLessThanOrEqual(prev);
      expect(point.debt).toBeGreaterThan(0);
      prev = point.debt;
    }
  });

  it('aligns total wealth with liquid + housing equity + travel slice', () => {
    const stats = getTestStats();
    const last = stats.months[stats.months.length - 1];
    const travelRaw = last.travelFund || 0;
    const travelInWealth = travelRaw; // TRAVEL_PATRIMONY_SHARE default 1 in tests unless env set
    const manual =
      last.liquidTotal +
      (last.housingValue || 0) +
      (last.mortgageDebt || 0) +
      travelInWealth;
    expect(Math.round(stats.currentTotalWealth)).toBe(Math.round(manual));
  });

  it('marks configured gastos months as negative liquid change vs prior', () => {
    const months = getTestMonths();
    for (const key of ['2024-06', '2025-04']) {
      const idx = months.findIndex((m) => m.key === key);
      expect(idx, `month ${key}`).toBeGreaterThan(0);
      const cur = months[idx];
      const prev = months[idx - 1];
      expect(cur.liquidTotal - prev.liquidTotal).toBeLessThan(0);
    }
  });

  it('exposes finite distribution and heatmap', () => {
    const stats = getTestStats();
    const sumPct = stats.distribution.reduce((s, d) => s + d.pct, 0);
    expect(sumPct).toBeCloseTo(100, 0);
    expect(stats.heatmap.every((h) => Number.isFinite(h.value))).toBe(true);
  });
});
