import { formatMoney } from '../utils/formatters';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function MortgageCard({ housing }) {
  const { t } = useI18n();

  const debtPaidPct = housing.initialDebt > 0
    ? ((housing.totalPaid / housing.initialDebt) * 100).toFixed(1)
    : 0;

  const years = housing.monthsRemaining != null && housing.monthsRemaining > 0
    ? Math.floor(housing.monthsRemaining / 12)
    : null;

  return (
    <div className="h-full min-h-0 flex flex-col bg-surface-alt/80 rounded-2xl px-5 pt-5 pb-4 border border-white/[0.06] shadow-lg shadow-black/10 space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">{t.housingTitle}</h3>
        <span className="text-lg font-bold text-negative">{formatMoney(housing.fullDebt)}</span>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-text-secondary">{t.mortgageProgress}</span>
          <span className="font-semibold text-positive">{debtPaidPct}%</span>
        </div>
        <div className="w-full bg-surface rounded-full h-3.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700 relative"
            style={{ width: `${debtPaidPct}%` }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent to-white/20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
          <p className="text-[11px] text-text-secondary mb-0.5">{t.housingValue}</p>
          <p className="text-sm font-bold text-text-primary">{formatMoney(housing.fullValue)}</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
          <p className="text-[11px] text-text-secondary mb-0.5">{t.housingEquity}</p>
          <p className="text-sm font-bold text-positive">{formatMoney(housing.totalEquity ?? housing.equity)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm pt-1 border-t border-white/[0.04] text-text-secondary">
        <span>{t.mortgagePayment(formatMoney(housing.monthlyPayment))}</span>
        {years != null && (
          <span>{t.mortgageRemaining(housing.monthsRemaining, years)}</span>
        )}
      </div>
    </div>
  );
}
