import { useState, useEffect, useCallback, useRef } from 'react';
import { GOOGLE_CLIENT_ID, SCOPES, API_URL } from '../config';

const STORAGE_KEY = 'mt_auth';
const JWT_KEY = 'mt_app_jwt';
const REFRESH_BEFORE_MS = 20 * 60 * 1000;
const EXPIRING_SOON_MS = 25 * 60 * 1000;
const SILENT_CHECK_MS = 3000;
const GIS_LOAD_TIMEOUT_MS = 15000;

// True when the app is backed by an API that can proxy Sheets + store refresh tokens
const USE_BACKEND = Boolean(API_URL);

// ─── storage helpers ───────────────────────────────────────────────────────

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.user ?? null;
  } catch { return null; }
}

function loadImplicitSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveImplicitSession(token, expiresIn, user) {
  const session = {
    accessToken: token,
    expiresAt: Date.now() + Math.max(0, (expiresIn - 120)) * 1000,
    user,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

function saveBackendSession(user, jwt) {
  localStorage.setItem(JWT_KEY, jwt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
}

function clearBackendSession() {
  localStorage.removeItem(JWT_KEY);
  localStorage.removeItem(STORAGE_KEY);
}

async function fetchUserInfo(token) {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const info = await res.json();
    return { name: info.name, email: info.email, picture: info.picture };
  } catch {
    return { name: 'User', email: '', picture: null };
  }
}

// ─── hook ─────────────────────────────────────────────────────────────────

export default function useGoogleAuth() {
  const implicitSaved = !USE_BACKEND ? loadImplicitSession() : null;
  const implicitHasValidToken = Boolean(
    implicitSaved?.expiresAt && Date.now() < implicitSaved.expiresAt
  );

  const [user, setUser] = useState(() =>
    USE_BACKEND ? loadStoredUser() : (implicitSaved?.user ?? null)
  );
  const [appJwt, setAppJwt] = useState(() =>
    USE_BACKEND ? (localStorage.getItem(JWT_KEY) || null) : null
  );
  const [accessToken, setAccessToken] = useState(() =>
    !USE_BACKEND && implicitHasValidToken ? (implicitSaved?.accessToken ?? null) : null
  );
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [gisClient, setGisClient] = useState(null);
  const [silentCheckDone, setSilentCheckDone] = useState(() =>
    USE_BACKEND ? true : (!implicitSaved?.user || implicitHasValidToken)
  );

  const refreshTimer = useRef(null);
  const silentCheckTimer = useRef(null);
  const expiresAtRef = useRef(!USE_BACKEND ? (implicitSaved?.expiresAt ?? null) : null);
  const clientRef = useRef(null);

  const scheduleRefresh = useCallback((expiresAt, client) => {
    if (USE_BACKEND) return;
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    expiresAtRef.current = expiresAt;
    const ms = Math.max(expiresAt - Date.now() - REFRESH_BEFORE_MS, 15_000);
    refreshTimer.current = setTimeout(() => {
      if (client) client.requestAccessToken({ prompt: '' });
    }, ms);
  }, []);

  const trySilentRefresh = useCallback((client, promptNone = false) => {
    if (USE_BACKEND) return;
    if (client) client.requestAccessToken({ prompt: promptNone ? 'none' : '' });
  }, []);

  useEffect(() => {
    if (!String(GOOGLE_CLIENT_ID || '').trim()) {
      setAuthError(
        'Falta VITE_GOOGLE_CLIENT_ID. Afegeix-la al .env i reinicia el servidor de Vite.'
      );
      setReady(true);
      return;
    }

    let interval;
    let loadTimeout;

    const setup = () => {
      if (!window.google?.accounts?.oauth2) return false;

      if (USE_BACKEND) {
        // ── Code flow (authorization code → backend stores refresh token) ──
        let client;
        try {
          client = window.google.accounts.oauth2.initCodeClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: SCOPES,
            ux_mode: 'popup',
            access_type: 'offline',
            callback: async (response) => {
              if (response?.error) {
                if (response.error !== 'popup_closed_by_user') {
                  setAuthError(`Google: ${response.error}`);
                }
                return;
              }
              if (!response?.code) return;
              try {
                const res = await fetch(`${API_URL}/auth/google`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code: response.code }),
                });
                if (!res.ok) {
                  const body = await res.json().catch(() => ({}));
                  throw new Error(body?.error || `Error ${res.status}`);
                }
                const data = await res.json();
                saveBackendSession(data.user, data.token);
                setUser(data.user);
                setAppJwt(data.token);
                setAuthError(null);
              } catch (e) {
                setAuthError(e.message || 'Error autenticant amb el servidor');
              }
            },
          });
        } catch (e) {
          clearTimeout(loadTimeout);
          setAuthError(e?.message || "No s'ha pogut iniciar Google Sign-In.");
          setReady(true);
          return true;
        }

        clientRef.current = client;
        setGisClient(client);
        setReady(true);
        clearTimeout(loadTimeout);
      } else {
        // ── Implicit / token flow (existing behaviour, no backend) ──
        const saved = loadImplicitSession();
        const hasValidToken = Boolean(saved?.expiresAt && Date.now() < saved.expiresAt);

        let client;
        try {
          client = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: SCOPES,
            callback: (response) => {
              if (response?.access_token) {
                setSilentCheckDone(true);
                const expiresIn = response.expires_in || 3600;
                fetchUserInfo(response.access_token).then((userInfo) => {
                  const session = saveImplicitSession(response.access_token, expiresIn, userInfo);
                  setAccessToken(session.accessToken);
                  setUser(userInfo);
                  scheduleRefresh(session.expiresAt, client);
                });
              }
            },
          });
        } catch (e) {
          clearTimeout(loadTimeout);
          setAuthError(e?.message || "No s'ha pogut iniciar Google Sign-In.");
          setReady(true);
          return true;
        }

        clientRef.current = client;
        setGisClient(client);
        setReady(true);
        clearTimeout(loadTimeout);

        if (hasValidToken && saved?.expiresAt) {
          scheduleRefresh(saved.expiresAt, client);
        } else if (saved?.user) {
          trySilentRefresh(client, true);
          silentCheckTimer.current = setTimeout(() => setSilentCheckDone(true), SILENT_CHECK_MS);
        }
      }
      return true;
    };

    loadTimeout = setTimeout(() => {
      if (clientRef.current) return;
      clearInterval(interval);
      setAuthError(
        "No s'ha carregat el script de Google (timeout). Comprova la connexió i recarrega."
      );
      setReady(true);
    }, GIS_LOAD_TIMEOUT_MS);

    interval = setInterval(() => { if (setup()) clearInterval(interval); }, 100);

    const onVisibility = () => {
      if (USE_BACKEND) return;
      if (document.visibilityState !== 'visible') return;
      const exp = expiresAtRef.current;
      const now = Date.now();
      const client = clientRef.current;
      if (exp != null && exp - now < EXPIRING_SOON_MS && client) {
        trySilentRefresh(client);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      clearTimeout(loadTimeout);
      document.removeEventListener('visibilitychange', onVisibility);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      if (silentCheckTimer.current) clearTimeout(silentCheckTimer.current);
    };
  }, []);

  const login = useCallback((loginHint) => {
    if (USE_BACKEND) {
      clientRef.current?.requestCode(loginHint ? { login_hint: loginHint } : {});
    } else {
      gisClient?.requestAccessToken(loginHint ? { login_hint: loginHint } : {});
    }
  }, [gisClient]);

  // Called by usePasskey after successful WebAuthn login — sets session without Google
  const loginWithPasskeyResult = useCallback((data) => {
    if (!data?.token || !data?.user) return;
    saveBackendSession(data.user, data.token);
    setUser(data.user);
    setAppJwt(data.token);
    setAuthError(null);
  }, []);

  const clearAuth = useCallback(() => {
    if (USE_BACKEND) {
      clearBackendSession();
      setUser(null);
      setAppJwt(null);
    } else {
      if (accessToken) {
        try { window.google.accounts.oauth2.revoke(accessToken); } catch {}
      }
      localStorage.removeItem(STORAGE_KEY);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      expiresAtRef.current = null;
      setUser(null);
      setAccessToken(null);
    }
  }, [accessToken]);

  const needsRefresh = USE_BACKEND ? false : (!!user && !accessToken && silentCheckDone);
  const checkingSession = USE_BACKEND ? false : (!!user && !accessToken && !silentCheckDone);

  return {
    user,
    accessToken: USE_BACKEND ? null : accessToken,
    appJwt: USE_BACKEND ? appJwt : null,
    ready,
    authError,
    canLogin: !!gisClient,
    login,
    loginWithPasskeyResult,
    logout: clearAuth,
    clearAuth,
    isLoggedIn: USE_BACKEND ? (!!user && !!appJwt) : !!user,
    needsRefresh,
    checkingSession,
  };
}
