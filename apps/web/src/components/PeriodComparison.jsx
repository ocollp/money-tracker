import { formatMoney, formatPct } from '../utils/formatters';
import { useI18n } from '../i18n/I18nContext.jsx';

function deltaClass(value) {
  if (value == null || Number.isNaN(value)) return 'text-text-secondary';
  if (value === 0) return 'text-text-primary';
  return value > 0 ? 'text-positive' : 'text-negative';
}

export default function PeriodComparison({ data }) {
  const { t } = useI18n();
  if (!data) return null;

  const { yoyMonth } = data;

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-lg font-semibold">{t.periodCompareTitle}</h3>
      </div>

      <div className="px-5 pb-5">
        {yoyMonth.available ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl px-4 py-3 border bg-white/[0.05] border-white/[0.1]">
                <div className="text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                  {yoyMonth.currentMonthLabel}
                </div>
                <div className={`text-xl font-bold tabular-nums mt-1 ${deltaClass(yoyMonth.currentChange)}`}>
                  {formatMoney(yoyMonth.currentChange)}
                </div>
              </div>
              <div className="rounded-xl px-4 py-3 border bg-white/[0.05] border-white/[0.1]">
                <div className="text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                  {yoyMonth.priorMonthLabel}
                </div>
                <div className={`text-xl font-bold tabular-nums mt-1 ${deltaClass(yoyMonth.priorChange)}`}>
                  {formatMoney(yoyMonth.priorChange)}
                </div>
              </div>
            </div>
            <div className="rounded-xl px-4 py-3 border border-white/[0.1] bg-white/[0.06]">
              <div className="text-[11px] font-medium text-text-secondary leading-snug">{t.periodCompareDelta}</div>
              <div className={`text-lg font-bold tabular-nums mt-1 ${deltaClass(yoyMonth.delta)}`}>
                {yoyMonth.delta != null ? formatMoney(yoyMonth.delta) : '—'}
                {yoyMonth.pctVsPrior != null && !Number.isNaN(yoyMonth.pctVsPrior) ? (
                  <span className="text-sm font-semibold ml-2 opacity-90">
                    ({formatPct(yoyMonth.pctVsPrior)} {t.periodCompareVsPriorYear})
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">{t.periodCompareYoyUnavailable}</p>
        )}
      </div>
    </div>
  );
}
