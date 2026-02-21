import { useState, useEffect, useCallback, useRef } from 'react';
import { GOOGLE_CLIENT_ID, SCOPES } from '../config';

const STORAGE_KEY = 'mt_auth';
const REFRESH_BEFORE_MS = 5 * 60 * 1000; // refresh 5 min before expiry (tab throttling can delay timers)
const EXPIRING_SOON_MS = 10 * 60 * 1000;  // consider "expiring soon" when < 10 min left

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveSession(token, expiresIn, user) {
  const session = {
    accessToken: token,
    expiresAt: Date.now() + Math.max(0, (expiresIn - 120)) * 1000,
    user,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export default function useGoogleAuth() {
  const saved = loadSession();
  const hasValidToken = saved?.expiresAt && Date.now() < saved.expiresAt;
  const [user, setUser] = useState(saved?.user ?? null);
  const [accessToken, setAccessToken] = useState(hasValidToken ? saved?.accessToken ?? null : null);
  const [ready, setReady] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const refreshTimer = useRef(null);
  const expiresAtRef = useRef(saved?.expiresAt ?? null);
  const clientRef = useRef(null);

  const scheduleRefresh = useCallback((expiresAt, client) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    expiresAtRef.current = expiresAt;
    const ms = Math.max(expiresAt - Date.now() - REFRESH_BEFORE_MS, 15_000);
    refreshTimer.current = setTimeout(() => {
      if (client) client.requestAccessToken({ prompt: '' });
    }, ms);
  }, []);

  const trySilentRefresh = useCallback((client) => {
    if (client) client.requestAccessToken({ prompt: '' });
  }, []);

  useEffect(() => {
    let interval;
    const setup = () => {
      if (!window.google?.accounts?.oauth2) return false;

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.access_token) {
            const expiresIn = response.expires_in || 3600;
            fetchUserInfo(response.access_token).then(userInfo => {
              const session = saveSession(response.access_token, expiresIn, userInfo);
              setAccessToken(session.accessToken);
              setUser(session.user);
              scheduleRefresh(session.expiresAt, client);
            });
          }
        },
      });
      clientRef.current = client;
      setTokenClient(client);
      setReady(true);

      if (hasValidToken && saved?.expiresAt) {
        scheduleRefresh(saved.expiresAt, client);
      } else if (saved?.user) {
        trySilentRefresh(client);
      }
      return client;
    };

    interval = setInterval(() => {
      if (setup()) clearInterval(interval);
    }, 100);

    const onVisibility = () => {
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
      document.removeEventListener('visibilitychange', onVisibility);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const info = await res.json();
      return { name: info.name, email: info.email, picture: info.picture };
    } catch {
      return { name: 'User', email: '', picture: null };
    }
  };

  const login = useCallback(() => {
    if (tokenClient) tokenClient.requestAccessToken();
  }, [tokenClient]);

  const logout = useCallback(() => {
    if (accessToken) {
      try { window.google.accounts.oauth2.revoke(accessToken); } catch { /* ignore */ }
    }
    localStorage.removeItem(STORAGE_KEY);
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    expiresAtRef.current = null;
    setUser(null);
    setAccessToken(null);
  }, [accessToken]);

  const needsRefresh = !!user && !accessToken;

  return {
    user,
    accessToken,
    ready,
    login,
    logout,
    isLoggedIn: !!user,
    needsRefresh,
  };
}
