export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
export const SPREADSHEET_ID_2 = import.meta.env.VITE_SPREADSHEET_ID_2 || '';
export const SHEET_RANGE = 'A:I';
export const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

const n = (v) => {
  const s = typeof v === 'string' ? v.trim() : v;
  if (s === '' || s === undefined) return null;
  const num = Number(s);
  return Number.isNaN(num) ? null : num;
};
export const MORTGAGE_END_YEAR = n(import.meta.env.VITE_MORTGAGE_END_YEAR);
export const MORTGAGE_END_MONTH = n(import.meta.env.VITE_MORTGAGE_END_MONTH);
export const MORTGAGE_MONTHLY_PAYMENT = n(import.meta.env.VITE_MORTGAGE_MONTHLY_PAYMENT);
export const OWNERSHIP_SHARE = n(import.meta.env.VITE_OWNERSHIP_SHARE);
/** Assumed monthly unemployment (€) for runway when one loses job */
export const ASSUMED_UNEMPLOYMENT = n(import.meta.env.VITE_ASSUMED_UNEMPLOYMENT) ?? 1000;
