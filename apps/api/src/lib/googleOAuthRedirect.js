/**
 * GIS popup flow: token exchange must use the page origin as redirect_uri (not "postmessage").
 * See: https://developers.google.com/identity/oauth2/web/guides/use-code-model
 */

export function isAllowedGoogleRedirectUri(redirectUri) {
  let origin;
  try {
    origin = new URL(redirectUri).origin;
  } catch {
    return false;
  }

  const raw = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const allowed = new Set();
  for (const o of raw) {
    try {
      const u = new URL(o);
      allowed.add(u.origin);
      if (u.hostname === 'localhost') {
        allowed.add(`${u.protocol}//127.0.0.1${u.port ? `:${u.port}` : ''}`);
      }
      if (u.hostname === '127.0.0.1') {
        allowed.add(`${u.protocol}//localhost${u.port ? `:${u.port}` : ''}`);
      }
    } catch {
      /* ignore */
    }
  }

  if (allowed.size === 0) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  }
  return allowed.has(origin);
}
