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
  const remainingMonths = housing.monthsRemaining != null
    ? housing.monthsRemaining % 12
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

      <div className="flex items-center justify-between text-sm pt-1 border-t border-white/[0.04]">
        <div className="flex items-center gap-2 text-text-secondary">
          <svg className="w-4 h-4 shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <span>{t.mortgagePayment(formatMoney(housing.monthlyPayment))}</span>
        </div>
        {years != null && (
          <div className="flex items-center gap-2 text-text-secondary">
            <svg className="w-4 h-4 shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t.mortgageRemaining(housing.monthsRemaining, years)}</span>
          </div>
        )}
      </div>

      {housing.principalPaidYtd != null && housing.principalPaidYtd > 0 && typeof t.mortgagePaidYtd === 'function' && (
        <p className="text-[11px] text-text-secondary pt-1 border-t border-white/[0.04]">
          {t.mortgagePaidYtd(formatMoney(housing.principalPaidYtd))}
        </p>
      )}
    </div>
  );
}
