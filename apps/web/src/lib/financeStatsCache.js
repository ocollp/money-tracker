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

function monthsFingerprint(months) {
  return JSON.stringify(serializeMonths(months));
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

function writeToStorage(storage, sheetId, profileId, months, fingerprint) {
  if (!storage || !sheetId || !months?.length) return;
  try {
    storage.setItem(
      cacheKey(sheetId, profileId),
      JSON.stringify({ months: serializeMonths(months), fingerprint, at: Date.now() }),
    );
  } catch {}
}

function readFingerprint(storage, sheetId, profileId) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(cacheKey(sheetId, profileId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.fingerprint) return parsed.fingerprint;
    if (Array.isArray(parsed?.months)) return JSON.stringify(parsed.months);
    return null;
  } catch {
    return null;
  }
}

export function readCachedMonths(sheetId, profileId) {
  if (!sheetId || typeof window === 'undefined') return null;
  return (
    readFromStorage(typeof sessionStorage !== 'undefined' ? sessionStorage : null, sheetId, profileId)
    ?? readFromStorage(typeof localStorage !== 'undefined' ? localStorage : null, sheetId, profileId)
  );
}

/** Returns true if storage was written, false if skipped (unchanged). */
export function writeCachedMonths(sheetId, profileId, months) {
  if (!sheetId || !months?.length || typeof window === 'undefined') return false;
  const fingerprint = monthsFingerprint(months);
  const session = typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  const local = typeof localStorage !== 'undefined' ? localStorage : null;
  const existing =
    readFingerprint(session, sheetId, profileId)
    ?? readFingerprint(local, sheetId, profileId);
  if (existing === fingerprint) return false;
  writeToStorage(session, sheetId, profileId, months, fingerprint);
  writeToStorage(local, sheetId, profileId, months, fingerprint);
  return true;
}
