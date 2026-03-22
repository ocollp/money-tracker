export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
export const SPREADSHEET_ID_2 = import.meta.env.VITE_SPREADSHEET_ID_2 || '';
export const SHEET_RANGE = 'A:I';
export const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

export const PROFILE_PRIMARY_ID = 'primary';
export const PROFILE_SECONDARY_ID = 'secondary';

export const PROFILE_EMAILS = {
  [PROFILE_PRIMARY_ID]: import.meta.env.VITE_LOGIN_EMAIL_01 || '',
  [PROFILE_SECONDARY_ID]: import.meta.env.VITE_LOGIN_EMAIL_02 || '',
};

export const PROFILE_LABELS = {
  [PROFILE_PRIMARY_ID]: import.meta.env.VITE_PROFILE_PRIMARY_LABEL || 'Olga',
  [PROFILE_SECONDARY_ID]: import.meta.env.VITE_PROFILE_SECONDARY_LABEL || 'Andrea',
};

export const PROFILE_EMOJIS = {
  [PROFILE_PRIMARY_ID]: import.meta.env.VITE_PROFILE_PRIMARY_EMOJI || '👩🏼',
  [PROFILE_SECONDARY_ID]: import.meta.env.VITE_PROFILE_SECONDARY_EMOJI || '👩🏻',
};

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
export const ASSUMED_UNEMPLOYMENT = n(import.meta.env.VITE_ASSUMED_UNEMPLOYMENT) ?? 1000;
