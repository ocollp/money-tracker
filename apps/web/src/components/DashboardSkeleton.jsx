export default function DashboardSkeleton() {
  const bar = 'h-4 rounded-lg bg-white/[0.06] animate-pulse';
  const card = 'bg-surface-alt/60 rounded-2xl border border-white/[0.06] overflow-hidden';

  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className={`${card} p-4 space-y-2`}>
        <div className={`${bar} w-full max-w-2xl`} />
        <div className={`${bar} h-3 w-48 opacity-60`} />
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        <div className={`${card} p-4 space-y-3 col-span-1`}>
          <div className={`${bar} h-3 w-24`} />
          <div className={`${bar} h-8 w-32`} />
        </div>
        <div className={`${card} p-4 space-y-3 col-span-1`}>
          <div className={`${bar} h-3 w-28`} />
          <div className={`${bar} h-8 w-36`} />
        </div>
        <div className={`${card} p-4 space-y-3 col-span-2 lg:col-span-1`}>
          <div className={`${bar} h-3 w-20`} />
          <div className={`${bar} h-8 w-40`} />
        </div>
      </div>

      <div className={`${card} min-h-[200px]`}>
        <div className="px-5 pt-5 pb-2 flex justify-between">
          <div className={`${bar} h-5 w-40`} />
          <div className={`${bar} h-5 w-16`} />
        </div>
        <div className="px-5 pb-5 h-32 bg-white/[0.02]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className={`${card} min-h-[280px]`}>
          <div className="px-5 pt-5">
            <div className={`${bar} h-5 w-48`} />
          </div>
          <div className="h-48 m-4 rounded-xl bg-white/[0.03]" />
        </div>
        <div className={`${card} min-h-[280px]`}>
          <div className="px-5 pt-5">
            <div className={`${bar} h-5 w-36`} />
          </div>
          <div className="h-48 m-4 rounded-xl bg-white/[0.03]" />
        </div>
      </div>

      <div className={`${card} min-h-[120px]`}>
        <div className="px-5 pt-5">
          <div className={`${bar} h-5 w-44`} />
        </div>
      </div>
    </div>
  );
}
