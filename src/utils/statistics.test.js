import { describe, it, expect } from 'vitest';
import { parseCSV, groupByMonth } from './parseCSV.js';
import { computeStatistics } from './statistics.js';

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
});
