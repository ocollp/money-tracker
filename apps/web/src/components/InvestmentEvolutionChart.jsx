import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMoney, formatChange } from '../utils/formatters';
import { useI18n } from '../i18n/I18nContext.jsx';

const RANGE_KEYS = ['6M', '1Y', 'MAX'];

const COLORS = [
  { stroke: '#8b5cf6', fill: '#8b5cf6' },
  { stroke: '#3b82f6', fill: '#3b82f6' },
  { stroke: '#10b981', fill: '#10b981' },
  { stroke: '#f59e0b', fill: '#f59e0b' },
  { stroke: '#ec4899', fill: '#ec4899' },
];

function filterByRange(data, range) {
  if (range === 'MAX' || !data.length) return data;
  const n = range === '6M' ? 6 : 12;
  return data.slice(Math.max(0, data.length - n));
}

function getXAxisTicks(data, isNarrow) {
  if (!data?.length) return [];
  if (data.length <= 3) return data.map(d => d.date);
  const first = data[0].date;
  const last = data[data.length - 1].date;
  if (isNarrow) {
    const mid = data[Math.floor(data.length / 2)].date;
    return [first, mid, last];
  }
  const step = Math.max(1, Math.floor(data.length / 5));
  const ticks = [];
  for (let i = 0; i < data.length; i += step) ticks.push(data[i].date);
  if (ticks[ticks.length - 1] !== last) ticks.push(last);
  return ticks;
}

export default function InvestmentEvolutionChart({ data, subEntities, title }) {
  const { t } = useI18n();
  const [range, setRange] = useState('MAX');
  const [active, setActive] = useState(() => {
    const initial = {};
    subEntities.forEach(se => { initial[se] = true; });
    return initial;
  });
  const containerRef = useRef(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(([entry]) => setIsNarrow(entry.contentRect.width < 400));
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const activeKeys = useMemo(() => subEntities.filter(se => active[se]), [subEntities, active]);

  const filtered = useMemo(() => filterByRange(data, range), [data, range]);

  const ticks = useMemo(() => getXAxisTicks(filtered, isNarrow), [filtered, isNarrow]);

  const toggle = useCallback((key) => {
    setActive(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const summary = useMemo(() => {
    if (!filtered.length) return null;
    const last = filtered[filtered.length - 1];
    const prev = filtered.length > 1 ? filtered[filtered.length - 2] : null;
    let currentTotal = 0;
    let prevTotal = 0;
    for (const k of activeKeys) {
      currentTotal += last[k] || 0;
      if (prev) prevTotal += prev[k] || 0;
    }
    const change = prev ? currentTotal - prevTotal : null;
    return { current: currentTotal, change };
  }, [filtered, activeKeys]);

  const chartMargin = isNarrow
    ? { top: 10, right: 4, bottom: 0, left: 0 }
    : { top: 10, right: 12, bottom: 0, left: 4 };

  const rangeLabel = (k) => {
    if (k === 'MAX') return t.rangeMax ?? 'Tot';
    return k;
  };

  return (
    <div ref={containerRef} className="bg-surface-alt/80 rounded-2xl p-4 sm:p-5 border border-white/[0.06] shadow-lg shadow-black/10 flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 shrink-0">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div
          className="flex flex-wrap gap-1 p-0.5 rounded-xl bg-surface/80 border border-white/[0.06] self-start"
          role="group"
        >
          {RANGE_KEYS.map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setRange(k)}
              className={`px-2.5 py-1.5 min-h-9 text-[11px] sm:text-xs font-semibold rounded-lg transition-colors ${
                range === k
                  ? 'bg-brand/25 text-text-primary border border-brand/40'
                  : 'text-text-secondary hover:text-text-primary border border-transparent'
              }`}
            >
              {rangeLabel(k)}
            </button>
          ))}
        </div>
      </div>

      {subEntities.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {subEntities.map((se, i) => {
            const c = COLORS[i % COLORS.length];
            const isActive = active[se];
            const label = se.replace(/ (Revolut|Trade Republic|BBVA|CaixaBank|Indexa Capital|Fundeen|Urbanitae|Efectivo)$/i, '');
            return (
              <button
                key={se}
                type="button"
                onClick={() => toggle(se)}
                className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition-all duration-150 ${
                  isActive
                    ? 'border-white/[0.15] text-text-primary'
                    : 'border-white/[0.05] text-text-secondary/50'
                }`}
                style={isActive ? { backgroundColor: c.stroke + '20' } : undefined}
              >
                <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: isActive ? c.stroke : '#666' }} />
                {label}
              </button>
            );
          })}
        </div>
      )}

      {summary && (
        <div className="flex items-baseline gap-3 mb-3 shrink-0">
          <span className="text-xl font-bold">{formatMoney(summary.current)}</span>
          {summary.change != null && (
            <span className={`text-sm font-medium ${summary.change >= 0 ? 'text-positive' : 'text-negative'}`}>
              {formatChange(summary.change)}
            </span>
          )}
        </div>
      )}

      <div className="min-h-[220px] flex-1 min-h-0 touch-none" style={{ touchAction: 'none' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered} margin={chartMargin}>
            <defs>
              {activeKeys.map((key, i) => {
                const c = COLORS[subEntities.indexOf(key) % COLORS.length];
                return (
                  <linearGradient key={key} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.fill} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={c.fill} stopOpacity={0.02} />
                  </linearGradient>
                );
              })}
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              ticks={ticks}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`}
              width={42}
            />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(v, name) => [formatMoney(v), name.replace(/ (Revolut|Trade Republic)$/i, '')]}
            />
            {activeKeys.map((key, i) => {
              const c = COLORS[subEntities.indexOf(key) % COLORS.length];
              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={c.stroke}
                  strokeWidth={2}
                  fill={`url(#grad-${i})`}
                  fillOpacity={1}
                  dot={false}
                  activeDot={{ r: 4, fill: c.stroke }}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
