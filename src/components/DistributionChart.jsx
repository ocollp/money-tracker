import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatMoney } from '../utils/formatters';

const DISTRIBUTION_COLORS = [
  '#6366f1', '#22c55e', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ec4899',
  '#14b8a6', '#a855f7', '#64748b',
];

const ENTITY_COLORS = {
  BBVA: '#004481',
  'BBVA - Compte corrent': '#f97316',
  'BBVA - Hipoteca': '#004481',
  Revolut: '#facc15',
  'Trade Republic': '#8b5cf6',
  Urbanitae: '#16a34a',
  Efectivo: '#ec4899',
  Indexa: '#22c55e',
  'Indexa Capital': '#22c55e',
  Fundeen: '#f97316',
};

function getColor(name, index) {
  return ENTITY_COLORS[name] ?? DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length];
}

const displayName = (name) => {
  if (name === 'Efectivo') return 'Efectiu';
  if (name === 'BBVA - Compte corrent') return 'Compte corrent';
  return name;
};
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-surface border border-border rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-text-secondary">{displayName(d.name)}</p>
      <p className="text-sm font-bold">{formatMoney(d.value)}</p>
    </div>
  );
};

export default function DistributionChart({ distribution, title }) {
  if (!distribution?.length) return null;

  const total = distribution.reduce((s, d) => s + d.value, 0);
  const recalculated = distribution
    .map(d => ({ ...d, pct: total > 0 ? (d.value / total) * 100 : 0 }))
    .sort((a, b) => {
      const aBBVA = a.name.startsWith('BBVA -');
      const bBBVA = b.name.startsWith('BBVA -');
      if (aBBVA && !bBBVA) return -1;
      if (!aBBVA && bBBVA) return 1;
      if (aBBVA && bBBVA) return b.pct - a.pct;
      return b.pct - a.pct;
    });

  const listItems = [];
  for (let i = 0; i < recalculated.length; i++) {
    const curr = recalculated[i];
    const next = recalculated[i + 1];
    const isBBVAPair =
      (curr.name === 'BBVA - Hipoteca' && next?.name === 'BBVA - Compte corrent') ||
      (curr.name === 'BBVA - Compte corrent' && next?.name === 'BBVA - Hipoteca');
    if (isBBVAPair) {
      const first = curr.value >= next.value ? curr : next;
      const second = curr.value >= next.value ? next : curr;
      listItems.push({
        grouped: true,
        first,
        second,
        combinedPct: curr.pct + next.pct,
      });
      i++;
    } else {
      listItems.push({ grouped: false, item: curr, index: i });
    }
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-surface-alt rounded-2xl px-5 pt-5 pb-3 border border-border">
      <h3 className="text-lg font-semibold mb-3 shrink-0">{title}</h3>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 flex-1 min-h-0">
        <div className="relative h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {recalculated.map((d, i) => {
                  const c = getColor(d.name, i);
                  return (
                    <radialGradient key={i} id={`distGrad-${i}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={c} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={c} stopOpacity={0.5} />
                    </radialGradient>
                  );
                })}
                </defs>
              <Pie
                data={recalculated} dataKey="value" nameKey="name"
                cx="50%" cy="50%" innerRadius={52} outerRadius={80}
                strokeWidth={0}
                paddingAngle={3}
              >
                {recalculated.map((_, i) => (
                  <Cell key={i} fill={`url(#distGrad-${i})`} />
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
          {listItems.map((entry) =>
            entry.grouped ? (
              <div key="bbva-group" className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ENTITY_COLORS[entry.first.name], opacity: 0.9 }} />
                    <span className="text-text-secondary text-sm">{entry.first.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold">{formatMoney(entry.first.value)}</span>
                    <span className="text-xs text-text-secondary w-10 text-right">{entry.first.pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ENTITY_COLORS[entry.second.name], opacity: 0.9 }} />
                    <span className="text-text-secondary text-sm">{entry.second.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold">{formatMoney(entry.second.value)}</span>
                    <span className="text-xs text-text-secondary w-10 text-right">{entry.second.pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full flex transition-all duration-500"
                    style={{ width: `${entry.combinedPct}%` }}
                  >
                    <div
                      className="h-full rounded-l-full"
                      style={{
                        width: `${(entry.first.pct / entry.combinedPct) * 100}%`,
                        background: `linear-gradient(90deg, ${ENTITY_COLORS[entry.first.name]}80, ${ENTITY_COLORS[entry.first.name]})`,
                      }}
                    />
                    <div
                      className="h-full rounded-r-full"
                      style={{
                        width: `${(entry.second.pct / entry.combinedPct) * 100}%`,
                        background: `linear-gradient(90deg, ${ENTITY_COLORS[entry.second.name]}80, ${ENTITY_COLORS[entry.second.name]})`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              (() => {
                const d = entry.item;
                const c = getColor(d.name, entry.index);
                return (
                  <div key={d.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c, opacity: 0.9 }} />
                        <span className="text-text-secondary text-sm">{displayName(d.name)}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-semibold">{formatMoney(d.value)}</span>
                        <span className="text-xs text-text-secondary w-10 text-right">{d.pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${d.pct}%`,
                          background: `linear-gradient(90deg, ${c}80, ${c})`,
                        }}
                      />
                    </div>
                  </div>
                );
              })()
            )
          )}
        </div>
      </div>
    </div>
  );
}
