export default function DashboardLoadingShell({
  t,
  effectiveUser,
  profile,
  financeConfig,
  loading,
  currentSheetId,
  sheetAccess,
  mainRef,
  onTouchStart,
  onTouchEnd,
  touchAction,
}) {
  const label = financeConfig?.profileLabels?.[profile] ?? '';
  const emoji = financeConfig?.profileEmojis?.[profile] ?? '';
  const sid = String(currentSheetId || '').trim();
  const sidTail = sid.length > 12 ? `…${sid.slice(-8)}` : sid;

  const subHint = sheetAccess === null && !loading ? t.checkingAccess : t.dashboardLoadingHint;

  return (
    <main
      ref={mainRef}
      className="mx-auto w-full flex-1 space-y-4 px-3 py-4 touch-pan-y sm:space-y-6 sm:px-6 sm:py-6 lg:px-10 pb-2"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={touchAction != null ? { touchAction } : undefined}
    >
      <div className="glass-card flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {loading ? (
            <span
              className="mt-0.5 inline-block h-8 w-8 shrink-0 rounded-full border-2 border-brand/30 border-t-brand animate-spin"
              aria-hidden
            />
          ) : (
            <span className="mt-0.5 inline-block h-8 w-8 shrink-0 rounded-full border border-white/[0.12]" aria-hidden />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary">{t.loadingData}</p>
            <p className="mt-0.5 text-xs leading-snug text-text-secondary">{subHint}</p>
          </div>
        </div>
        <div className="min-w-0 border-t border-white/[0.08] pt-3 text-xs text-text-secondary sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 sm:text-right">
          {effectiveUser?.email ? <p className="truncate sm:ml-auto sm:max-w-[20rem]">{effectiveUser.email}</p> : null}
          {label || emoji ? (
            <p className="mt-1 font-medium text-text-primary/90">
              {emoji ? <span className="mr-1">{emoji}</span> : null}
              {label}
            </p>
          ) : null}
          {sid ? (
            <p className="mt-1 truncate font-mono text-[11px] opacity-80" title={sid}>
              {t.dashboardLoadingSheetId}: {sidTail}
            </p>
          ) : null}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="glass-card animate-pulse space-y-3 p-3 sm:p-5">
            <div className="h-3 w-24 rounded bg-white/[0.08]" />
            <div className="h-8 w-28 rounded bg-white/[0.1]" />
            <div className="h-3 w-20 rounded bg-white/[0.06]" />
          </div>
        ))}
      </section>

      <div className="glass-card h-44 animate-pulse rounded-xl bg-white/[0.04] sm:h-52" aria-hidden />
      <div className="glass-card h-36 animate-pulse rounded-xl bg-white/[0.04] sm:h-44" aria-hidden />
    </main>
  );
}
