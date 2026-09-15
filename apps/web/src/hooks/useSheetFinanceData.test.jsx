import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { useSheetFinanceData } from './useSheetFinanceData.js';
import { fetchSheetData, fetchSheetDataViaBackend } from '../services/sheetsApi.js';

vi.mock('../services/sheetsApi.js', () => ({
  fetchSheetData: vi.fn(), fetchSheetDataViaBackend: vi.fn(),
  checkSheetAccess: vi.fn(), checkSheetAccessViaBackend: vi.fn(),
  SHEET_AUTH_ERRORS: { JWT_EXPIRED: 'jwt_expired', GOOGLE_REAUTH: 'google_reauth_required' },
}));

it('keeps sheet access after a temporary failure and allows retrying without signing out', async () => {
  const values = [['Fecha', 'Tipo', 'Categoria', 'Entidad', 'Cantidad'], ['01/09/2026', 'Cash', 'Efectivo', 'Bank', '1000']];
  for (const fetcher of [fetchSheetData, fetchSheetDataViaBackend]) {
    fetcher.mockRejectedValueOnce(Object.assign(new Error('Server unavailable'), { status: 503 }))
      .mockResolvedValue(values);
  }
  localStorage.clear();
  sessionStorage.clear();
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  const financeConfig = { spreadsheetId: 'test-sheet', profileLabels: { primary: 'Olga' }, profileEmojis: {} };
  let result;
  function Harness() {
    result = useSheetFinanceData({ accessToken: 'test', appJwt: 'test', profile: 'primary', financeConfig });
    return null;
  }
  try {
    await act(async () => root.render(<Harness />));
    expect(result.error).toBe('Server unavailable');
    expect(result.sheetAccess.id1).toBe(true);
    await act(async () => result.refresh());
    expect(result.error).toBeNull();
    expect(result.stats.current).toBe(1000);
  } finally {
    await act(async () => root.unmount());
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});

it('loads the saved profile sheet after an initial sheet was denied', async () => {
  const values = [['Fecha', 'Tipo', 'Categoria', 'Entidad', 'Cantidad'], ['01/09/2026', 'Cash', 'Efectivo', 'Bank', '1000']];
  for (const fetcher of [fetchSheetData, fetchSheetDataViaBackend]) {
    fetcher.mockReset().mockImplementation((_token, id) => id === 'old-sheet'
      ? Promise.reject(Object.assign(new Error('Denied'), { status: 403 }))
      : Promise.resolve(values));
  }
  localStorage.clear();
  sessionStorage.clear();
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.createElement('div'));
  let result;
  const base = { profileLabels: { primary: 'Olga' }, profileEmojis: {} };
  function Harness({ config }) {
    result = useSheetFinanceData({ accessToken: 'test', appJwt: 'test', profile: 'primary', financeConfig: config });
    return null;
  }
  try {
    await act(async () => root.render(<Harness config={{ ...base, spreadsheetId: 'old-sheet' }} />));
    expect(result.sheetAccess.id1).toBe(false);
    await act(async () => root.render(<Harness config={{ ...base, spreadsheetId: 'saved-sheet' }} />));
    expect(result.sheetAccess.id1).toBe(true);
    expect(result.error).toBeNull();
    expect(result.stats.current).toBe(1000);
  } finally {
    await act(async () => root.unmount());
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
