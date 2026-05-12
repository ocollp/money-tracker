import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatMoney } from '../utils/formatters';
import { useI18n } from '../i18n/I18nContext.jsx';

const DISTRIBUTION_COLORS = [
  '#2563eb',
  '#ca8a04',
  '#0891b2',
  '#ea580c',
  '#22c55e',
  '#a855f7',
  '#ec4899',
  '#0ea5e9',
];

const ENTITY_COLORS = {
  BBVA: '#2563eb',
  'Compte corrent BBVA': '#3b82f6',
  'Hipoteca BBVA': '#1e40af',
  Revolut: '#b45309',
  'Trade Republic': '#0e7490',
  Urbanitae: '#ea580c',
  Efectivo: '#22c55e',
  Indexa: '#7c3aed',
  'Indexa Capital': '#8b5cf6',
  Fundeen: '#ea580c',
  'Fons de viatges': '#9333ea',
  Habitatge: '#0891b2',
  Crowdfunding: '#f97316',
  'Fons indexat': '#a855f7',
  'Pla de pensions': '#1d4ed8',
  Accions: '#22c55e',
  Cripto: '#ec4899',
  'Compte remunerat': '#ca8a04',
  "Fons d'emergència": '#ef4444',
};

const REPARTIMENT_DISPLAY_LABELS = {
  'Hipoteca BBVA': 'Hipoteca',
  'Compte corrent BBVA': 'BBVA',
  CaixaBank: 'La Caixa',
};

function getColor(name, index) {
  return ENTITY_COLORS[name] ?? DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length];
}

const TOGGLE_BTN_BASE =
  'w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200';
const TOGGLE_INACTIVE =
  'bg-white/[0.03] border-white/[0.06] text-text-secondary/30 hover:bg-white/[0.08] hover:text-text-secondary/55 hover:border-white/[0.1]';
const TOGGLE_ACTIVE_NEUTRAL = 'bg-white/[0.14] border-white/[0.2] text-white';
const TOGGLE_ACTIVE_BRAND =
  'bg-brand/25 text-text-primary border-brand/45 shadow-sm shadow-brand/10';

const CustomTooltip = ({ active, payload, formatDisplayName, total, t, hideMoney }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const pct = total > 0 ? (d.value / total) * 100 : 0;
  return (
    <div className="rounded-xl px-3 py-2 shadow-xl border border-white/[0.12] bg-slate-900/75 backdrop-blur-xl">
      <p className="text-xs text-text-secondary">{formatDisplayName(d.name)}</p>
      {!hideMoney ? (
        <p className="text-sm font-bold text-text-primary">{formatMoney(d.value)}</p>
      ) : null}
      {typeof t.distributionTooltipPct === 'function' && (
        <p className={`text-[11px] text-text-secondary/90 ${hideMoney ? 'mt-0 font-semibold text-text-primary' : 'mt-0.5'}`}>
          {t.distributionTooltipPct(pct.toFixed(1))}
        </p>
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
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="shrink-0 opacity-60 block h-3 w-9 min-[380px]:w-10 sm:h-[18px] sm:w-12"
      aria-hidden
    >
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

function ToggleButton({ active, onClick, children, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${TOGGLE_BTN_BASE} text-sm leading-none ${active ? TOGGLE_ACTIVE_NEUTRAL : TOGGLE_INACTIVE}`}
      aria-label={label}
    >
      {children}
    </button>
  );
}

/** % of maxRadius (half of min chart w/h). High values fill the square; keep <100% to avoid SVG edge clipping. */
const PIE_LAYOUT = {
  donut: {
    innerRadius: '39%',
    outerRadius: '84%',
    paddingAngle: 0,
    cornerRadius: 0,
    stroke: 'transparent',
    strokeWidth: 0,
  },
  trivial: {
    innerRadius: 0,
    outerRadius: '84%',
    paddingAngle: 0,
    cornerRadius: 0,
    stroke: 'transparent',
    strokeWidth: 0,
  },
};

export default function DistributionChart({
  distribution,
  title,
  selectedEntities = [],
  onSelectEntity,
  entityEvolution,
  distributionSparklineExtras,
  hasHousing,
  onShowHousingChange,
  pieVariant = 'donut',
  privacyToggle = false,
}) {
  const { t } = useI18n();
  const [showHousing, setShowHousing] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(true);

  const hasSelection = selectedEntities.length > 0;
  const isSliceSelected = (name) => selectedEntities.includes(name);

  const displayName = (name) => {
    if (name in REPARTIMENT_DISPLAY_LABELS) return REPARTIMENT_DISPLAY_LABELS[name];
    if (name === 'Efectivo') return t.entityEffective;
    if (name === 'Fons de viatges') return t.travelFundLabel ?? 'Fons de viatges';
    return name;
  };

  const isHidden = (d) => !showHousing && d.isHousing;

  const sparklines = useMemo(() => {
    if (!entityEvolution?.length) return {};
    const last6 = entityEvolution.slice(-6);
    const result = {};
    for (const key of Object.keys(last6[0] || {})) {
      if (key === 'date' || key === 'key') continue;
      result[key] = last6.map(e => e[key] || 0);
    }
    if (result.BBVA) {
      result['Compte corrent BBVA'] = result.BBVA;
    }
    if (distributionSparklineExtras && typeof distributionSparklineExtras === 'object') {
      for (const [k, series] of Object.entries(distributionSparklineExtras)) {
        if (Array.isArray(series) && series.length >= 2) {
          result[k] = series.slice(-6);
        }
      }
    }
    return result;
  }, [entityEvolution, distributionSparklineExtras]);

  if (!distribution?.length) return null;

  const visibleTotal = distribution
    .filter(d => !isHidden(d))
    .reduce((s, d) => s + d.value, 0);
  const recalculated = distribution
    .map(d => {
      const hidden = isHidden(d);
      return { ...d, pct: !hidden && visibleTotal > 0 ? (d.value / visibleTotal) * 100 : 0, hidden };
    })
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const pieData = recalculated.filter(d => !d.hidden);
  const visibleList = recalculated.filter((d) => !d.hidden);
  const selectionAppliesToPie = selectedEntities.some((n) => pieData.some((p) => p.name === n));

  const clearFilter = () => onSelectEntity?.(null);

  const hideMoney = privacyToggle && !privacyMode;
  const pieShape = PIE_LAYOUT[pieVariant] ?? PIE_LAYOUT.donut;
  const hasDonutHole =
    Number(pieShape.innerRadius) > 0
    || (typeof pieShape.innerRadius === 'string' && parseFloat(pieShape.innerRadius) > 0);

  return (
    <div
      className="flex min-h-0 flex-col gap-0 glass-card max-w-full overflow-x-hidden px-3 pb-1 pt-1 sm:gap-0 sm:px-5 sm:py-4"
      onDoubleClick={hasSelection ? clearFilter : undefined}
    >
      <div className="flex min-w-0 shrink-0 flex-row flex-wrap items-center justify-between gap-x-1.5 gap-y-0.5 pb-0 sm:mb-2 sm:gap-x-4 sm:gap-y-1 sm:pb-0">
        <h3 className="min-w-0 flex-1 truncate text-lg font-semibold leading-tight sm:min-w-0 sm:pr-2">
          {title}
        </h3>
        <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-1">
          {hasSelection && onSelectEntity && (
            <button
              type="button"
              onClick={clearFilter}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/[0.05] text-text-secondary border border-white/[0.08] hover:bg-white/[0.09] hover:text-text-primary transition-all duration-150 flex items-center gap-1.5"
            >
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              {t.distributionAllEntities ?? 'Totes'}
            </button>
          )}
          {hasHousing && (
            <ToggleButton
              active={showHousing}
              onClick={() => {
                setShowHousing((v) => {
                  const next = !v;
                  onShowHousingChange?.(next);
                  return next;
                });
              }}
              label={t.toggleHousing ?? 'Habitatge'}
            >
              <span className="text-sm leading-none">🏠</span>
            </ToggleButton>
          )}
          {privacyToggle && (
            <button
              type="button"
              onClick={() => setPrivacyMode((v) => !v)}
              aria-pressed={privacyMode}
              aria-label={privacyMode ? (t.distributionPrivacyHideMoney ?? '') : (t.distributionPrivacyShowMoney ?? '')}
              className={`${TOGGLE_BTN_BASE} text-sm leading-none ${
                privacyMode ? TOGGLE_ACTIVE_BRAND : TOGGLE_INACTIVE
              }`}
            >
              👀
            </button>
          )}
        </div>
      </div>
      {hasSelection && (
        <p className="mb-0.5 text-[11px] leading-snug text-text-secondary sm:mb-2 sm:hidden">{t.distributionDoubleTapHint ?? ''}</p>
      )}
      <div className="flex min-h-0 w-full flex-col items-stretch gap-0 sm:flex-row sm:items-center sm:gap-4 lg:gap-5">
        <div
          className="relative -mt-px mx-auto aspect-square w-full max-w-[min(100%,17rem)] shrink-0 leading-none sm:mx-0 sm:mt-0 sm:h-64 sm:w-64 sm:max-w-none lg:h-72 lg:w-72"
          onDoubleClick={hasSelection ? clearFilter : undefined}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={pieData} dataKey="value" nameKey="name"
                cx="50%" cy="50%"
                innerRadius={pieShape.innerRadius}
                outerRadius={pieShape.outerRadius}
                paddingAngle={pieShape.paddingAngle}
                cornerRadius={pieShape.cornerRadius}
                stroke={pieShape.stroke}
                strokeWidth={pieShape.strokeWidth ?? 0}
                style={{ cursor: onSelectEntity ? 'pointer' : 'default' }}
                onClick={(_, i) => {
                  const name = pieData[i]?.name;
                  if (name && onSelectEntity) onSelectEntity(name);
                }}
                isAnimationActive={true}
                animationDuration={600}
                animationEasing="ease-out"
              >
                {pieData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={getColor(d.name, i)}
                    opacity={selectionAppliesToPie && !isSliceSelected(d.name) ? 0.25 : 1}
                    style={{ transition: 'opacity 0.3s ease' }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={(props) => (
                  <CustomTooltip
                    {...props}
                    formatDisplayName={displayName}
                    total={visibleTotal}
                    t={t}
                    hideMoney={hideMoney}
                  />
                )}
                wrapperStyle={{ zIndex: 50 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center sm:px-2">
            {hasDonutHole ? (
              <div className="flex flex-col gap-0.5">
                {hideMoney ? (
                  <>
                    <span className="text-[10px] leading-tight text-text-secondary sm:text-xs">
                      {t.distributionPctOnlyLabel ?? '%'}
                    </span>
                    <span className="text-base font-bold tabular-nums tracking-tight text-text-primary sm:text-lg">
                      100%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] text-text-secondary sm:text-xs">{t.distributionTotal}</span>
                    <span className="text-sm font-semibold tabular-nums text-text-primary sm:text-base">
                      {formatMoney(visibleTotal)}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <div className="max-w-[min(92%,18rem)] rounded-full border border-white/[0.14] bg-black/50 px-3 py-2 shadow-lg backdrop-blur-md sm:max-w-[80%] sm:px-4 sm:py-2.5">
                {hideMoney ? (
                  <>
                    <span className="block text-[10px] leading-tight text-text-secondary sm:text-xs">
                      {t.distributionPctOnlyLabel ?? '%'}
                    </span>
                    <span className="text-sm font-bold tabular-nums tracking-tight text-text-primary sm:text-base">
                      100%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block text-[10px] leading-tight text-text-secondary sm:text-xs">
                      {t.distributionTotal}
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-text-primary sm:text-sm">
                      {formatMoney(visibleTotal)}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="-mt-1 flex w-full min-w-0 flex-col gap-1 sm:mt-0 sm:flex-1 sm:gap-1.5">
          {visibleList.map((d, index) => {
            const c = getColor(d.name, index);
            return (
              <div
                key={d.name}
                className={`space-y-0.5 rounded-xl px-2 py-1.5 transition-all duration-200 sm:px-2.5 ${onSelectEntity ? 'cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.06]' : 'cursor-default'}`}
                style={{ opacity: selectionAppliesToPie && !isSliceSelected(d.name) ? 0.3 : 1 }}
                onClick={() => onSelectEntity?.(d.name)}
                onDoubleClick={clearFilter}
              >
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0" style={{ background: c }} />
                    <span className="text-text-secondary text-xs sm:text-sm truncate">{displayName(d.name)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {!hideMoney ? <MiniSparkline data={sparklines[d.name]} color={c} /> : null}
                    {!hideMoney ? (
                      <span className="text-xs sm:text-sm font-semibold text-text-primary tabular-nums">{formatMoney(d.value)}</span>
                    ) : null}
                    <span
                      className={`tabular-nums text-right font-semibold text-text-primary ${
                        hideMoney ? 'text-sm sm:text-base min-w-[3.25rem]' : 'text-[10px] sm:text-xs text-text-secondary w-7 sm:w-9'
                      }`}
                    >
                      {hideMoney ? `${d.pct.toFixed(1)}%` : `${d.pct.toFixed(0)}%`}
                    </span>
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
