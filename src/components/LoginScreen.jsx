export default function LoginScreen({ onLogin, ready }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-surface-alt rounded-3xl border border-border p-8 sm:p-12 max-w-sm w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-brand/20 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Money<span className="text-brand">Tracker</span>
          </h1>
          <p className="text-text-secondary text-sm mt-2">
            El meu dashboard financer personal
          </p>
        </div>

        <button
          onClick={onLogin}
          disabled={!ready}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-6 rounded-xl border border-gray-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {ready ? 'Entrar amb Google' : 'Carregant...'}
        </button>

        <p className="text-[11px] text-text-secondary/60 leading-relaxed">
          Només necessito accés de lectura al meu Google Sheet per carregar les dades financeres. No es guarda res.
        </p>
      </div>
    </div>
  );
}
