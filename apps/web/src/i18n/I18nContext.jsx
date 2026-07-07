import { createContext, useContext, useEffect, useMemo } from 'react';
import { t } from './locales/ca.js';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = 'ca';
  }, []);

  const value = useMemo(() => ({ t, locale: 'ca' }), []);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
}
