import { useState } from 'react';
import { formatMoney } from '../utils/formatters';

export default function Heatmap({ data }) {
  const [selected, setSelected] = useState(null);

  const years = [...new Set(data.map(d => d.año))].sort();
  const monthNames = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];

  const grid = {};
  const yearTotals = {};
  for (const d of data) {
    if (!grid[d.año]) grid[d.año] = {};
    grid[d.año][d.mes] = d;
    yearTotals[d.año] = (yearTotals[d.año] || 0) + d.value;
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

      <div className="px-5 pb-2 overflow-x-auto">
        <table className="w-full border-separate" style={{ borderSpacing: '3px' }}>
          <thead>
            <tr>
              <th className="text-left text-text-secondary text-[10px] font-semibold p-0 w-10"></th>
              {monthNames.map(m => (
                <th key={m} className="text-center text-text-secondary/70 text-[10px] font-semibold pb-1.5">{m}</th>
              ))}
              <th className="text-center text-text-secondary/70 text-[10px] font-semibold pb-1.5 pl-2">Any</th>
            </tr>
          </thead>
          <tbody>
            {years.map(year => (
              <tr key={year}>
                <td className="text-text-secondary text-[11px] font-bold pr-1">{year}</td>
                {Array.from({ length: 12 }, (_, i) => {
                  const cell = grid[year]?.[i];
                  const isSelected = selected && selected.año === year && selected.mes === i;
                  return (
                    <td key={i} className="p-0">
                      <div
                        className={`rounded-lg h-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-brand ring-offset-1 ring-offset-surface-alt scale-110 z-10 relative' : 'hover:scale-105 hover:brightness-110'}`}
                        style={getCellStyle(cell?.value)}
                        onClick={() => setSelected(cell && !isSelected ? cell : null)}
                      >
                        {cell && (
                          <>
                            <span className="text-[11px] font-bold leading-none drop-shadow-sm">
                              {(Math.abs(cell.value) / 1000).toFixed(1)}k
                            </span>
                            <span className="text-[8px] text-text-primary/50 leading-none mt-0.5 font-medium">
                              {Math.abs(cell.pct).toFixed(1)}%
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="p-0 pl-2">
                  <div className={`rounded-lg h-12 flex items-center justify-center text-[11px] font-bold ${(yearTotals[year] || 0) >= 0 ? 'text-positive bg-positive/15 border border-positive/20' : 'text-negative bg-negative/15 border border-negative/20'}`}>
                    {yearTotals[year] != null ? `${(Math.abs(yearTotals[year]) / 1000).toFixed(1)}k` : ''}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="mx-5 mb-3 bg-surface rounded-xl p-3.5 border border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold ${selected.value >= 0 ? 'bg-positive/15 text-positive' : 'bg-negative/15 text-negative'}`}>
              {selected.value >= 0 ? '↑' : '↓'}
            </div>
            <div>
              <p className="text-sm font-semibold">{selected.month}</p>
            </div>
          </div>
          <div className="flex gap-5 text-right">
            <div>
              <p className={`text-sm font-bold ${selected.value >= 0 ? 'text-positive' : 'text-negative'}`}>
                {formatMoney(Math.abs(selected.value))}
              </p>
              <p className="text-[10px] text-text-secondary">total</p>
            </div>
            <div>
              <p className={`text-sm font-bold ${selected.pct >= 0 ? 'text-positive' : 'text-negative'}`}>
                {Math.abs(selected.pct).toFixed(1)}%
              </p>
              <p className="text-[10px] text-text-secondary">percentatge</p>
            </div>
          </div>
        </div>
      )}

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
