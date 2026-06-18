import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nContext.jsx';
import { hasPasskeyHint } from '../lib/authStorage.js';

function InlineSpinner({ className = 'w-3.5 h-3.5' }) {
  return (
    <span
      className={`inline-block border-2 border-white/20 border-t-white/60 rounded-full animate-spin shrink-0 ${className}`}
      aria-hidden
    />
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function FaceIdIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 12h.01M15 12h.01M9.5 15.5a3.5 3.5 0 005 0M7 3.5A1.5 1.5 0 003.5 5v2M17 3.5A1.5 1.5 0 0120.5 5v2M7 20.5A1.5 1.5 0 003.5 19v-2M17 20.5A1.5 1.5 0 0020.5 19v-2" />
    </svg>
  );
}

const BTN_GLASS =
  'glass-btn w-full flex items-center justify-center gap-2 text-sm font-medium py-3 px-4 rounded-xl text-text-secondary hover:text-text-primary active:scale-[0.97] disabled:opacity-40';

function LoginLayout({ title, children }) {
  return (
    <div className="fixed inset-0 h-[100svh] min-h-[100svh] flex flex-col items-center justify-center px-6 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] overflow-hidden overscroll-none">
      <div className="glass-card w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl overflow-hidden flex items-center justify-center mb-5 p-0">
        <img
          src={`${import.meta.env.BASE_URL}piggy.gif`}
          alt=""
          className="w-full h-full object-cover object-[52%_48%]"
        />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-secondary mb-10">{title}</h1>
      <div className="w-full max-w-xs">{children}</div>
    </div>
  );
}

export default function LoginScreen({
  onLogin,
  checkingSession = false,
  authError = null,
  passkey,
}) {
  const { t } = useI18n();
  const autoTriggered = useRef(false);
  const passkeyHint = hasPasskeyHint();
  const showPasskey = passkey?.supported && passkey.hasRegistered;
  const canAutoPasskey = passkey?.supported && (showPasskey || passkeyHint);

  useEffect(() => {
    if (autoTriggered.current || checkingSession) return;
    if (!canAutoPasskey || passkey.authenticating) return;
    if (passkey.checkingCredentials && !passkeyHint) return;
    autoTriggered.current = true;
    const frame = requestAnimationFrame(() => {
      passkey.authenticate();
    });
    return () => cancelAnimationFrame(frame);
  }, [checkingSession, passkey, canAutoPasskey, passkeyHint]);

  if (authError) {
    return (
      <LoginLayout title={t.appTitle}>
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
      </LoginLayout>
    );
  }

  return (
    <LoginLayout title={t.appTitle}>
      <div className="flex flex-col gap-3">
        {checkingSession ? (
          <p className="flex items-center justify-center gap-2 text-text-secondary text-xs py-0.5">
            <InlineSpinner />
            {t.checkingSession}
          </p>
        ) : null}
        {showPasskey ? (
          <button
            type="button"
            onClick={passkey.authenticate}
            disabled={passkey.authenticating}
            className={BTN_GLASS}
          >
            <FaceIdIcon />
            {passkey.authenticating ? t.loading : (t.loginFaceId ?? 'Entrar amb Face ID')}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onLogin}
          disabled={passkey?.authenticating}
          className={`${BTN_GLASS} gap-2.5 py-3.5 ${showPasskey ? '' : 'text-text-primary'}`}
        >
          <GoogleIcon />
          {t.loginButton}
        </button>
        {passkey?.error ? <p className="text-negative text-xs mt-1">{passkey.error}</p> : null}
      </div>
    </LoginLayout>
  );
}
