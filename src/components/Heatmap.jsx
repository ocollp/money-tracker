export default function Heatmap({ data }) {

  const years = [...new Set(data.map(d => d.año))].sort();
  const monthNames = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];

  const grid = {};
  for (const d of data) {
    if (!grid[d.año]) grid[d.año] = {};
    grid[d.año][d.mes] = d;
  }

  const allValues = data.map(d => d.value);
  const maxAbs = Math.max(Math.abs(Math.min(...allValues)), Math.abs(Math.max(...allValues)), 1);

  const getCellStyle = (value) => {
    if (value == null) return { backgroundColor: 'rgba(148, 163, 184, 0.05)' };
    const intensity = Math.min(Math.abs(value) / maxAbs, 1);
    const alpha = 0.2 + intensity * 0.65;
    if (value > 0) return { backgroundColor: `rgba(34, 197, 94, ${alpha})`, boxShadow: intensity > 0.5 ? `0 0 8px rgba(34, 197, 94, ${intensity * 0.3})` : 'none' };
    if (value < 0) return { backgroundColor: `rgba(239, 68, 68, ${alpha})`, boxShadow: intensity > 0.5 ? `0 0 8px rgba(239, 68, 68, ${intensity * 0.3})` : 'none' };
    return { backgroundColor: 'rgba(148, 163, 184, 0.08)' };
  };

  const positiveMonths = data.filter(d => d.value > 0).length;
  const negativeMonths = data.filter(d => d.value < 0).length;

  return (
    <div className="bg-surface-alt rounded-2xl border border-border overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Rendiment mensual</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
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

      <div className="px-3 sm:px-5 pb-2 overflow-x-auto scrollbar-hide-mobile -mx-1 sm:mx-0">
        <table className="w-full min-w-[320px] sm:min-w-0 border-separate" style={{ borderSpacing: '4px 6px' }}>
          <thead>
            <tr>
              <th className="text-left text-text-secondary text-[10px] sm:text-[11px] font-semibold p-0 w-7 sm:w-10"></th>
              {monthNames.map(m => (
                <th key={m} className="text-center text-text-secondary/70 text-[10px] sm:text-[11px] font-semibold pb-1 sm:pb-1.5 px-0.5 min-w-[2.25rem] sm:min-w-0">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map(year => (
              <tr key={year}>
                <td className="text-text-secondary text-[11px] sm:text-[12px] font-bold pr-1 align-middle">{year}</td>
                {Array.from({ length: 12 }, (_, i) => {
                  const cell = grid[year]?.[i];
                  return (
                    <td key={i} className="p-0.5 sm:p-0 align-middle">
                      <div
                        className="rounded-full sm:rounded-lg w-[2.25rem] h-[2.25rem] sm:w-full sm:h-14 flex flex-col items-center justify-center transition-all duration-200 hover:brightness-110 mx-auto sm:mx-0"
                        style={getCellStyle(cell?.value)}
                      >
                        {cell && (
                          <>
                            <span className="text-[11px] sm:text-[13px] font-bold leading-none drop-shadow-sm tabular-nums">
                              {(Math.abs(cell.value) / 1000).toFixed(1)}k
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-text-primary/70 leading-none mt-0.5 font-medium hidden sm:inline tabular-nums">
                              {Math.abs(cell.pct).toFixed(1)}%
                            </span>
                          </>
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

      <div className="px-5 pb-4 pt-1 flex flex-wrap items-center gap-2 text-[10px] text-text-secondary border-t border-border/50">
        <div className="flex items-center gap-2 pt-3">
          <span className="text-text-secondary/60 font-medium">Pèrdua</span>
          <div className="flex items-center gap-0.5">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.8)' }} />
            <div className="w-4 h-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.45)' }} />
            <div className="w-4 h-3 rounded" style={{ backgroundColor: 'rgba(148, 163, 184, 0.08)' }} />
            <div className="w-4 h-3 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.45)' }} />
            <div className="w-4 h-3 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.8)' }} />
          </div>
          <span className="text-text-secondary/60 font-medium">Guany</span>
        </div>
      </div>
    </div>
  );
}
