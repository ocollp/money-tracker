export default function LoginScreen({ onLogin, ready, checkingSession = false }) {
  return (
    <div className="fixed inset-0 h-[100svh] min-h-[100svh] flex items-center justify-center px-4 bg-gradient-to-br from-surface via-surface to-[#0a0d14] overflow-hidden overscroll-none">
      <div className="bg-surface-alt/95 rounded-3xl border border-white/[0.06] p-8 sm:p-12 max-w-sm w-full text-center space-y-6 shadow-xl shadow-black/30">
        <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full overflow-hidden ring-2 ring-white/10 flex items-center justify-center bg-white/5">
          <img
            src={`${import.meta.env.BASE_URL}piggy.gif`}
            alt=""
            className="w-full h-full object-cover object-[52%_48%]"
          />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#fea4a4]">
          Finances personals
        </h1>

        {checkingSession ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-brand border-t-transparent rounded-full animate-spin" />
            <span className="text-text-secondary text-sm">Comprovant sessió...</span>
          </div>
        ) : (
          <button
            onClick={onLogin}
            disabled={!ready}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2.5 px-4 rounded-xl border border-emerald-500/30 shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {ready ? 'Entrar amb Google' : 'Carregant...'}
          </button>
        )}

      </div>
    </div>
  );
}
