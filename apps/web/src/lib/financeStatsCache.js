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

function readFromStorage(storage, sheetId, profileId) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(cacheKey(sheetId, profileId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.months)) return null;
    return deserializeMonths(parsed.months);
  } catch {
    return null;
  }
}

function writeToStorage(storage, sheetId, profileId, months) {
  if (!storage || !sheetId || !months?.length) return;
  try {
    storage.setItem(
      cacheKey(sheetId, profileId),
      JSON.stringify({ months: serializeMonths(months), at: Date.now() }),
    );
  } catch {}
}

export function readCachedMonths(sheetId, profileId) {
  if (!sheetId || typeof window === 'undefined') return null;
  return (
    readFromStorage(typeof sessionStorage !== 'undefined' ? sessionStorage : null, sheetId, profileId)
    ?? readFromStorage(typeof localStorage !== 'undefined' ? localStorage : null, sheetId, profileId)
  );
}

export function writeCachedMonths(sheetId, profileId, months) {
  if (!sheetId || !months?.length || typeof window === 'undefined') return;
  writeToStorage(typeof sessionStorage !== 'undefined' ? sessionStorage : null, sheetId, profileId, months);
  writeToStorage(typeof localStorage !== 'undefined' ? localStorage : null, sheetId, profileId, months);
}
