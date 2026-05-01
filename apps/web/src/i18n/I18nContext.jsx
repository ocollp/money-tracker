import { createContext, useContext, useMemo } from 'react';
import { t as translations } from './locales/ca.js';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const value = useMemo(() => ({ t: translations }), []);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
}
