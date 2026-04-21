/** Atlas / Mongo connection string may be under any of these names (hosting dashboards differ). */
const URI_KEYS = ['MONGODB_URI', 'MONGODB_URL', 'DATABASE_URL'];

export function resolveMongoUri() {
  for (const key of URI_KEYS) {
    const v = process.env[key];
    if (typeof v === 'string' && v.trim()) return { uri: v.trim(), envKey: key };
  }
  return { uri: '', envKey: null };
}

export function isMongoUriConfigured() {
  return Boolean(resolveMongoUri().uri);
}
