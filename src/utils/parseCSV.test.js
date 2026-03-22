import { describe, it, expect } from 'vitest';
import { parseCSV, groupByMonth } from './parseCSV.js';

const HEADER = 'date,month,year,type,category,entity,amount\n';

describe('parseCSV', () => {
  it('parses valid rows and skips header', () => {
    const csv =
      HEADER +
      '01/01/2024,1,2024,Cash,Efectivo,Bank,1000\n' +
      '01/02/2024,2,2024,Cash,Efectivo,Bank,1100';
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      month: 1,
      year: 2024,
      type: 'Cash',
      category: 'Efectivo',
      entity: 'Bank',
      amount: 1000,
      isHousing: false,
    });
    expect(rows[1].amount).toBe(1100);
  });

  it('marks housing rows', () => {
    const csv =
      HEADER +
      '01/01/2024,1,2024,Invertido,Vivienda personal,BBVA,150000\n' +
      '01/01/2024,1,2024,Invertido,Hipoteca,BBVA,-200000';
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].isHousing).toBe(true);
    expect(rows[1].isHousing).toBe(true);
  });

  it('normalizes entity whitespace', () => {
    const csv = HEADER + '01/01/2024,1,2024,Cash,Efectivo,La   Caixa,500';
    const rows = parseCSV(csv);
    expect(rows[0].entity).toBe('La Caixa');
  });

  it('parses European-style thousands in amount column (single field)', () => {
    const csv = HEADER + '01/01/2024,1,2024,Cash,Efectivo,Bank,1.500';
    const rows = parseCSV(csv);
    expect(rows[0].amount).toBe(1500);
  });

  it('skips invalid or empty lines', () => {
    const csv =
      HEADER +
      '01/01/2024,1,2024,Cash,Efectivo,Bank,abc\n' +
      ',,,,,,\n' +
      '01/01/2024,1,2024,Cash,Efectivo,Bank,100';
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(100);
  });
});

describe('groupByMonth', () => {
  it('aggregates liquid and cash totals', () => {
    const csv =
      HEADER +
      '01/01/2024,1,2024,Cash,Efectivo,Bank,1000\n' +
      '15/01/2024,1,2024,Invertido,Fondo,Indexa,500';
    const rows = parseCSV(csv);
    const months = groupByMonth(rows);
    expect(months).toHaveLength(1);
    const m = months[0];
    expect(m.liquidTotal).toBe(1500);
    expect(m.cashLiquid).toBe(1000);
    expect(m.investedLiquid).toBe(500);
    expect(m.key).toBe('2024-01');
  });

  it('sorts months chronologically', () => {
    const csv =
      HEADER +
      '01/02/2024,2,2024,Cash,Efectivo,Bank,100\n' +
      '01/01/2024,1,2024,Cash,Efectivo,Bank,200';
    const months = groupByMonth(parseCSV(csv));
    expect(months.map((m) => m.key)).toEqual(['2024-01', '2024-02']);
  });
});
