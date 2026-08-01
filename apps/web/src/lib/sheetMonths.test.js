import { describe, it, expect, beforeEach } from 'vitest';
import { writeCachedMonths, readCachedMonths } from './financeStatsCache.js';
import { sheetValuesFingerprint, sheetValuesToMonths } from './sheetMonths.js';

describe('sheetValuesFingerprint', () => {
  it('is stable for the same matrix and changes when data changes', () => {
    const a = [['h'], ['1/01/2024', 'Cash', 'Cash', 'Efectivo', '100']];
    const b = [['h'], ['1/01/2024', 'Cash', 'Cash', 'Efectivo', '101']];
    expect(sheetValuesFingerprint(a)).toBe(sheetValuesFingerprint([['h'], ['1/01/2024', 'Cash', 'Cash', 'Efectivo', '100']]));
    expect(sheetValuesFingerprint(a)).not.toBe(sheetValuesFingerprint(b));
  });
});

describe('sheetValuesToMonths', () => {
  it('groups a compact values matrix', () => {
    const months = sheetValuesToMonths([
      ['Fecha', 'Cash/Inversión', 'Categoria', 'Entidad', 'Cantidad'],
      ['1/01/2024', 'Cash', 'Cuenta corriente', 'CaixaBank', '1000'],
    ]);
    expect(months).toHaveLength(1);
    expect(months[0].total).toBe(1000);
  });
});

describe('writeCachedMonths', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('skips rewriting when months fingerprint is unchanged', () => {
    const months = sheetValuesToMonths([
      ['Fecha', 'type', 'category', 'entity', 'amount'],
      ['1/01/2024', 'Cash', 'Cuenta corriente', 'Bank', '500'],
    ]);
    expect(writeCachedMonths('sheet-1', 'primary', months)).toBe(true);
    expect(writeCachedMonths('sheet-1', 'primary', months)).toBe(false);
    expect(readCachedMonths('sheet-1', 'primary')[0].total).toBe(500);
  });
});
