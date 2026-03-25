import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext.jsx';

function LangSwitcher({ lang, setLang, langs }) {
  return (
    <div className="flex items-center justify-center gap-1 rounded-full bg-white/[0.05] border border-white/[0.06] p-0.5">
      {langs.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-200 ${
            l === lang
              ? 'bg-brand text-white shadow-sm'
              : 'text-text-secondary/70 hover:text-text-primary'
          }`}
        >
          {l}
        </button>
      ))}
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
  const [showLogin, setShowLogin] = useState(false);

  const isLastStep = step === t.onboarding.length - 1;
  const current = t.onboarding[step];

  const handleNext = () => {
    if (isLastStep) {
      setShowLogin(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (showLogin) {
      setShowLogin(false);
    } else if (step > 0) {
      setStep((s) => s - 1);
    }
  };

  return (
    <div className="fixed inset-0 h-[100svh] min-h-[100svh] flex items-center justify-center px-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] bg-gradient-to-br from-surface via-surface to-[#0a0d14] overflow-hidden overscroll-none">
      <div className="bg-surface-alt/95 rounded-3xl border border-white/[0.06] p-8 sm:p-12 max-w-sm w-full text-center shadow-xl shadow-black/30 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <LangSwitcher lang={lang} setLang={setLang} langs={LANGS} />
        </div>
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden ring-2 ring-white/10 flex items-center justify-center bg-white/5 mb-5">
          <img
            src={`${import.meta.env.BASE_URL}piggy.gif`}
            alt=""
            className="w-full h-full object-cover object-[52%_48%]"
          />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#fea4a4] mb-1">
          {t.appTitle}
        </h1>

        {showLogin ? (
          <div className="mt-6 space-y-5">
            <p className="text-sm text-text-secondary leading-relaxed">
              {t.loginSubtitle}
            </p>

            {checkingSession ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="w-10 h-10 border-3 border-brand border-t-transparent rounded-full animate-spin" />
                <span className="text-text-secondary text-sm">{t.checkingSession}</span>
              </div>
            ) : authError ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-negative text-sm text-left w-full leading-relaxed">{authError}</p>
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

            <button
              type="button"
              onClick={handleBack}
              className="text-xs text-text-secondary/60 hover:text-text-secondary transition-colors"
            >
              {t.backToIntro}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="min-h-[140px] flex flex-col items-center justify-center">
              <div
                key={`${lang}-${step}`}
                className="flex flex-col items-center gap-3 animate-[fadeSlideIn_0.3s_ease-out]"
              >
                <span className="text-4xl">{current.emoji}</span>
                <h2 className="text-base font-semibold text-text-primary">
                  {current.title}
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed px-2">
                  {current.description}
                </p>
              </div>
            </div>

            <StepDots
              total={t.onboarding.length}
              current={step}
              onSelect={setStep}
            />

            <div className="flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-text-secondary bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-200 active:scale-[0.98]"
                >
                  {t.back}
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-white transition-all duration-200 active:scale-[0.98] ${
                  isLastStep
                    ? 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/30 shadow-lg'
                    : 'bg-brand hover:bg-brand-light border border-brand/30'
                }`}
              >
                {isLastStep ? t.start : t.next}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="text-xs text-text-secondary/60 hover:text-text-secondary transition-colors"
            >
              {t.skipToLogin}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
