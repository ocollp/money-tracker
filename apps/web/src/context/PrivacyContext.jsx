import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'mt_hide_money';

const PrivacyContext = createContext(null);

function readStoredHideMoney() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function PrivacyProvider({ children }) {
  const [hideMoney, setHideMoney] = useState(readStoredHideMoney);

  const toggleHideMoney = useCallback(() => {
    setHideMoney((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {}
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ hideMoney, toggleHideMoney, setHideMoney }),
    [hideMoney, toggleHideMoney],
  );

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error('usePrivacy must be inside PrivacyProvider');
  return ctx;
}
