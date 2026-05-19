export default function DashboardHeader({
  t,
  onOpenDrawer,
  effectiveProfiles,
  effectiveProfile,
}) {
  const active = effectiveProfiles?.find((p) => p.id === effectiveProfile);

  return (
    <header className="sticky top-0 z-20 bg-white/[0.04] backdrop-blur-2xl border-b border-white/[0.08] pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
      <div className="mx-auto px-3 sm:px-6 lg:px-10 pb-2 sm:pb-3 pt-1 sm:pt-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink min-w-0">
            <button
              type="button"
              onClick={onOpenDrawer}
              className="sm:hidden min-h-11 min-w-11 -ml-1 rounded-lg text-text-secondary hover:text-text-primary transition-colors inline-flex items-center justify-center"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-text-primary shrink min-w-0">
              {t.appTitle}
            </h1>
          </div>

          {active ? (
            <span className="sm:hidden text-xl shrink-0" aria-label={active.name}>
              {active.emoji}
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
