import { formatMoney } from '../utils/formatters';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function MortgageCard({ housing }) {
  const { t } = useI18n();

  const debtPaidPct = housing.initialDebt > 0
    ? ((housing.totalPaid / housing.initialDebt) * 100).toFixed(1)
    : 0;

  const showMyShare = housing.totalEquity != null && housing.equity != null
    && Math.round(housing.totalEquity) !== Math.round(housing.equity);

  return (
    <div className="h-full min-h-0 flex flex-col bg-surface-alt/80 rounded-2xl px-5 pt-5 pb-5 border border-white/[0.06] shadow-lg shadow-black/10 gap-4">
      <h3 className="text-lg font-semibold">{t.housingTitle}</h3>

      <div className="grid grid-cols-2 gap-3 flex-1">
        <div>
          <p className="text-[11px] text-text-secondary mb-1">{t.housingDebt}</p>
          <p className="text-base sm:text-xl font-bold tracking-tight text-negative">{formatMoney(housing.fullDebt)}</p>
        </div>
        <div>
          <p className="text-[11px] text-text-secondary mb-1">{t.housingEquity}</p>
          <p className="text-base sm:text-xl font-bold text-positive">{formatMoney(housing.totalEquity ?? housing.equity)}</p>
          {showMyShare && (
            <p className="text-[10px] text-text-secondary/70 mt-0.5">{formatMoney(housing.equity)}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px] text-text-secondary">
          <span>{t.mortgageProgress}</span>
          <span className="font-semibold text-positive">{debtPaidPct}%</span>
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
