import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatMoney } from '../utils/formatters';
import { useI18n } from '../i18n/I18nContext.jsx';

const DISTRIBUTION_COLORS = [
  '#ec4899', '#22c55e', '#0ea5e9', '#8b5cf6', '#f59e0b', '#6366f1',
  '#14b8a6', '#a855f7', '#64748b',
];

const ENTITY_COLORS = {
  BBVA: '#004481',
  'Compte corrent BBVA': '#60a5fa',
  'Hipoteca BBVA': '#004481',
  Revolut: '#facc15',
  'Trade Republic': '#8b5cf6',
  Urbanitae: '#16a34a',
  Efectivo: '#ec4899',
  Indexa: '#22c55e',
  'Indexa Capital': '#38bdf8',
  Fundeen: '#f97316',
};

function getColor(name, index) {
  return ENTITY_COLORS[name] ?? DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length];
}

const CustomTooltip = ({ active, payload, formatDisplayName, total, t }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const pct = total > 0 ? (d.value / total) * 100 : 0;
  return (
    <div className="bg-surface border border-border rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-text-secondary">{formatDisplayName(d.name)}</p>
      <p className="text-sm font-bold text-text-primary">{formatMoney(d.value)}</p>
      {typeof t.distributionTooltipPct === 'function' && (
        <p className="text-[11px] text-text-secondary/90 mt-0.5">{t.distributionTooltipPct(pct.toFixed(1))}</p>
      )}
    </div>
  );
};

function MiniSparkline({ data, color, width = 48, height = 18 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 1;
  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = padding + (1 - (v - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="shrink-0 opacity-60 hidden sm:block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DistributionChart({ distribution, title, selectedEntity, onSelectEntity, entityEvolution }) {
  const { t } = useI18n();
  const displayName = (name) => {
    if (name === 'Efectivo') return t.entityEffective;
    return name;
  };

  const sparklines = useMemo(() => {
    if (!entityEvolution?.length) return {};
    const last6 = entityEvolution.slice(-6);
    const result = {};
    for (const key of Object.keys(last6[0] || {})) {
      if (key === 'date' || key === 'key') continue;
      result[key] = last6.map(e => e[key] || 0);
    }
    return result;
  }, [entityEvolution]);

  if (!distribution?.length) return null;

  const total = distribution.reduce((s, d) => s + d.value, 0);
  const recalculated = distribution
    .map(d => ({ ...d, pct: total > 0 ? (d.value / total) * 100 : 0 }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const listItems = recalculated.map((d, i) => ({ item: d, index: i }));

  const clearFilter = () => onSelectEntity?.(null);

  return (
    <div
      className="h-full min-h-0 flex flex-col bg-surface-alt/80 rounded-2xl px-3 sm:px-5 pt-5 pb-3 border border-white/[0.06] shadow-lg shadow-black/10 max-w-full overflow-x-hidden"
      onDoubleClick={selectedEntity ? clearFilter : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 shrink-0">
        <h3 className="text-lg font-semibold">{title}</h3>
        {selectedEntity && onSelectEntity && (
          <button
            type="button"
            onClick={clearFilter}
            className="text-xs font-semibold px-3 py-2 min-h-10 rounded-xl bg-brand/15 text-brand border border-brand/30 hover:bg-brand/25 transition-colors"
          >
            {t.distributionAllEntities ?? 'All'}
          </button>
        )}
      </div>
      {selectedEntity && (
        <p className="text-[11px] text-text-secondary mb-2 sm:hidden">{t.distributionDoubleTapHint ?? ''}</p>
      )}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 flex-1 min-h-0">
        <div
          className="relative h-40 w-40 sm:h-48 sm:w-48 shrink-0"
          onDoubleClick={selectedEntity ? clearFilter : undefined}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {recalculated.map((d, i) => {
                  const c = getColor(d.name, i);
                  return (
                    <radialGradient key={i} id={`distGrad-${i}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={c} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={c} stopOpacity={0.55} />
                    </radialGradient>
                  );
                })}
              </defs>
              <Pie
                data={recalculated} dataKey="value" nameKey="name"
                cx="50%" cy="50%" innerRadius={52} outerRadius={80}
                strokeWidth={0}
                paddingAngle={3}
                style={{ cursor: 'pointer' }}
                onClick={(_, i) => {
                  const name = recalculated[i]?.name;
                  if (name && onSelectEntity) onSelectEntity(selectedEntity === name ? null : name);
                }}
                isAnimationActive={true}
                animationDuration={600}
                animationEasing="ease-out"
              >
                {recalculated.map((d, i) => (
                  <Cell
                    key={i}
                    fill={`url(#distGrad-${i})`}
                    opacity={selectedEntity && selectedEntity !== d.name ? 0.25 : 1}
                    style={{ transition: 'opacity 0.3s ease' }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={(props) => (
                  <CustomTooltip {...props} formatDisplayName={displayName} total={total} t={t} />
                )}
                wrapperStyle={{ zIndex: 50 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-text-secondary">{t.distributionTotal}</span>
            <span className="text-sm font-bold text-text-primary">{formatMoney(total)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 w-full">
          {listItems.map(({ item: d, index }) => {
            const c = getColor(d.name, index);
            return (
              <div
                key={d.name}
                className="space-y-0.5 cursor-pointer rounded-xl px-2 sm:px-2.5 py-1.5 -mx-1 transition-all duration-200 hover:bg-white/[0.04] active:bg-white/[0.06]"
                style={{ opacity: selectedEntity && selectedEntity !== d.name ? 0.3 : 1 }}
                onClick={() => onSelectEntity?.(selectedEntity === d.name ? null : d.name)}
                onDoubleClick={clearFilter}
              >
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0" style={{ background: c }} />
                    <span className="text-text-secondary text-xs sm:text-sm truncate">{displayName(d.name)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <MiniSparkline data={sparklines[d.name]} color={c} />
                    <span className="text-xs sm:text-sm font-semibold text-text-primary tabular-nums">{formatMoney(d.value)}</span>
                    <span className="text-[10px] sm:text-xs text-text-secondary w-7 sm:w-9 text-right tabular-nums">{d.pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${d.pct}%`,
                      background: `linear-gradient(90deg, ${c}80, ${c})`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
