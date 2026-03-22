const STORAGE_KEY = 'mt_local_profile_display';

const KEYS = [
  'profilePrimaryLabel',
  'profileSecondaryLabel',
  'profilePrimaryEmoji',
  'profileSecondaryEmoji',
];

export function loadLocalProfileDisplay() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o !== 'object') return null;
    return o;
  } catch {
    return null;
  }
}

export function saveLocalProfileDisplay(patch) {
  const prev = loadLocalProfileDisplay() || {};
  const next = { ...prev };
  for (const k of KEYS) {
    if (!(k in patch)) continue;
    const v = patch[k];
    if (v == null || (typeof v === 'string' && v.trim() === '')) {
      delete next[k];
    } else {
      next[k] = typeof v === 'string' ? v.trim() : v;
    }
  }
  try {
    if (Object.keys(next).length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  } catch {}
  return next;
}
