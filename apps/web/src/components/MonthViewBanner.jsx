export default function MonthViewBanner({ label, clearLabel, onClear }) {
  return (
    <div className="mx-auto w-full px-3 sm:px-6 lg:px-10 pt-2">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/[0.08] px-3 py-2.5 sm:px-4">
        <p className="text-sm text-text-primary min-w-0 truncate">{label}</p>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-white/[0.1] active:scale-[0.98] transition-all"
        >
          {clearLabel}
        </button>
      </div>
    </div>
  );
}
