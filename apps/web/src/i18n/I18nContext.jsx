import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { t as ca } from './locales/ca.js';
import { t as es } from './locales/es.js';

const BUNDLES = { ca, es };
const LOCALE_KEY = 'mt_locale';

function readStoredLocale() {
  try {
    const v = localStorage.getItem(LOCALE_KEY);
    if (v === 'ca' || v === 'es') return v;
  } catch {
    /* ignore */
  }
  return null;
}

function detectBrowserLocale() {
  if (typeof navigator === 'undefined') return 'ca';
  const lang = (navigator.language || '').toLowerCase();
  if (lang.startsWith('es')) return 'es';
  return 'ca';
}

function getInitialLocale() {
  return readStoredLocale() ?? detectBrowserLocale();
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(getInitialLocale);

  const setLocale = useCallback((next) => {
    if (next !== 'ca' && next !== 'es') return;
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale === 'es' ? 'es' : 'ca';
  }, [locale]);

  const value = useMemo(
    () => ({
      t: BUNDLES[locale],
      locale,
      setLocale,
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
}
