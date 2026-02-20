export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
export const SPREADSHEET_ID_2 = import.meta.env.VITE_SPREADSHEET_ID_2 || '';
export const SHEET_RANGE = 'A:I';
export const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

// Mortgage (optional; if not set, card hides or shows only data from sheet)
const n = (v) => {
  const s = typeof v === 'string' ? v.trim() : v;
  if (s === '' || s === undefined) return null;
  const num = Number(s);
  return Number.isNaN(num) ? null : num;
};
export const MORTGAGE_REMAINING_MONTHS = n(import.meta.env.VITE_MORTGAGE_REMAINING_MONTHS);
export const MORTGAGE_END_YEAR = n(import.meta.env.VITE_MORTGAGE_END_YEAR);
export const MORTGAGE_END_MONTH = n(import.meta.env.VITE_MORTGAGE_END_MONTH);
export const MORTGAGE_MONTHLY_PAYMENT = n(import.meta.env.VITE_MORTGAGE_MONTHLY_PAYMENT);
export const OWNERSHIP_SHARE = n(import.meta.env.VITE_OWNERSHIP_SHARE);
