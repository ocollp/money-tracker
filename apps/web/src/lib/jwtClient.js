/** Decode JWT payload without verifying signature (client-side expiry check only). */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

/** True when token is missing, malformed, or past exp (with optional skew buffer). */
export function isAppJwtExpired(token, skewMs = 60_000) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return !token;
  return Date.now() >= payload.exp * 1000 - skewMs;
}
