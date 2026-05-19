export const GIS_POLL_MS = 50;
export const GIS_LOAD_TIMEOUT_MS = 15000;
export const GIS_LOAD_ERROR =
  "No s'ha carregat el script de Google (timeout). Comprova la connexió i recarrega.";

export function isGisAvailable() {
  return Boolean(window.google?.accounts?.oauth2);
}

export function waitForGisClient(clientRef, { onReady, onTimeout }) {
  const existing = clientRef.current;
  if (existing) {
    onReady(existing);
    return () => {};
  }

  let attempts = 0;
  const maxAttempts = Math.ceil(GIS_LOAD_TIMEOUT_MS / GIS_POLL_MS);
  const intervalId = setInterval(() => {
    const client = clientRef.current;
    if (client) {
      clearInterval(intervalId);
      onReady(client);
    } else if (++attempts >= maxAttempts) {
      clearInterval(intervalId);
      onTimeout?.();
    }
  }, GIS_POLL_MS);

  return () => clearInterval(intervalId);
}

export function pollUntilGisReady(setup, { onTimeout, pollMs = GIS_POLL_MS, timeoutMs = GIS_LOAD_TIMEOUT_MS }) {
  if (setup()) return () => {};

  let intervalId;
  let timeoutId;

  const stop = () => {
    clearInterval(intervalId);
    clearTimeout(timeoutId);
  };

  intervalId = setInterval(() => {
    if (setup()) stop();
  }, pollMs);

  timeoutId = setTimeout(() => {
    stop();
    onTimeout?.();
  }, timeoutMs);

  return stop;
}
