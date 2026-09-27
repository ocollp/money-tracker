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
    expect(agostoSin.value).toBe(1000);

    const withFixed = computeStatistics([jul, ago], {
      fixedHousingSheetValue: 150_000,
      fixedHousingSheetEntity: 'BBVA',
    });
    const agostoCon = withFixed.heatmap.find((h) => h.key === '2025-08');
    expect(agostoCon.value).toBe(1000);
  });

  it('KPI total month change excludes travel fund delta (matches heatmap)', () => {
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
      total: 0,
    };
    const jul = {
      ...base,
      key: '2025-07',
      date: new Date(2025, 6, 1),
      liquidTotal: 500_000,
      travelFund: 30_000,
      housingValue: 150_000,
      mortgageDebt: -100_000,
    };
    const ago = {
      ...base,
      key: '2025-08',
      date: new Date(2025, 7, 1),
      liquidTotal: 483_000,
      travelFund: 15_000,
      housingValue: 150_000,
      mortgageDebt: -100_000,
    };
    const stats = computeStatistics([jul, ago]);
    expect(stats.changeVsPrevTotal).toBe(-17_000);
    const agosto = stats.heatmap.find((h) => h.key === '2025-08');
    expect(agosto.value).toBe(-17_000);
    expect(stats.travel.changeVsPrev).toBe(-15_000);
    expect(stats.travel.changeVsPrevPct).toBe(-50);
  });

  it('exposes patrimony breakdown as liquid + travel + housing', () => {
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
      total: 0,
    };
    const jul = {
      ...base,
      key: '2025-07',
      date: new Date(2025, 6, 1),
      liquidTotal: 54_141,
      travelFund: 400,
      housingValue: 150_000,
      mortgageDebt: -111_355,
    };
    const ago = {
      ...base,
      key: '2025-08',
      date: new Date(2025, 7, 1),
      liquidTotal: 54_192,
      travelFund: 750,
      housingValue: 150_000,
      mortgageDebt: -111_109,
    };
    const stats = computeStatistics([jul, ago]);
    expect(stats.patrimonyBreakdown).toEqual({
      liquid: 51,
      travel: 175,
      housing: 246,
      total: 472,
    });
    expect(stats.patrimonyKpiChangeVsPrev).toBe(472);
  });

  it('heatmap uses carried housing value so first Vivienda row does not fake +150k total change', () => {
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
      liquidTotal: 500_000,
      housingValue: 0,
      mortgageDebt: -148_000,
    };
    const ago = {
      ...base,
      key: '2025-08',
      date: new Date(2025, 7, 1),
      liquidTotal: 465_000,
      housingValue: 150_000,
      mortgageDebt: -148_000,
    };
    const stats = computeStatistics([jul, ago]);
    const agosto = stats.heatmap.find((h) => h.key === '2025-08');
    expect(agosto.value).toBe(-35_000);
  });

  it('net worth chart MoM matches heatmap (liquid + housing, excludes travel)', () => {
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
      total: 0,
    };
    const jul = {
      ...base,
      key: '2025-07',
      date: new Date(2025, 6, 1),
      liquidTotal: 54_141,
      travelFund: 400,
      housingValue: 150_000,
      mortgageDebt: -111_355,
    };
    const ago = {
      ...base,
      key: '2025-08',
      date: new Date(2025, 7, 1),
      liquidTotal: 54_192,
      travelFund: 750,
      housingValue: 150_000,
      mortgageDebt: -111_109,
    };
    const stats = computeStatistics([jul, ago]);
    const julIdx = stats.netWorthMonths.findIndex((m) => m.key === '2025-07');
    const agoIdx = stats.netWorthMonths.findIndex((m) => m.key === '2025-08');
    const chartDelta = stats.netWorthTotals[agoIdx] - stats.netWorthTotals[julIdx];
    const heat = stats.heatmap.find((h) => h.key === '2025-08');
    expect(chartDelta).toBe(heat.value);
    expect(stats.netWorthTotals[agoIdx] - stats.netWorthTotals[julIdx]).toBe(51 + 246);
  });


  it('keeps net worth chart on liquid-only series for tertiary profile', () => {
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
      total: 0,
    };
    const jul = {
      ...base,
      key: '2025-07',
      date: new Date(2025, 6, 1),
      liquidTotal: 10_000,
      housingValue: 150_000,
      mortgageDebt: -100_000,
    };
    const ago = {
      ...base,
      key: '2025-08',
      date: new Date(2025, 7, 1),
      liquidTotal: 10_100,
      housingValue: 150_000,
      mortgageDebt: -99_000,
    };
    const stats = computeStatistics([jul, ago], { profileId: 'tertiary' });
    const julIdx = stats.netWorthMonths.findIndex((m) => m.key === '2025-07');
    const agoIdx = stats.netWorthMonths.findIndex((m) => m.key === '2025-08');
    expect(stats.netWorthTotals[agoIdx] - stats.netWorthTotals[julIdx]).toBe(100);
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

  it('excludes housing from total wealth before the first Hipoteca month', () => {
    const base = {
      shortLabel: 'x',
      label: 'x',
      byEntity: { Bank: 86_000 },
      byEntityLiquid: { Bank: 86_000 },
      byEntityHousing: {},
      cash: 86_000,
      cashLiquid: 86_000,
      invested: 0,
      investedLiquid: 0,
      travelFund: 0,
      total: 86_000,
      housingValue: 150_000,
      mortgageDebt: 0,
    };
    const may = {
      ...base,
      key: '2025-05',
      date: new Date(2025, 4, 1),
      liquidTotal: 86_000,
    };
    const ago = {
      ...base,
      key: '2025-08',
      date: new Date(2025, 7, 1),
      liquidTotal: 80_000,
      mortgageDebt: -148_000,
    };
    const all = computeStatistics([may, ago], {
      fixedHousingSheetValue: 150_000,
      fixedHousingSheetEntity: 'BBVA',
    });
    const asOfMay = computeStatistics([may], {
      fixedHousingSheetValue: 150_000,
      fixedHousingSheetEntity: 'BBVA',
    });
    expect(all.hasHousing).toBe(true);
    expect(asOfMay.hasHousing).toBe(false);
    expect(asOfMay.currentTotalWealth).toBe(86_000);
    const mayIdx = all.netWorthMonths.findIndex((m) => m.key === '2025-05');
    expect(all.netWorthTotals[mayIdx]).toBe(86_000);
  });
});

describe('housing deposits', () => {
  const csv = 'Fecha,Tipo,Categoria,Entidad,Cantidad\n' +
    '1/05/2025,Cash,Cuenta corriente,BBVA,60000\n' +
    '1/06/2025,Cash,Cuenta corriente,BBVA,45000\n' +
    '1/06/2025,Invertido,Arras vivienda,Anticipo vivienda,15000\n' +
    '1/07/2025,Cash,Cuenta corriente,BBVA,45000\n' +
    '1/07/2025,Invertido,Arras vivienda,Anticipo vivienda,15000\n' +
    '1/08/2025,Cash,Cuenta corriente,BBVA,20500\n' +
    '1/08/2025,Invertido,Vivienda personal,BBVA,150000\n' +
    '1/08/2025,Invertido,Hipoteca,BBVA,-116500';
  it('keeps deposits out of liquid assets and records only actual purchase costs as a loss', () => {
    const months = groupByMonth(parseCSV(csv));
    const stats = computeStatistics(months, { profileId: 'primary' });
    expect(months[1].liquidTotal).toBe(45000);
    expect(stats.netWorthTotals).toEqual([60000, 60000, 60000, 54000]);
    expect(stats.heatmap.map(m => m.value)).toEqual([0, 0, -6000]);
    expect(stats.housing.equity).toBe(33500);
    const beforeSigning = computeStatistics(months.slice(0, 3), { profileId: 'primary', fixedHousingSheetValue: 150000 });
    expect(beforeSigning.current).toBe(45000);
    expect(beforeSigning.currentTotalWealth).toBe(60000);
    expect(beforeSigning.housing.debt).toBe(0);
    expect(beforeSigning.distribution.find(d => d.name === 'Anticipo vivienda').value).toBe(15000);
  });
});

it('calculates Olga June 2025 from the supplied balances and May deposit payment', () => {
  const may = [3189,560,1337,4055,45899,4051,721,500,9403,2091,7000,1711,2360,4425];
  const june = [39850,566,451,0,10000,4899,1028,600,2114,5000,1805,2585,4632];
  const rows = ['Fecha,Tipo,Categoria,Entidad,Cantidad',
    ...may.map((v,i) => `1/05/2025,Cash,Cuenta corriente,Bank ${i},${v}`),
    ...june.map((v,i) => `1/06/2025,Cash,Cuenta corriente,Bank ${i},${v}`),
    '1/06/2025,Invertido,Arras vivienda,Anticipo vivienda,15000'];
  const stats = computeStatistics(groupByMonth(parseCSV(rows.join('\n'))), { profileId: 'primary', fixedHousingSheetValue: 150000 });
  expect(stats.current).toBe(73530);
  expect(stats.currentTotalWealth).toBe(88530);
  expect(stats.heatmap.find(m => m.key === '2025-06').value).toBe(1228);
});
