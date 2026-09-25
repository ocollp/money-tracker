import { useMemo, memo } from 'react';
import { formatMoney, formatChange } from '../utils/formatters';
import { useI18n } from '../i18n/I18nContext.jsx';
import { usePrivacy } from '../context/PrivacyContext.jsx';
import { DASHBOARD_SECTION_CARD, DASHBOARD_SECTION_TITLE } from '../lib/dashboardSectionStyles.js';
import { computeHeatmapScaleMax, heatmapCellBackground } from '../lib/heatmapCellStyle.js';

function buildHeatmapGrid(heatmap) {
  const grid = {};
  for (const d of heatmap || []) {
    if (!grid[d.year]) grid[d.year] = {};
    grid[d.year][d.monthIdx] = d;
  }
  return grid;
}

function Patterns({ yearComparison, heatmap }) {
  const { t } = useI18n();
  const { hideMoney } = usePrivacy();
  const rows = Array.isArray(heatmap) ? heatmap : [];
  const scaleMax = useMemo(() => computeHeatmapScaleMax(rows), [rows]);
  const sortedYears = [...(yearComparison || [])].sort((a, b) => b.year - a.year);
  const grid = buildHeatmapGrid(heatmap);
  const monthNames = t.monthsShort;
  const currentYear = new Date().getFullYear();

  return (
    <div className={`h-full ${DASHBOARD_SECTION_CARD}`}>
      <h3 className={`${DASHBOARD_SECTION_TITLE} mb-3`}>{t.patternsTitle}</h3>

      {sortedYears.length > 0 ? (
        <div className="space-y-2 min-h-0">
          {sortedYears.map((y) => {
            const isPositive = y.total >= 0;
            const yearGrid = grid[y.year] || {};
            const isCurrent = y.year === currentYear;
            const downMonths = Math.max(0, y.months - y.positive);

            return (
              <div
                key={y.year}
                className={`rounded-xl py-3 sm:py-3.5 border transition-all duration-300 ${
                  isCurrent
                    ? 'pl-3 pr-3 sm:pl-4 sm:pr-4 border-l-2 border-l-brand/45 bg-brand/[0.04] border-brand/20'
                    : 'px-3 sm:px-4 bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                    <span className="text-sm font-bold tabular-nums">{y.year}</span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold tabular-nums">
                      {y.positive > 0 ? (
                        <span className="text-positive/90">{t.patternsMonthUp(y.positive)}</span>
                      ) : null}
                      {downMonths > 0 ? (
                        <span className="text-negative/90">{t.patternsMonthDown(downMonths)}</span>
                      ) : null}
                    </span>
                  </div>
                  {hideMoney ? (
                    <span
                      className={`text-xs font-medium shrink-0 ${isPositive ? 'text-positive' : 'text-negative'}`}
                    >
                      {isPositive ? '↑' : '↓'}
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-medium tabular-nums shrink-0 ${
                        isPositive ? 'text-positive' : 'text-negative'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {formatMoney(y.total)}
                    </span>
                  )}
                </div>

                {y.patrimony != null && (
                  <p className="mb-2 text-xs text-text-secondary tabular-nums" title={y.patrimonyMonth}>
                    {hideMoney ? '••••' : formatMoney(y.patrimony)} de patrimoni total
                  </p>
                )}

                <div
                  className="grid grid-cols-12 gap-[3px] h-5 sm:h-2.5 w-full min-w-0"
                  role="img"
                  aria-label={t.patternsYearMonthsAria(y.year)}
                >
                  {Array.from({ length: 12 }, (_, monthIdx) => {
                    const cell = yearGrid[monthIdx];
                    const hasData = cell != null;
                    const label = monthNames[monthIdx];
                    const title =
                      hasData && !hideMoney
                        ? `${label}: ${formatChange(cell.value)}`
                        : hasData
                          ? `${label}: ${cell.value >= 0 ? '+' : '−'}`
                          : label;

                    return (
                      <div
                        key={monthIdx}
                        title={title}
                        className="min-w-0 h-full rounded-[2px]"
                        style={{ ...heatmapCellBackground(cell?.value, scaleMax, { withGlow: false }), boxShadow: 'none' }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default memo(Patterns);
