const CACHE_VERSION = 1;
const PREFIX = 'mt_finance_v';

function cacheKey(sheetId, profileId) {
  return `${PREFIX}${CACHE_VERSION}:${sheetId}:${profileId}`;
}

function serializeMonths(months) {
  return months.map((m) => ({
    ...m,
    date: m.date instanceof Date ? m.date.toISOString() : m.date,
  }));
}

function deserializeMonths(rows) {
  return rows.map((m) => ({
    ...m,
    date: m.date ? new Date(m.date) : new Date(),
  }));
}

export function readCachedMonths(sheetId, profileId) {
  if (!sheetId || typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(cacheKey(sheetId, profileId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.months)) return null;
    return deserializeMonths(parsed.months);
  } catch {
    return null;
  }
}

export function writeCachedMonths(sheetId, profileId, months) {
  if (!sheetId || !months?.length || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(
      cacheKey(sheetId, profileId),
      JSON.stringify({ months: serializeMonths(months), at: Date.now() }),
    );
  } catch {
    /* quota or private mode */
  }
}
