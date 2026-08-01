import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  parseSheetMatrix,
  groupByMonth,
  mergeFixedHousingSheetRows,
  parseSheetDate,
} from './parseCSV.js';

const HEADER = 'date,month,year,type,category,entity,amount\n';
const HEADER_COMPACT = 'date,type,category,entity,amount\n';

describe('parseSheetDate', () => {
  it('parses day-first European dates', () => {
    expect(parseSheetDate('1/03/2024')).toEqual({ day: 1, month: 3, year: 2024 });
    expect(parseSheetDate('01-03-24')).toEqual({ day: 1, month: 3, year: 2024 });
  });
});

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
      isTravel: false,
    });
    expect(rows[1].amount).toBe(1100);
  });

  it('parses compact layout without Mes/Año columns using Fecha', () => {
    const csv =
      HEADER_COMPACT +
      '1/03/2024,Cash,Cuenta corriente,CaixaBank,17258\n' +
      '1/04/2024,Invertido,Fondo indexado,Indexa Capital,8957';
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      month: 3,
      year: 2024,
      type: 'Cash',
      category: 'Cuenta corriente',
      entity: 'CaixaBank',
      amount: 17258,
    });
    expect(rows[1]).toMatchObject({ month: 4, year: 2024, amount: 8957 });
  });

  it('parseSheetMatrix matches parseCSV for the same compact rows', () => {
    const values = [
      ['Fecha', 'Cash/Inversión', 'Categoria', 'Entidad', 'Cantidad'],
      ['1/03/2024', 'Cash', 'Cuenta corriente', 'CaixaBank', '17258'],
      ['1/08/2026', 'Cash', 'Cash', 'Efectivo', '115'],
    ];
    const fromMatrix = parseSheetMatrix(values);
    const fromCsv = parseCSV(
      'Fecha,Cash/Inversión,Categoria,Entidad,Cantidad\n' +
        '1/03/2024,Cash,Cuenta corriente,CaixaBank,17258\n' +
        '1/08/2026,Cash,Cash,Efectivo,115',
    );
    expect(fromMatrix).toEqual(fromCsv);
    expect(fromMatrix[1]).toMatchObject({
      category: 'Cash',
      entity: 'Efectivo',
      amount: 115,
    });
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

describe('mergeFixedHousingSheetRows', () => {
  it('injects a constant Vivienda personal row per month and strips CSV duplicates for that entity', () => {
    const csv =
      HEADER +
      '01/01/2024,1,2024,Invertido,Vivienda personal,BBVA,999\n' +
      '01/01/2024,1,2024,Invertido,Fondo,Indexa,500\n' +
      '01/02/2024,2,2024,Cash,Efectivo,Bank,100';
    const rows = parseCSV(csv);
    const merged = mergeFixedHousingSheetRows(rows, { amount: 150000, entity: 'BBVA' });
    const months = groupByMonth(merged);
    expect(months).toHaveLength(2);
    expect(months[0].housingValue).toBe(150000);
    expect(months[1].housingValue).toBe(150000);
    const jan = months[0].entries.filter((e) => e.category === 'Vivienda personal');
    expect(jan).toHaveLength(1);
    expect(jan[0].amount).toBe(150000);
  });

  it('returns rows unchanged when amount is unset', () => {
    const csv = HEADER + '01/01/2024,1,2024,Invertido,Vivienda personal,BBVA,150000';
    const rows = parseCSV(csv);
    expect(mergeFixedHousingSheetRows(rows, { amount: null, entity: 'BBVA' })).toBe(rows);
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
