import { useState, useCallback, useEffect } from 'react';
import { startRegistration, startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { API_URL } from '../config.js';
import { getAppJwt } from './useBackendProfile.js';

const PASSKEY_REGISTERED_KEY = 'mt_passkey_registered';

export function usePasskey({ onLoginSuccess }) {
  const [registering, setRegistering] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState(null);

  const supported = Boolean(API_URL) && browserSupportsWebAuthn();
  const [hasRegistered, setHasRegistered] = useState(() => {
    try { return localStorage.getItem(PASSKEY_REGISTERED_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    try {
      if (hasRegistered) localStorage.setItem(PASSKEY_REGISTERED_KEY, '1');
    } catch {}
  }, [hasRegistered]);

  const register = useCallback(async () => {
    if (!supported) return;
    const jwt = getAppJwt();
    if (!jwt) {
      setError('Cal estar autenticat per registrar Face ID');
      return;
    }

    setRegistering(true);
    setError(null);

    try {
      const optRes = await fetch(`${API_URL}/auth/webauthn/register-options`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!optRes.ok) throw new Error('No s\'han pogut obtenir les opcions de registre');
      const options = await optRes.json();

      const attResp = await startRegistration({ optionsJSON: options });

      const verRes = await fetch(`${API_URL}/auth/webauthn/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(attResp),
      });

      if (!verRes.ok) {
        const body = await verRes.json().catch(() => ({}));
        throw new Error(body.message || body.error || 'Registre fallat');
      }

      setHasRegistered(true);
    } catch (e) {
      if (e.name !== 'NotAllowedError') {
        setError(e.message || 'Error registrant Face ID');
      }
    } finally {
      setRegistering(false);
    }
  }, [supported]);

  const authenticate = useCallback(async () => {
    if (!supported) return;
    setAuthenticating(true);
    setError(null);

    try {
      const optRes = await fetch(`${API_URL}/auth/webauthn/login-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!optRes.ok) throw new Error('No s\'han pogut obtenir les opcions d\'autenticació');
      const options = await optRes.json();

      const assertionResp = await startAuthentication({ optionsJSON: options });

      const verRes = await fetch(`${API_URL}/auth/webauthn/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assertionResp),
      });

      if (!verRes.ok) {
        const body = await verRes.json().catch(() => ({}));
        throw new Error(body.message || body.error || 'Autenticació fallada');
      }

      const data = await verRes.json();
      onLoginSuccess?.(data);
    } catch (e) {
      if (e.name !== 'NotAllowedError') {
        setError(e.message || 'Error amb Face ID');
      }
    } finally {
      setAuthenticating(false);
    }
  }, [supported, onLoginSuccess]);

  return {
    supported,
    hasRegistered,
    register,
    authenticate,
    registering,
    authenticating,
    error,
    clearError: () => setError(null),
  };
}
