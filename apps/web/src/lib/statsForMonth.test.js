import { describe, it, expect } from 'vitest';
import { computeStatisticsAsOf } from './statsForMonth.js';

describe('computeStatisticsAsOf', () => {
  const months = [
    {
      key: '2024-01',
      date: new Date(2024, 0, 1),
      shortLabel: 'Gen 24',
      label: 'Gen 2024',
      liquidTotal: 1000,
      byEntity: {},
      byEntityLiquid: { Bank: 1000 },
      byEntityHousing: {},
      cash: 1000,
      cashLiquid: 1000,
      invested: 0,
      investedLiquid: 0,
      travelFund: 0,
      total: 1000,
      housingValue: 0,
      mortgageDebt: 0,
    },
    {
      key: '2024-02',
      date: new Date(2024, 1, 1),
      shortLabel: 'Feb 24',
      label: 'Feb 2024',
      liquidTotal: 1500,
      byEntity: {},
      byEntityLiquid: { Bank: 1500 },
      byEntityHousing: {},
      cash: 1500,
      cashLiquid: 1500,
      invested: 0,
      investedLiquid: 0,
      travelFund: 0,
      total: 1500,
      housingValue: 0,
      mortgageDebt: 0,
    },
  ];

  it('returns stats with selected month as current', () => {
    const jan = computeStatisticsAsOf(months, '2024-01');
    const feb = computeStatisticsAsOf(months, '2024-02');
    expect(jan.current).toBe(1000);
    expect(jan.dataAsOf.key).toBe('2024-01');
    expect(feb.current).toBe(1500);
    expect(feb.dataAsOf.key).toBe('2024-02');
    expect(feb.changeVsPrev).toBe(500);
  });

  it('returns null for unknown month key', () => {
    expect(computeStatisticsAsOf(months, '2099-01')).toBeNull();
  });
});
