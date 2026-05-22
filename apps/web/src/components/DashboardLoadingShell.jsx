import LoadingProgressRing from './LoadingProgressRing';
import { useLoadingProgress } from '../hooks/useLoadingProgress';

export default function DashboardLoadingShell({
  loading = true,
  loadingLabel,
  mainRef,
  onTouchStart,
  onTouchEnd,
  touchAction,
}) {
  const progress = useLoadingProgress(loading);

  return (
    <main
      ref={mainRef}
      className="relative mx-auto w-full flex-1 space-y-4 px-3 py-4 touch-pan-y sm:space-y-6 sm:px-6 sm:py-6 lg:px-10 pb-2"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={touchAction != null ? { touchAction } : undefined}
      aria-busy="true"
      aria-label="Dashboard"
    >
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none min-h-[min(70vh,32rem)]">
        <LoadingProgressRing progress={progress} label={loadingLabel} />
      </div>

      <div className="opacity-[0.32] pointer-events-none select-none" aria-hidden>
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonCard key={i} delayMs={i * 60} />
          ))}
        </section>

        <SkeletonBlock className="h-52 sm:h-60 mt-4 sm:mt-6" delayMs={200} />
        <SkeletonBlock className="h-44 sm:h-52" delayMs={280} />
        <SkeletonBlock className="h-36 sm:h-44" delayMs={360} />
      </div>
    </main>
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
