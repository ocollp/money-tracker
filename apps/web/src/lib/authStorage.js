export const AUTH_STORAGE_KEY = 'mt_auth';
export const JWT_STORAGE_KEY = 'mt_app_jwt';

export function getAppJwt() {
  try {
    return localStorage.getItem(JWT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearAppJwt() {
  try {
    localStorage.removeItem(JWT_STORAGE_KEY);
  } catch {}
}

export function loadStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.user ?? null;
  } catch {
    return null;
  }
}

export function loadImplicitSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveImplicitSession(token, expiresIn, user) {
  const session = {
    accessToken: token,
    expiresAt: Date.now() + Math.max(0, (expiresIn - 120)) * 1000,
    user,
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function saveBackendSession(user, jwt) {
  localStorage.setItem(JWT_STORAGE_KEY, jwt);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user }));
}

export function clearAuthStorage() {
  localStorage.removeItem(JWT_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
