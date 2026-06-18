export default function MonthViewBanner({ label, clearLabel, onClear }) {
  return (
    <div className="mx-auto w-full px-3 sm:px-6 lg:px-10 pt-2">
      <div className="glass-banner flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
        <p className="text-sm text-text-primary min-w-0 truncate">{label}</p>
        <button
          type="button"
          onClick={onClear}
          className="glass-btn shrink-0 px-3 py-1.5 text-xs font-semibold text-text-primary active:scale-[0.98]"
        >
          {clearLabel}
        </button>
      </div>
    </div>
  );
}
