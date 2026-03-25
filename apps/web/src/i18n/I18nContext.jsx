import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ca } from './locales/ca.js';
import { es } from './locales/es.js';
import { en } from './locales/en.js';

const LOCALES = { CAT: ca, ES: es, EN: en };
const LANG_KEY = 'mt_lang';
const LANGS = ['CAT', 'ES', 'EN'];

function getInitialLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && LANGS.includes(saved)) return saved;
  } catch {}
  return 'CAT';
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem(LANG_KEY, l); } catch {}
  }, []);

  const t = useMemo(() => LOCALES[lang] ?? ca, [lang]);

  const value = useMemo(() => ({ lang, setLang, t, LANGS }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
}
