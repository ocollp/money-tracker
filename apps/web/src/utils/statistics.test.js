import { describe, it, expect } from 'vitest';
import { parseCSV, groupByMonth } from './parseCSV.js';
import { computeStatistics, buildEffectiveMortgageSeries } from './statistics.js';

const HEADER = 'date,month,year,type,category,entity,amount\n';

describe('computeStatistics', () => {
  it('returns null for empty months', () => {
    expect(computeStatistics([])).toBeNull();
  });

  it('computes current liquid and change vs previous month', () => {
    const csv =
      HEADER +
      '01/01/2024,1,2024,Cash,Efectivo,Bank,1000\n' +
      '01/02/2024,2,2024,Cash,Efectivo,Bank,1200';
    const months = groupByMonth(parseCSV(csv));
    const stats = computeStatistics(months);
    expect(stats).not.toBeNull();
    expect(stats.current).toBe(1200);
    expect(stats.changeVsPrev).toBe(200);
    expect(stats.changeVsPrevPct).toBeCloseTo((200 / 1000) * 100, 5);
  });

  it('exposes distribution and cash vs invested for latest month', () => {
    const csv =
      HEADER +
      '01/01/2024,1,2024,Cash,Efectivo,Bank,800\n' +
      '01/01/2024,1,2024,Invertido,Fondo,Indexa,200';
    const months = groupByMonth(parseCSV(csv));
    const stats = computeStatistics(months);
    expect(stats.distribution.length).toBeGreaterThan(0);
    expect(stats.cashVsInvested).toHaveLength(1);
    expect(stats.cashVsInvested[0].Cash).toBe(800);
    expect(stats.cashVsInvested[0].Invested).toBe(200);
  });

  it('uses fixed housing value for month-to-month total wealth so housing sheet gaps do not spike', () => {
    const base = {
      shortLabel: 'x',
      label: 'x',
      byEntity: {},
      byEntityLiquid: {},
      byEntityHousing: {},
      cash: 0,
      cashLiquid: 0,
      invested: 0,
      investedLiquid: 0,
      travelFund: 0,
      total: 0,
    };
    const jul = {
      ...base,
      key: '2025-07',
      date: new Date(2025, 6, 1),
      liquidTotal: 100_000,
      housingValue: 0,
      mortgageDebt: -80_000,
    };
    const ago = {
      ...base,
      key: '2025-08',
      date: new Date(2025, 7, 1),
      liquidTotal: 100_000,
      housingValue: 150_000,
      mortgageDebt: -79_000,
      byEntityHousing: { BBVA: { value: 150_000, debt: -79_000 } },
    };
    const without = computeStatistics([jul, ago]);
    const agostoSin = without.heatmap.find((h) => h.key === '2025-08');
    expect(agostoSin.value).toBeGreaterThan(100_000);

    const withFixed = computeStatistics([jul, ago], {
      fixedHousingSheetValue: 150_000,
      fixedHousingSheetEntity: 'BBVA',
    });
    const agostoCon = withFixed.heatmap.find((h) => h.key === '2025-08');
    expect(agostoCon.value).toBe(1000);
  });

  it('backfills mortgage debt before the first Hipoteca row in the sheet', () => {
    const eff = buildEffectiveMortgageSeries([
      { mortgageDebt: 0 },
      { mortgageDebt: -148_000 },
    ]);
    expect(eff[0]).toBe(-148_000);
    expect(eff[1]).toBe(-148_000);
  });

  it('does not show a false -148k total wealth step when Hipoteca starts in August', () => {
    const base = {
      shortLabel: 'x',
      label: 'x',
      byEntity: {},
      byEntityLiquid: {},
      byEntityHousing: {},
      cash: 0,
      cashLiquid: 0,
      invested: 0,
      investedLiquid: 0,
      travelFund: 0,
      total: 0,
      housingValue: 150_000,
    };
    const jul = {
      ...base,
      key: '2025-07',
      date: new Date(2025, 6, 1),
      liquidTotal: 500_000,
      mortgageDebt: 0,
    };
    const ago = {
      ...base,
      key: '2025-08',
      date: new Date(2025, 7, 1),
      liquidTotal: 500_000,
      mortgageDebt: -148_000,
    };
    const stats = computeStatistics([jul, ago]);
    const agosto = stats.heatmap.find((h) => h.key === '2025-08');
    expect(Math.abs(agosto.value)).toBeLessThan(10_000);
  });

  it('adds fixed housing env amount into Hipoteca BBVA slice (value part)', () => {
    const base = {
      shortLabel: 'x',
      label: 'x',
      byEntity: { BBVA: 100_000 },
      byEntityLiquid: { BBVA: 200_000 },
      byEntityHousing: { BBVA: { value: 0, debt: -100_000 } },
      cash: 0,
      cashLiquid: 0,
      invested: 0,
      investedLiquid: 0,
      travelFund: 0,
      total: 100_000,
    };
    const m = {
      ...base,
      key: '2025-08',
      date: new Date(2025, 7, 1),
      liquidTotal: 200_000,
      housingValue: 0,
      mortgageDebt: -100_000,
    };
    const stats = computeStatistics([m], {
      fixedHousingSheetValue: 150_000,
      fixedHousingSheetEntity: 'BBVA',
    });
    const compte = stats.distribution.find((d) => d.name === 'Compte corrent BBVA');
    const hip = stats.distribution.find((d) => d.name === 'Hipoteca BBVA');
    expect(compte.value).toBe(200_000);
    expect(hip.value).toBe(50_000);
  });
});
