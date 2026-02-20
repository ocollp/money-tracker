import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatMoney } from '../utils/formatters';
import { COLORS } from '../utils/formatters';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-surface border border-border rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-text-secondary">{d.name}</p>
      <p className="text-sm font-bold">{formatMoney(d.value)}</p>
    </div>
  );
};

export default function DistributionChart({ distribution: rawDistribution, title }) {
  const distribution = rawDistribution.filter(d => d.name !== 'BBVA');
  if (!distribution.length) return null;

  const total = distribution.reduce((s, d) => s + d.value, 0);
  const recalculated = distribution.map(d => ({ ...d, pct: total > 0 ? (d.value / total) * 100 : 0 }));
  const maxPct = Math.max(...recalculated.map(d => d.pct));

  return (
    <div className="bg-surface-alt rounded-2xl p-5 border border-border">
      <h3 className="text-lg font-semibold mb-5">{title}</h3>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={recalculated} dataKey="value" nameKey="name"
                cx="50%" cy="50%" innerRadius={52} outerRadius={80}
                strokeWidth={0}
                paddingAngle={3}
              >
                {recalculated.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 50 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-text-secondary">Total</span>
            <span className="text-sm font-bold">{formatMoney(total)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full">
          {recalculated.map((d, i) => (
            <div key={d.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-text-secondary text-sm">{d.name}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-semibold">{formatMoney(d.value)}</span>
                  <span className="text-xs text-text-secondary w-10 text-right">{d.pct.toFixed(0)}%</span>
                </div>
              </div>
              <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(d.pct / maxPct) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
