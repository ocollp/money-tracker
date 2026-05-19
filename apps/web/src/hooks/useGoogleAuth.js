import { useState, useEffect, useCallback, useRef } from 'react';
import { GOOGLE_CLIENT_ID, SCOPES, API_URL, HAS_BACKEND } from '../config';
import { useI18n } from '../i18n/I18nContext.jsx';
import {
  loadStoredUser,
  loadImplicitSession,
  saveImplicitSession,
  saveBackendSession,
  clearAuthStorage,
  getAppJwt,
} from '../lib/authStorage.js';
import {
  GIS_LOAD_ERROR,
  isGisAvailable,
  pollUntilGisReady,
  waitForGisClient,
} from '../lib/gisClient.js';

const USE_BACKEND = HAS_BACKEND;
const REFRESH_BEFORE_MS = 20 * 60 * 1000;
const EXPIRING_SOON_MS = 25 * 60 * 1000;
const SILENT_CHECK_MS = 1200;

function mapAuthApiError(body, t) {
  if (body?.error === 'database_not_configured') {
    return t.authErrorDatabaseNotConfigured ?? 'database_not_configured';
  }
  if (body?.error === 'redirect_uri_invalid') {
    return (
      t.authErrorRedirectUri ??
      "L'origen del navegador no coincideix amb CORS_ORIGIN de l'API (inclou http://localhost:5174 i el teu domini de producció)."
    );
  }
  return body?.error || null;
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

function requestLogin(client, loginHint) {
  const opts = loginHint ? { login_hint: loginHint } : {};
  if (USE_BACKEND) client.requestCode(opts);
  else client.requestAccessToken(opts);
}

export default function useGoogleAuth() {
  const { t } = useI18n();
  const implicitSaved = !USE_BACKEND ? loadImplicitSession() : null;
  const implicitHasValidToken = Boolean(
    implicitSaved?.expiresAt && Date.now() < implicitSaved.expiresAt,
  );

  const [user, setUser] = useState(() =>
    USE_BACKEND ? loadStoredUser() : (implicitSaved?.user ?? null),
  );
  const [appJwt, setAppJwt] = useState(() =>
    USE_BACKEND ? getAppJwt() : null,
  );
  const [accessToken, setAccessToken] = useState(() =>
    !USE_BACKEND && implicitHasValidToken ? (implicitSaved?.accessToken ?? null) : null,
  );
  const [authError, setAuthError] = useState(null);
  const [silentCheckDone, setSilentCheckDone] = useState(() =>
    USE_BACKEND ? true : !implicitSaved?.user || implicitHasValidToken,
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
      client?.requestAccessToken({ prompt: '' });
    }, ms);
  }, []);

  const trySilentRefresh = useCallback((client, promptNone = false) => {
    if (USE_BACKEND || !client) return;
    client.requestAccessToken({ prompt: promptNone ? 'none' : '' });
  }, []);

  useEffect(() => {
    if (!String(GOOGLE_CLIENT_ID || '').trim()) {
      setAuthError(
        'Falta VITE_GOOGLE_CLIENT_ID. Afegeix-la al .env i reinicia el servidor de Vite.',
      );
      return;
    }

    const registerClient = (client) => {
      clientRef.current = client;
    };

    const setup = () => {
      if (!isGisAvailable()) return false;

      try {
        if (USE_BACKEND) {
          const client = window.google.accounts.oauth2.initCodeClient({
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
                  body: JSON.stringify({
                    code: response.code,
                    redirect_uri: window.location.origin,
                  }),
                });
                if (!res.ok) {
                  const body = await res.json().catch(() => ({}));
                  throw new Error(mapAuthApiError(body, t) || `Error ${res.status}`);
                }
                const data = await res.json();
                saveBackendSession(data.user, data.token);
                setUser(data.user);
                setAppJwt(data.token);
                setAuthError(null);
              } catch (e) {
                const net =
                  e instanceof TypeError || /failed to fetch/i.test(String(e?.message || ''));
                setAuthError(
                  net
                    ? "No s'ha pogut connectar amb l'API (port 3001). Des de l'arrel del repo executa: npm run dev (engega web + API). Si només l'API: npm run dev:api. Amb VITE_API_URL comentada al .env s'usa el proxy de Vite i no cal CORS."
                    : e.message || 'Error autenticant amb el servidor',
                );
              }
            },
          });
          registerClient(client);
          return true;
        }

        const saved = loadImplicitSession();
        const hasValidToken = Boolean(saved?.expiresAt && Date.now() < saved.expiresAt);
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: (response) => {
            if (!response?.access_token) return;
            setSilentCheckDone(true);
            const expiresIn = response.expires_in || 3600;
            fetchUserInfo(response.access_token).then((userInfo) => {
              const session = saveImplicitSession(response.access_token, expiresIn, userInfo);
              setAccessToken(session.accessToken);
              setUser(userInfo);
              scheduleRefresh(session.expiresAt, client);
            });
          },
        });
        registerClient(client);

        if (hasValidToken && saved?.expiresAt) {
          scheduleRefresh(saved.expiresAt, client);
        } else if (saved?.user) {
          trySilentRefresh(client, true);
          silentCheckTimer.current = setTimeout(() => setSilentCheckDone(true), SILENT_CHECK_MS);
        }
        return true;
      } catch (e) {
        setAuthError(e?.message || "No s'ha pogut iniciar Google Sign-In.");
        return true;
      }
    };

    const stopPolling = pollUntilGisReady(setup, {
      onTimeout: () => {
        if (!clientRef.current) setAuthError(GIS_LOAD_ERROR);
      },
    });

    const onVisibility = () => {
      if (USE_BACKEND || document.visibilityState !== 'visible') return;
      const exp = expiresAtRef.current;
      const client = clientRef.current;
      if (exp != null && exp - Date.now() < EXPIRING_SOON_MS && client) {
        trySilentRefresh(client);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibility);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      if (silentCheckTimer.current) clearTimeout(silentCheckTimer.current);
    };
  }, [scheduleRefresh, trySilentRefresh, t]);

  const login = useCallback((loginHint) => {
    const cleanup = waitForGisClient(clientRef, {
      onReady: (client) => requestLogin(client, loginHint),
      onTimeout: () => setAuthError(GIS_LOAD_ERROR),
    });
    return cleanup;
  }, []);

  const loginWithPasskeyResult = useCallback((data) => {
    if (!data?.token || !data?.user) return;
    saveBackendSession(data.user, data.token);
    setUser(data.user);
    setAppJwt(data.token);
    setAuthError(null);
  }, []);

  const clearAuth = useCallback(() => {
    if (USE_BACKEND) {
      clearAuthStorage();
      setUser(null);
      setAppJwt(null);
    } else {
      if (accessToken) {
        try {
          window.google.accounts.oauth2.revoke(accessToken);
        } catch {}
      }
      clearAuthStorage();
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      expiresAtRef.current = null;
      setUser(null);
      setAccessToken(null);
    }
  }, [accessToken]);

  const needsRefresh = USE_BACKEND ? false : Boolean(user && !accessToken && silentCheckDone);
  const checkingSession = USE_BACKEND ? false : Boolean(user && !accessToken && !silentCheckDone);

  return {
    user,
    accessToken: USE_BACKEND ? null : accessToken,
    appJwt: USE_BACKEND ? appJwt : null,
    authError,
    login,
    loginWithPasskeyResult,
    logout: clearAuth,
    clearAuth,
    isLoggedIn: USE_BACKEND ? Boolean(user && appJwt) : Boolean(user),
    needsRefresh,
    checkingSession,
  };
}
