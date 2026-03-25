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

function StepDots({ total, current, onSelect }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? 'w-6 h-2 bg-brand'
              : 'w-2 h-2 bg-white/20 hover:bg-white/30'
          }`}
          aria-label={`Step ${i + 1}`}
        />
      ))}
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
}) {
  const { lang, setLang, t, LANGS } = useI18n();
  const [step, setStep] = useState(0);
  const current = t.onboarding[step];

  return (
    <div className="fixed inset-0 h-[100svh] min-h-[100svh] flex items-center justify-center px-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] bg-gradient-to-br from-surface via-surface to-[#0a0d14] overflow-hidden overscroll-none">
      <div className="bg-surface-alt/95 rounded-3xl border border-white/[0.06] p-8 sm:p-12 max-w-sm w-full text-center shadow-xl shadow-black/30 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <LangDropdown lang={lang} setLang={setLang} langs={LANGS} />
        </div>

        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full overflow-hidden ring-2 ring-white/10 flex items-center justify-center bg-white/5 mb-4">
          <img
            src={`${import.meta.env.BASE_URL}piggy.gif`}
            alt=""
            className="w-full h-full object-cover object-[52%_48%]"
          />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#fea4a4] mb-5">
          {t.appTitle}
        </h1>

        <div className="min-h-[120px] flex flex-col items-center justify-center mb-4">
          <div
            key={`${lang}-${step}`}
            className="flex flex-col items-center gap-2.5 animate-[fadeSlideIn_0.3s_ease-out]"
          >
            <span className="text-3xl">{current.emoji}</span>
            <h2 className="text-sm font-semibold text-text-primary">
              {current.title}
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed px-1">
              {current.description}
            </p>
          </div>
        </div>

        <StepDots
          total={t.onboarding.length}
          current={step}
          onSelect={setStep}
        />

        <div className="flex gap-2 mt-4 mb-5">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="w-10 h-10 shrink-0 rounded-xl text-text-secondary bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-200 active:scale-[0.98] inline-flex items-center justify-center"
              aria-label={t.back}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          {step < t.onboarding.length - 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-brand hover:bg-brand-light border border-brand/30 transition-all duration-200 active:scale-[0.98]"
            >
              {t.next}
            </button>
          )}
        </div>

        <div className="border-t border-white/[0.06] pt-5">
          {checkingSession ? (
            <div className="flex flex-col items-center gap-3 py-1">
              <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              <span className="text-text-secondary text-xs">{t.checkingSession}</span>
            </div>
          ) : authError ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-negative text-xs text-left w-full leading-relaxed">{authError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold py-2.5 px-4 rounded-xl border border-white/10 transition-all duration-200 active:scale-[0.98]"
              >
                {t.reload}
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              disabled={!canLogin}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-3 px-4 rounded-xl border border-emerald-500/30 shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <GoogleIcon />
              {canLogin ? t.loginButton : t.loading}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
