import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nContext.jsx';

const LANG_LABELS = { CAT: 'Català', ES: 'Español', EN: 'English' };

function LangDropdown({ lang, setLang, langs }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-text-secondary/60 hover:text-text-primary hover:bg-white/[0.08] transition-all duration-200"
        aria-label="Language"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 z-20 bg-surface-alt border border-white/[0.08] rounded-xl shadow-xl overflow-hidden min-w-[140px] animate-[fadeSlideIn_0.15s_ease-out]">
          {langs.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => { setLang(l); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors duration-150 ${
                l === lang
                  ? 'text-brand bg-brand/10 font-medium'
                  : 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary'
              }`}
            >
              <span>{LANG_LABELS[l]}</span>
              {l === lang && (
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginScreen({
  onLogin,
  checkingSession = false,
  canLogin = false,
  authError = null,
  passkey,
}) {
  const { lang, setLang, t, LANGS } = useI18n();

  const autoTriggered = useRef(false);
  useEffect(() => {
    if (autoTriggered.current) return;
    if (checkingSession) return;
    if (!passkey?.supported || !passkey.hasRegistered) return;
    if (passkey.authenticating) return;
    autoTriggered.current = true;
    const timer = setTimeout(() => passkey.authenticate(), 800);
    return () => clearTimeout(timer);
  }, [checkingSession, passkey]);

  return (
    <div className="fixed inset-0 h-[100svh] min-h-[100svh] flex flex-col items-center justify-center px-6 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] bg-gradient-to-br from-surface via-surface to-[#0a0d14] overflow-hidden overscroll-none">
      <div className="absolute top-5 right-5">
        <LangDropdown lang={lang} setLang={setLang} langs={LANGS} />
      </div>

      <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl overflow-hidden flex items-center justify-center bg-white/[0.04] mb-5">
        <img
          src={`${import.meta.env.BASE_URL}piggy.gif`}
          alt=""
          className="w-full h-full object-cover object-[52%_48%]"
        />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-secondary mb-10">
        {t.appTitle}
      </h1>

      <div className="w-full max-w-xs">
        {checkingSession ? (
          <div className="flex flex-col items-center gap-3 py-1">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            <span className="text-text-secondary text-xs">{t.checkingSession}</span>
          </div>
        ) : authError ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-negative text-xs text-left w-full leading-relaxed">{authError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-text-primary text-sm font-medium py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98]"
            >
              {t.reload}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {passkey?.supported && passkey.hasRegistered && (
              <button
                onClick={passkey.authenticate}
                disabled={passkey.authenticating}
                className="w-full flex items-center justify-center gap-2 bg-white/[0.05] text-text-secondary text-sm font-medium py-3 px-4 rounded-xl hover:bg-white/[0.08] hover:text-text-primary transition-all duration-200 active:scale-[0.97] disabled:opacity-40"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h.01M15 12h.01M9.5 15.5a3.5 3.5 0 005 0M7 3.5A1.5 1.5 0 003.5 5v2M17 3.5A1.5 1.5 0 0120.5 5v2M7 20.5A1.5 1.5 0 003.5 19v-2M17 20.5A1.5 1.5 0 0020.5 19v-2" /></svg>
                {passkey.authenticating ? t.loading : (t.loginFaceId ?? 'Entrar amb Face ID')}
              </button>
            )}
            <button
              onClick={onLogin}
              disabled={!canLogin}
              className={`w-full flex items-center justify-center gap-2.5 text-sm font-medium py-3.5 px-4 rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${
                passkey?.supported && passkey.hasRegistered
                  ? 'bg-white/[0.05] text-text-secondary hover:bg-white/[0.08] hover:text-text-primary'
                  : 'bg-white/[0.08] text-text-primary border border-white/[0.1] hover:bg-white/[0.12]'
              }`}
            >
              <GoogleIcon />
              {canLogin ? t.loginButton : t.loading}
            </button>
            {passkey?.error && (
              <p className="text-negative text-xs mt-1">{passkey.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
