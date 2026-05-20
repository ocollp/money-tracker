import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { formatMoney, formatChange, formatPct } from '../utils/formatters';
import { useI18n } from '../i18n/I18nContext.jsx';
import { usePrivacy } from '../context/PrivacyContext.jsx';
import {
  DASHBOARD_SECTION_CARD,
  DASHBOARD_SECTION_HEADER,
  DASHBOARD_SECTION_TITLE,
} from '../lib/dashboardSectionStyles.js';

function getXAxisTicks(data, isNarrow) {
  if (!data?.length) return [];
  if (data.length <= 3) return data.map((d) => d.date);
  const first = data[0].date;
  const last = data[data.length - 1].date;
  const n = data.length;
  if (isNarrow) {
    const mid = data[Math.floor(n / 2)].date;
    return [first, mid, last];
  }
  const mid1 = data[Math.floor(n / 3)].date;
  const mid2 = data[Math.floor((2 * n) / 3)].date;
  return [first, mid1, mid2, last];
}

function renderXAxisTick(props, firstDate, lastDate, fontSize) {
  const { x, y, payload } = props;
  const isFirst = payload.value === firstDate;
  const isLast = payload.value === lastDate;
  const textAnchor = isFirst ? 'start' : isLast ? 'end' : 'middle';
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={8} textAnchor={textAnchor} fill="#f1f5f9" fontSize={fontSize}>
        {payload.value}
      </text>
    </g>
  );
}

function CustomCursor({ points, height }) {
  if (!points?.length) return null;
  const { x } = points[0];
  return (
    <line
      x1={x} y1={0} x2={x} y2={height}
      stroke="#38bdf860" strokeWidth={1} strokeDasharray="4 3"
    />
  );
}

function formatNetWorthAxisTick(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a < 1000) return `${sign}${Math.round(a)}`;
  if (a < 10_000) {
    const k = (a / 1000).toFixed(1).replace(/\.0$/, '');
    return `${sign}${k}k`;
  }
  return `${sign}${(a / 1000).toFixed(0)}k`;
}

const RANGE_KEYS = ['3', '6', '12', 'all'];

export default function NetWorthChart({ months, totals, title = 'Patrimoni', subtitle = 'Diners i inversions', tooltipLabel = 'Patrimoni', selectedEntity, onClearEntity }) {
  const { t } = useI18n();
  const { hideMoney } = usePrivacy();
  const [range, setRange] = useState('12');
  const [narrow, setNarrow] = useState(typeof window !== 'undefined' && window.innerWidth < 640);
  const [animKey, setAnimKey] = useState(0);
  const prevTitleRef = useRef(title);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const onChange = (e) => setNarrow(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (prevTitleRef.current !== title) {
      setAnimKey(k => k + 1);
      prevTitleRef.current = title;
    }
  }, [title]);

  const { sliceMonths, sliceTotals } = useMemo(() => {
    const m = months ?? [];
    const rawT = totals ?? [];
    const len = m.length;
    if (!len) return { sliceMonths: [], sliceTotals: [] };
    const t =
      rawT.length === len
        ? rawT
        : rawT.length > len
          ? rawT.slice(0, len)
          : m.map((_, i) => (i < rawT.length ? rawT[i] : rawT[rawT.length - 1] ?? 0));
    if (range === 'all') return { sliceMonths: m, sliceTotals: t };
    const n = range === '3' ? 3 : range === '6' ? 6 : 12;
    const start = Math.max(0, len - n);
    return {
      sliceMonths: m.slice(start),
      sliceTotals: t.slice(start),
    };
  }, [months, totals, range]);

  const data = sliceMonths.map((m, i) => ({
    date: m.shortLabel,
    total: typeof sliceTotals[i] === 'number' && !Number.isNaN(sliceTotals[i]) ? sliceTotals[i] : 0,
  }));

  const lastPoint = data.length > 0 ? data[data.length - 1] : null;

  const yDomain = useMemo(() => {
    if (data.length < 1) return undefined;
    const values = data.map((d) => d.total);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return undefined;
    if (lo === hi) {
      const pad = Math.max(Math.abs(lo) * 0.05, 500);
      return [lo - pad, hi + pad];
    }
    const span = hi - lo;
    const pad = Math.max(span * 0.06, Math.abs(hi) * 0.02, 200);
    return [lo - pad, hi + pad];
  }, [data]);

  const xTicks = getXAxisTicks(data, narrow);
  const chartMargin = {
    top: 5,
    right: narrow ? 16 : 12,
    bottom: 12,
    left: 0,
  };
  const tickFontSize = narrow ? 10 : 11;

  const renderTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const val = payload[0].value;
    const idx = data.findIndex(d => d.date === label);
    const prev = idx > 0 ? data[idx - 1].total : null;
    const diff = prev != null ? val - prev : null;
    const diffPct = diff != null && prev != null && prev !== 0 ? (diff / Math.abs(prev)) * 100 : null;
    return (
      <div
        className="rounded-xl px-3.5 py-2.5 shadow-xl backdrop-blur-sm"
        style={{ background: 'rgba(15, 23, 42, 0.88)', border: '1px solid rgba(56, 189, 248, 0.22)' }}
      >
        <div className="text-[11px] font-medium mb-1" style={{ color: '#94a3b8' }}>{label}</div>
        {hideMoney ? (
          diffPct != null && !Number.isNaN(diffPct) ? (
            <div className="text-sm font-bold" style={{ color: diffPct >= 0 ? '#4ade80' : '#f87171' }}>
              {formatPct(diffPct)}
            </div>
          ) : null
        ) : (
          <div className="text-sm font-bold" style={{ color: '#f1f5f9' }}>{formatMoney(val)}</div>
        )}
        {!hideMoney && diff != null && typeof t.netWorthTooltipVsPrev === 'function' && (
          <div className="text-[11px] font-medium mt-0.5" style={{ color: diff >= 0 ? '#4ade80' : '#f87171' }}>
            {t.netWorthTooltipVsPrev(formatChange(diff))}
          </div>
        )}
      </div>
    );
  }, [data, t, hideMoney]);

  const rangeLabel = (k) => {
    if (k === '3') return t.netWorthRange3 ?? '3';
    if (k === '6') return t.netWorthRange6 ?? '6';
    if (k === '12') return t.netWorthRange12 ?? '12';
    return t.netWorthRangeAll ?? 'All';
  };

  return (
    <div className={`h-full ${DASHBOARD_SECTION_CARD}`}>
      <div className={DASHBOARD_SECTION_HEADER}>
        <div className="flex min-w-0 w-full flex-col gap-1.5 sm:flex-1 sm:min-w-0">
          <h3 className={`${DASHBOARD_SECTION_TITLE} transition-all duration-300`}>
            {title}
          </h3>
          {selectedEntity && onClearEntity && (
            <button
              type="button"
              onClick={onClearEntity}
              title={selectedEntity}
              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white/[0.05] text-text-secondary border border-white/[0.08] hover:bg-white/[0.09] hover:text-text-primary transition-all duration-150 inline-flex items-center gap-1.5 max-w-full min-w-0 self-start"
            >
              <span className="min-w-0 truncate text-left">{selectedEntity}</span>
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
        <div
          className="flex flex-wrap gap-1 p-0.5 rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/[0.1] self-start shrink-0"
          role="group"
          aria-label={t.netWorthRangeAria ?? 'Period'}
        >
          {RANGE_KEYS.map((k) => (
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
      {subtitle && <p className="text-xs text-text-secondary mb-4 shrink-0">{subtitle}</p>}
      <div
        className="w-full touch-none shrink-0"
        style={{ touchAction: 'none', height: 280 }}
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart key={animKey} data={data} margin={chartMargin}>
            <defs>
              <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.32} />
                <stop offset="40%" stopColor="#38bdf8" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              ticks={xTicks}
              padding={{ left: 8, right: 8 }}
              tick={(props) => renderXAxisTick(props, data[0]?.date, data[data.length - 1]?.date, tickFontSize)}
            />
            <YAxis
              domain={yDomain}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatNetWorthAxisTick}
              width={narrow ? 40 : 44}
              tick={hideMoney ? false : (props) => {
                const { y, payload } = props;
                const text = formatNetWorthAxisTick(payload.value);
                return (
                  <text x={0} y={y} dy={4} textAnchor="start" fill="#f1f5f9" fontSize={12}>
                    {text}
                  </text>
                );
              }}
            />
            <Tooltip content={renderTooltip} cursor={<CustomCursor />} />
            <Area
              type="monotone" dataKey="total" stroke="#38bdf8" strokeWidth={2.5}
              fill="url(#netWorthGrad)" dot={false}
              activeDot={{ r: 5, fill: '#38bdf8', stroke: '#38bdf840', strokeWidth: 6 }}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
            {lastPoint && (
              <ReferenceDot
                x={lastPoint.date} y={lastPoint.total}
                r={4} fill="#38bdf8" stroke="#0f172a" strokeWidth={2}
                isFront
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
