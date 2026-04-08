import { formatMoney } from '../utils/formatters';
import { useI18n } from '../i18n/I18nContext.jsx';

const currentYear = new Date().getFullYear();

export default function Patterns({ yearComparison }) {
  const { t } = useI18n();
  const sortedYears = [...(yearComparison || [])].sort((a, b) => b.year - a.year);
  const best = Math.max(...sortedYears.map(y => Math.abs(y.total)), 1);

  return (
    <div className="bg-surface-alt/80 rounded-2xl border border-white/[0.06] shadow-lg shadow-black/10 overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-lg font-semibold">{t.patternsTitle}</h3>
      </div>

      {sortedYears.length > 0 && (
        <div className="px-5 pb-5 space-y-2">
          {sortedYears.map((y) => {
            const barWidth = best > 0 ? (Math.abs(y.total) / best) * 100 : 0;
            const isPositive = y.total >= 0;
            const avgPerMonth = y.months > 0 ? y.total / y.months : 0;
            const isCurrent = y.year === currentYear;

            return (
              <div
                key={y.year}
                className="relative rounded-xl px-4 py-3 border bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] transition-all duration-300 overflow-hidden"
              >
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                    isPositive ? 'bg-positive/[0.07]' : 'bg-negative/[0.07]'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />

                <div className="relative flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-sm font-bold">{y.year}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[11px] font-medium ${isPositive ? 'text-positive/80' : 'text-negative/80'}`}>
                        ~{isPositive ? '+' : ''}{formatMoney(avgPerMonth)}/{t.patternsPerMonth}
                      </span>
                    </div>
                  </div>

                  <span className={`text-sm font-bold tabular-nums shrink-0 ${isPositive ? 'text-positive' : 'text-negative'}`}>
                    {isPositive ? '+' : ''}{formatMoney(y.total)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
