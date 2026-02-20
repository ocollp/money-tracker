import { formatMoney, formatChange } from '../utils/formatters';

export default function Patterns({ patterns, yearComparison }) {
  const sortedYears = [...yearComparison].sort((a, b) => b.year - a.year);

  return (
    <div className="bg-surface-alt rounded-2xl p-5 border border-border space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand/15 flex items-center justify-center">
          <span className="text-base">🔍</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Insights</h3>
          <p className="text-[11px] text-text-secondary -mt-0.5">Basats en els meus històrics</p>
        </div>
      </div>

      {/* Year comparison — descending */}
      {sortedYears.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2.5">Any a any</p>
          <div className="flex flex-wrap gap-2">
            {sortedYears.map(y => {
              const best = Math.max(...sortedYears.map(yc => Math.abs(yc.total)));
              const barWidth = best > 0 ? (Math.abs(y.total) / best) * 100 : 0;
              return (
                <div key={y.year} className="flex-1 min-w-[120px]">
                  <div className={`rounded-xl p-3 border ${y.total >= 0 ? 'bg-positive/5 border-positive/15' : 'bg-negative/5 border-negative/15'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold">{y.year}</span>
                      <span className={`text-sm font-bold ${y.total >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {formatChange(y.total)}
                      </span>
                    </div>
                    <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${y.total >= 0 ? 'bg-positive' : 'bg-negative'}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-text-secondary">
                      <span>{y.months} mesos</span>
                      <span>{y.positive}↑ {y.negative}↓</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly patterns */}
      {patterns.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Patrons mensuals</p>
          <p className="text-[10px] text-text-secondary mb-2.5">Mesos que sempre em repeteixo igual, mirant tots els anys</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {patterns.filter(p => p.type === 'positive').length > 0 && (
              <div className="bg-positive/5 border border-positive/15 rounded-xl p-4 space-y-2.5">
                <p className="text-xs font-semibold text-positive uppercase tracking-wider">Sempre guanyo</p>
                {patterns.filter(p => p.type === 'positive').map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{p.month}</span>
                    <span className="text-sm font-bold text-positive">{formatMoney(p.avg)}</span>
                  </div>
                ))}
              </div>
            )}
            {patterns.filter(p => p.type === 'negative').length > 0 && (
              <div className="bg-negative/5 border border-negative/15 rounded-xl p-4 space-y-2.5">
                <p className="text-xs font-semibold text-negative uppercase tracking-wider">Sempre perdo</p>
                {patterns.filter(p => p.type === 'negative').map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{p.month}</span>
                    <span className="text-sm font-bold text-negative">{formatMoney(p.avg)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
