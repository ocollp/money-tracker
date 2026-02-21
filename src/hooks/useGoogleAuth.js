import { useState, useEffect, useCallback, useRef } from 'react';
import { GOOGLE_CLIENT_ID, SCOPES } from '../config';

const STORAGE_KEY = 'mt_auth';

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session; // return even when expired, so we can try silent refresh on next load
  } catch { /* ignore */ }
  return null;
}

function saveSession(token, expiresIn, user) {
  const session = {
    accessToken: token,
    expiresAt: Date.now() + (expiresIn - 120) * 1000,
    user,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export default function useGoogleAuth() {
  const saved = loadSession();
  const isValid = saved?.expiresAt && Date.now() < saved.expiresAt;
  const [user, setUser] = useState(isValid ? saved?.user ?? null : null);
  const [accessToken, setAccessToken] = useState(isValid ? saved?.accessToken ?? null : null);
  const [ready, setReady] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const refreshTimer = useRef(null);

  const scheduleRefresh = useCallback((expiresAt, client) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    const ms = Math.max(expiresAt - Date.now() - 60_000, 10_000);
    refreshTimer.current = setTimeout(() => {
      if (client) client.requestAccessToken({ prompt: '' });
    }, ms);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(interval);

        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: (response) => {
            if (response.access_token) {
              const expiresIn = response.expires_in || 3600;
              fetchUserInfo(response.access_token).then(userInfo => {
                const session = saveSession(response.access_token, expiresIn, userInfo);
                setAccessToken(response.access_token);
                setUser(userInfo);
                scheduleRefresh(session.expiresAt, client);
              });
            }
          },
        });
        setTokenClient(client);
        setReady(true);

        if (saved?.accessToken && saved?.expiresAt > Date.now()) {
          scheduleRefresh(saved.expiresAt, client);
        } else if (saved?.user) {
          // Session expired but we had a user: try silent refresh (may work if still logged in to Google)
          client.requestAccessToken({ prompt: '' });
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
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
    setUser(null);
    setAccessToken(null);
  }, [accessToken]);

  return { user, accessToken, ready, login, logout, isLoggedIn: !!accessToken };
}
