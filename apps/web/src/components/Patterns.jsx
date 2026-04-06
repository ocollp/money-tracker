import { useState, useEffect } from 'react';
import { formatMoney } from '../utils/formatters';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function Patterns({ yearComparison }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 640px)').matches : true
  );
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 640px)');
    const onChange = () => {
      if (mql.matches) setOpen(true);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  const sortedYears = [...(yearComparison || [])].sort((a, b) => b.year - a.year);
  const best = Math.max(...sortedYears.map(y => Math.abs(y.total)), 1);

  return (
    <div className="bg-surface-alt/80 rounded-2xl border border-white/[0.06] shadow-lg shadow-black/10 overflow-hidden">
      <div className="px-5 pt-5 pb-4 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{t.patternsTitle}</h3>
        <button
          type="button"
          className="sm:hidden shrink-0 min-w-11 min-h-11 -mr-2 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/[0.06] transition-colors"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? (t.sectionCollapse ?? 'Amaga') : (t.sectionExpand ?? 'Mostra')}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {sortedYears.length > 0 && (
        <div className={`px-5 pb-5 space-y-2 ${open ? '' : 'hidden sm:block'}`}>
          {sortedYears.map((y) => {
            const barWidth = best > 0 ? (Math.abs(y.total) / best) * 100 : 0;
            const isPositive = y.total >= 0;
            const avgPerMonth = y.months > 0 ? y.total / y.months : 0;

            return (
              <div
                key={y.year}
                className="relative rounded-xl p-3.5 border bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] transition-all duration-300 overflow-hidden"
              >
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                    isPositive ? 'bg-positive/[0.07]' : 'bg-negative/[0.07]'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />

                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.06]">
                      <svg
                        className="w-4.5 h-4.5 text-text-secondary"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        style={{ transform: isPositive ? 'none' : 'rotate(180deg)' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </div>
                    <div>
                      <div>
                        <span className="text-sm font-bold">{y.year}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-text-secondary">
                          {y.months} {t.patternsMonths || 'mesos'}
                        </span>
                        <span className="text-[11px] text-text-secondary/50">·</span>
                        <span className={`text-[11px] font-medium ${isPositive ? 'text-positive/80' : 'text-negative/80'}`}>
                          ~{formatMoney(Math.abs(avgPerMonth))}/{t.patternsPerMonth || 'mes'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-sm font-bold tabular-nums ${isPositive ? 'text-positive' : 'text-negative'}`}>
                      {isPositive ? '+' : '-'}{formatMoney(Math.abs(y.total))}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-text-secondary font-semibold tabular-nums">{y.positive}↑</span>
                      <span className="text-[10px] text-text-secondary font-semibold tabular-nums">{y.negative}↓</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
