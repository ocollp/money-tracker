import { useI18n } from '../i18n/I18nContext.jsx';
import { formatChange } from '../utils/formatters';
import { usePrivacy } from '../context/PrivacyContext.jsx';

export default function Heatmap({ data }) {
  const { t } = useI18n();
  const { hideMoney } = usePrivacy();
  const rows = Array.isArray(data) ? data : [];
  const years = [...new Set(rows.map(d => d.year))].sort((a, b) => b - a);
  const monthNames = t.monthsShort;

  const grid = {};
  for (const d of rows) {
    if (!grid[d.year]) grid[d.year] = {};
    grid[d.year][d.monthIdx] = d;
  }

  const absValues = rows.map(d => Math.abs(d.value)).sort((a, b) => a - b);
  const p90 = absValues.length > 0 ? absValues[Math.floor(absValues.length * 0.9)] : 1;
  const scaleMax = Math.max(p90, 1);

  const getCellStyle = (value) => {
    if (value == null) return { backgroundColor: 'rgba(148, 163, 184, 0.05)' };
    const intensity = Math.min(Math.abs(value) / scaleMax, 1);
    const alpha = 0.2 + intensity * 0.65;
    if (value > 0) return { backgroundColor: `rgba(34, 197, 94, ${alpha})`, boxShadow: intensity > 0.5 ? `0 0 8px rgba(34, 197, 94, ${intensity * 0.3})` : 'none' };
    if (value < 0) return { backgroundColor: `rgba(239, 68, 68, ${alpha})`, boxShadow: intensity > 0.5 ? `0 0 8px rgba(239, 68, 68, ${intensity * 0.3})` : 'none' };
    return { backgroundColor: 'rgba(148, 163, 184, 0.08)' };
  };

  const positiveMonths = rows.filter(d => d.value > 0).length;
  const negativeMonths = rows.filter(d => d.value < 0).length;

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-3 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{t.heatmapTitle}</h3>
        <div className="flex items-center gap-3 text-xs shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-positive inline-block" />
            <span className="text-positive font-semibold">{positiveMonths} ↑</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-negative inline-block" />
            <span className="text-negative font-semibold">{negativeMonths} ↓</span>
          </span>
        </div>
      </div>

      <div className="px-3 pb-4 sm:px-5 sm:pb-5 overflow-x-auto overscroll-x-contain scrollbar-hide-mobile max-w-full touch-pan-x">
        <table className="w-max min-w-full border-separate max-w-none" style={{ borderSpacing: '3px 4px' }}>
          <thead>
            <tr>
              <th className="text-left text-text-secondary text-[10px] sm:text-[11px] font-semibold p-0 w-7 sm:w-10"></th>
              {monthNames.map(m => (
                <th key={m} className="text-center text-text-secondary/70 text-[9px] sm:text-[11px] font-semibold pb-1 px-0 min-w-[3.5rem] sm:min-w-0">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map(year => (
              <tr key={year}>
                <td className="text-text-secondary text-[10px] sm:text-[12px] font-bold pr-0.5 align-middle w-8 sm:w-auto">{year}</td>
                {Array.from({ length: 12 }, (_, i) => {
                  const cell = grid[year]?.[i];
                  return (
                    <td key={i} className="p-0 sm:p-0 align-middle">
                      <div
                        className="rounded-md sm:rounded-lg w-[3.5rem] min-h-[2.5rem] py-0.5 sm:w-full sm:min-h-14 sm:h-14 flex flex-col items-center justify-center transition-all duration-200 hover:brightness-110 active:scale-95 mx-auto sm:mx-0 px-0.5"
                        style={getCellStyle(cell?.value)}
                      >
                        {cell && (
                          hideMoney ? (
                            <span className="text-[9px] sm:text-[12px] font-bold leading-snug text-center tabular-nums text-text-primary/90">
                              {Math.abs(cell.pct).toFixed(1)}%
                            </span>
                          ) : (
                            <>
                              <span className="text-[9px] sm:text-[12px] font-bold leading-snug text-center drop-shadow-sm tabular-nums hyphens-none">
                                {formatChange(cell.value)}
                              </span>
                              <span className="mt-0.5 text-[7px] sm:text-[10px] text-text-primary/70 leading-none font-medium tabular-nums hidden sm:block text-center w-full">
                                {Math.abs(cell.pct).toFixed(1)}%
                              </span>
                            </>
                          )
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
