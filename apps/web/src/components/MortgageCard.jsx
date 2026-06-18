import { memo } from 'react';
import { formatMoney, splitYearsAndMonths } from '../utils/formatters';
import { useI18n } from '../i18n/I18nContext.jsx';
import { usePrivacy } from '../context/PrivacyContext.jsx';

function MortgageCard({ housing }) {
  const { t } = useI18n();
  const { hideMoney } = usePrivacy();

  const debtPaidPct = housing.initialDebt > 0
    ? ((housing.totalPaid / housing.initialDebt) * 100).toFixed(1)
    : 0;

  const showMyShare = housing.totalEquity != null && housing.equity != null
    && Math.round(housing.totalEquity) !== Math.round(housing.equity);
  const showMyDebt = showMyShare && housing.fullDebt != null && housing.debt != null
    && Math.round(housing.fullDebt) !== Math.round(housing.debt);

  const remainingLabel =
    housing.monthsRemaining != null
      ? t.mortgageTimeRemaining(splitYearsAndMonths(housing.monthsRemaining))
      : null;

  return (
    <div className="h-full min-h-0 flex flex-col glass-card px-5 pt-5 pb-5 gap-4">
      <h3 className="text-lg font-semibold">{t.housingTitle}</h3>

      {!hideMoney ? (
        <div className="grid grid-cols-2 gap-3 flex-1">
          <div>
            <p className="text-[11px] text-text-secondary mb-1">{t.housingDebt}</p>
            <p className="text-base sm:text-xl font-bold tracking-tight text-negative">{formatMoney(housing.fullDebt)}</p>
            {showMyDebt && (
              <p className="text-[10px] text-text-secondary/70 mt-0.5">{formatMoney(housing.debt)}</p>
            )}
          </div>
          <div>
            <p className="text-[11px] text-text-secondary mb-1">{t.housingEquity}</p>
            <p className="text-base sm:text-xl font-bold text-positive">{formatMoney(housing.totalEquity ?? housing.equity)}</p>
            {showMyShare && (
              <p className="text-[10px] text-text-secondary/70 mt-0.5">{formatMoney(housing.equity)}</p>
            )}
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <div className="flex justify-between items-center gap-2 text-[11px] text-text-secondary">
          <span className="min-w-0 leading-snug">
            {remainingLabel ?? t.mortgageProgress}
          </span>
          <span className="font-semibold text-positive shrink-0">{debtPaidPct}%</span>
        </div>
        <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700 relative"
            style={{ width: `${debtPaidPct}%` }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent to-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(MortgageCard);
