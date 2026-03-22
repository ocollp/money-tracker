export function defaultSettings() {
  return {
    spreadsheetId: null,
    spreadsheetId2: null,
    profilePrimaryLabel: null,
    profileSecondaryLabel: null,
    profilePrimaryEmoji: null,
    profileSecondaryEmoji: null,
    mortgageEndYear: null,
    mortgageEndMonth: null,
    mortgageMonthlyPayment: null,
    ownershipShare: null,
    assumedUnemployment: null,
  };
}

export const PATCHABLE_KEYS = [
  'spreadsheetId',
  'spreadsheetId2',
  'profilePrimaryLabel',
  'profileSecondaryLabel',
  'profilePrimaryEmoji',
  'profileSecondaryEmoji',
  'mortgageEndYear',
  'mortgageEndMonth',
  'mortgageMonthlyPayment',
  'ownershipShare',
  'assumedUnemployment',
];

export function sanitizePatch(body) {
  if (!body || typeof body !== 'object') return {};
  const out = {};
  for (const key of PATCHABLE_KEYS) {
    if (!(key in body)) continue;
    const v = body[key];
    if (v === undefined) continue;
    if (v === null) {
      out[key] = null;
      continue;
    }
    if (['mortgageEndYear', 'mortgageEndMonth', 'mortgageMonthlyPayment', 'ownershipShare', 'assumedUnemployment'].includes(key)) {
      const n = Number(v);
      if (!Number.isNaN(n)) out[key] = n;
      continue;
    }
    if (typeof v === 'string') {
      const t = v.trim();
      out[key] = t === '' ? null : t;
    }
  }
  return out;
}
