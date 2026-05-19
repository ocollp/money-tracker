import { useState, useEffect, useCallback } from 'react';
import { API_URL, HAS_BACKEND } from '../config.js';
import {
  getAppJwt,
  clearAppJwt,
  JWT_STORAGE_KEY,
} from '../lib/authStorage.js';

export { getAppJwt, clearAppJwt } from '../lib/authStorage.js';

async function fetchMe(jwt) {
  return fetch(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
}

export function useBackendProfile(accessToken, appJwt, onJwtExpired) {
  const [settings, setSettings] = useState(null);
  const [apiUser, setApiUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendReady, setBackendReady] = useState(() => !HAS_BACKEND || Boolean(getAppJwt()));

  useEffect(() => {
    if (!HAS_BACKEND) {
      setBackendReady(true);
      return;
    }

    let cancelled = false;

    const loadProfile = async (loader) => {
      setLoading(true);
      setError(null);
      setBackendReady(true);
      try {
        await loader();
      } catch (e) {
        if (!cancelled) setError(e.message || 'API error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (appJwt) {
      loadProfile(async () => {
        const res = await fetchMe(appJwt);
        if (cancelled) return;
        if (res.status === 401) {
          clearAppJwt();
          onJwtExpired?.();
          setSettings(null);
          setApiUser(null);
          return;
        }
        if (res.status === 503) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setApiUser(data.user);
        setSettings(data.settings);
      });
      return () => { cancelled = true; };
    }

    if (!accessToken) {
      setSettings(null);
      setApiUser(null);
      setBackendReady(true);
      return;
    }

    loadProfile(async () => {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });
      if (cancelled) return;
      if (res.status === 503) {
        setSettings(null);
        setApiUser(null);
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      localStorage.setItem(JWT_STORAGE_KEY, data.token);
      setApiUser(data.user);
      setSettings(data.settings);
    });

    return () => { cancelled = true; };
  }, [accessToken, appJwt, onJwtExpired]);

  const refreshProfile = useCallback(async () => {
    if (!HAS_BACKEND) return;
    const jwt = getAppJwt();
    if (!jwt) return;
    const res = await fetchMe(jwt);
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
    if (!HAS_BACKEND) throw new Error('API not configured');
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
    hasApi: HAS_BACKEND,
    refreshProfile,
    patchSettings,
  };
}
