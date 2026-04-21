export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '').trim();
/** En desenvolupament, si no hi ha VITE_API_URL, Vite fa proxy cap a l'API (mateix origen, sense CORS). */
const useDevProxy = import.meta.env.DEV && !rawApiUrl;
/** Prefix per fetch: URL completa, o "" per rutes relatives (proxy dev). */
export const API_URL = useDevProxy ? '' : rawApiUrl;
/** Si l'app ha de parlar amb l'API Node (URL directa o proxy local). */
export const HAS_BACKEND = Boolean(rawApiUrl) || useDevProxy;
export const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
export const SPREADSHEET_ID_2 = import.meta.env.VITE_SPREADSHEET_ID_2 || '';
export const SHEET_RANGE = 'A:I';
export const SCOPES =
  'https://www.googleapis.com/auth/spreadsheets openid email profile https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

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
export const TRAVEL_MONTHLY_SAVING = n(import.meta.env.VITE_TRAVEL_MONTHLY_SAVING) ?? 600;
