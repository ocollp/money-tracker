import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config.js';

const JWT_KEY = 'mt_app_jwt';

export function getAppJwt() {
  try { return localStorage.getItem(JWT_KEY); } catch { return null; }
}

export function clearAppJwt() {
  try { localStorage.removeItem(JWT_KEY); } catch {}
}

/**
 * Manages backend profile + settings.
 *
 * Backend mode  (appJwt provided):  calls GET /me with the JWT.
 * Implicit mode (accessToken only): calls POST /auth/google to exchange the
 *   Google access token for a JWT, then reads user + settings from the response.
 *
 * onJwtExpired is called when the backend returns 401 (JWT invalid/expired)
 * so the parent can clear auth state and show the login screen.
 */
export function useBackendProfile(accessToken, appJwt, onJwtExpired) {
  const [settings, setSettings] = useState(null);
  const [apiUser, setApiUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    if (!API_URL) {
      setBackendReady(true);
      return;
    }

    // ── Backend mode: JWT already in hand, just fetch settings ──
    if (appJwt) {
      let cancelled = false;
      setLoading(true);
      setError(null);
      setBackendReady(false);

      (async () => {
        try {
          const res = await fetch(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${appJwt}` },
          });
          if (cancelled) return;
          if (res.status === 401) {
            clearAppJwt();
            onJwtExpired?.();
            setSettings(null);
            setApiUser(null);
            setBackendReady(true);
            return;
          }
          if (res.status === 503) {
            setBackendReady(true);
            return;
          }
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          const data = await res.json();
          setApiUser(data.user);
          setSettings(data.settings);
          setBackendReady(true);
        } catch (e) {
          if (!cancelled) {
            setError(e.message || 'API error');
            setBackendReady(true);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => { cancelled = true; };
    }

    // ── Implicit mode: exchange Google access token for JWT ──
    if (!accessToken) {
      setSettings(null);
      setApiUser(null);
      setBackendReady(true);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setBackendReady(false);

    (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken }),
        });
        if (cancelled) return;
        if (res.status === 503) {
          setSettings(null);
          setApiUser(null);
          setBackendReady(true);
          return;
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = await res.json();
        localStorage.setItem(JWT_KEY, data.token);
        setApiUser(data.user);
        setSettings(data.settings);
        setBackendReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'API error');
          setBackendReady(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [accessToken, appJwt]);

  const refreshProfile = useCallback(async () => {
    if (!API_URL) return;
    const jwt = getAppJwt();
    if (!jwt) return;
    const res = await fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (res.status === 401) {
      clearAppJwt();
      onJwtExpired?.();
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    setApiUser(data.user);
    setSettings(data.settings);
  }, [onJwtExpired]);

  const patchSettings = useCallback(async (partial) => {
    if (!API_URL) throw new Error('API not configured');
    const jwt = getAppJwt();
    if (!jwt) throw new Error('Not authenticated with API');
    const res = await fetch(`${API_URL}/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify(partial),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    const data = await res.json();
    setSettings(data.settings);
    return data.settings;
  }, []);

  return {
    settings,
    apiUser,
    loading,
    error,
    backendReady,
    hasApi: Boolean(API_URL),
    refreshProfile,
    patchSettings,
  };
}
