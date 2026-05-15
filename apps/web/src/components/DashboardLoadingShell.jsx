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
  statusTitle,
  statusHint,
  loadPhase = 'sheet',
}) {
  const label = financeConfig?.profileLabels?.[profile] ?? '';
  const emoji = financeConfig?.profileEmojis?.[profile] ?? '';
  const sid = String(currentSheetId || '').trim();
  const sidTail = sid.length > 12 ? `…${sid.slice(-8)}` : sid;

  const title = statusTitle ?? t.loadingData;
  const hint =
    statusHint
    ?? (sheetAccess === null && !loading ? t.checkingAccess : t.dashboardLoadingHint);

  const steps = [
    { id: 'session', label: t.loadingStepSession },
    { id: 'sheet', label: t.loadingStepSheet },
  ];
  const activeIdx = loadPhase === 'session' ? 0 : 1;

  return (
    <main
      ref={mainRef}
      className="mx-auto w-full flex-1 space-y-4 px-3 py-4 touch-pan-y sm:space-y-6 sm:px-6 sm:py-6 lg:px-10 pb-2"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={touchAction != null ? { touchAction } : undefined}
    >
      <div className="glass-card flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:gap-4 sm:px-5 sm:py-5 animate-fade-in">
        <StatusCardContent title={title} hint={hint} loading={loading} steps={steps} activeIdx={activeIdx} />
        <div className="min-w-0 border-t border-white/[0.08] pt-3 text-xs text-text-secondary sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 sm:text-right">
          {effectiveUser?.email ? (
            <p className="truncate sm:ml-auto sm:max-w-[20rem]">{effectiveUser.email}</p>
          ) : null}
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
          <SkeletonCard key={i} delayMs={i * 60} />
        ))}
      </section>

      <SkeletonBlock className="h-44 sm:h-52" delayMs={280} />
      <SkeletonBlock className="h-36 sm:h-44" delayMs={360} />
    </main>
  );
}

function StatusCardContent({ title, hint, loading, steps, activeIdx }) {
  return (
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <span
        className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
          loading
            ? 'border-brand/35 bg-brand/10'
            : 'border-white/[0.12] bg-white/[0.04]'
        }`}
        aria-hidden
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-brand/25 border-t-brand animate-spin" />
        ) : (
          <span className="text-sm text-brand">✓</span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-0.5 text-xs leading-snug text-text-secondary">{hint}</p>
        <ol className="mt-3 space-y-1.5" aria-label={title}>
          {steps.map((step, i) => {
            const done = i < activeIdx;
            const current = i === activeIdx;
            return (
              <li
                key={step.id}
                className={`flex items-center gap-2 text-xs ${
                  done
                    ? 'text-text-secondary/80'
                    : current
                      ? 'text-text-primary font-medium'
                      : 'text-text-secondary/45'
                }`}
              >
                <StepBadge done={done} current={current} loading={loading && current} index={i} />
                {step.label}
              </li>
            );
          })}
        </ol>
        {loading ? (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full w-1/3 min-w-[4rem] rounded-full bg-gradient-to-r from-brand/30 via-brand to-brand/30 animate-loading-bar" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StepBadge({ done, current, loading, index }) {
  if (done) {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/20 text-[10px] text-brand">
        ✓
      </span>
    );
  }
  if (current && loading) {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-brand/50 bg-brand/10">
        <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
      </span>
    );
  }
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/[0.1] text-[10px] text-text-secondary/60">
      {index + 1}
    </span>
  );
}

function SkeletonCard({ delayMs }) {
  return (
    <div
      className="glass-card space-y-3 p-3 sm:p-5 animate-fade-in skeleton-shimmer"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="h-3 w-24 rounded bg-white/[0.08]" />
      <div className="h-8 w-28 rounded bg-white/[0.1]" />
      <div className="h-3 w-20 rounded bg-white/[0.06]" />
    </div>
  );
}

function SkeletonBlock({ className, delayMs }) {
  return (
    <div
      className={`glass-card rounded-xl bg-white/[0.04] animate-fade-in skeleton-shimmer ${className}`}
      style={{ animationDelay: `${delayMs}ms` }}
      aria-hidden
    />
  );
}
