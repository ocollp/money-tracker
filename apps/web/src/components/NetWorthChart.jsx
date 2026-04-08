import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { formatMoney, formatChange } from '../utils/formatters';
import { useI18n } from '../i18n/I18nContext.jsx';

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
      stroke="#ec489960" strokeWidth={1} strokeDasharray="4 3"
    />
  );
}

const RANGE_KEYS = ['3', '6', '12', 'all'];

export default function NetWorthChart({ months, totals, title = 'Patrimoni', subtitle = 'Diners i inversions', tooltipLabel = 'Patrimoni' }) {
  const { t } = useI18n();
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
    if (!months?.length || range === 'all') return { sliceMonths: months, sliceTotals: totals };
    const n = range === '3' ? 3 : range === '6' ? 6 : 12;
    const start = Math.max(0, months.length - n);
    return {
      sliceMonths: months.slice(start),
      sliceTotals: totals.slice(start),
    };
  }, [months, totals, range]);

  const data = sliceMonths.map((m, i) => ({
    date: m.shortLabel,
    total: sliceTotals[i],
  }));

  const lastPoint = data.length > 0 ? data[data.length - 1] : null;

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
    return (
      <div
        className="rounded-xl px-3.5 py-2.5 shadow-xl backdrop-blur-sm"
        style={{ background: 'rgba(15, 23, 42, 0.92)', border: '1px solid rgba(236, 72, 153, 0.25)' }}
      >
        <div className="text-[11px] font-medium mb-1" style={{ color: '#94a3b8' }}>{label}</div>
        <div className="text-sm font-bold" style={{ color: '#f1f5f9' }}>{formatMoney(val)}</div>
        {diff != null && typeof t.netWorthTooltipVsPrev === 'function' && (
          <div className="text-[11px] font-medium mt-0.5" style={{ color: diff >= 0 ? '#4ade80' : '#f87171' }}>
            {t.netWorthTooltipVsPrev(formatChange(diff))}
          </div>
        )}
      </div>
    );
  }, [data, t]);

  const rangeLabel = (k) => {
    if (k === '3') return t.netWorthRange3 ?? '3';
    if (k === '6') return t.netWorthRange6 ?? '6';
    if (k === '12') return t.netWorthRange12 ?? '12';
    return t.netWorthRangeAll ?? 'All';
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-surface-alt/80 rounded-2xl px-3 sm:px-5 pt-5 pb-3 border border-white/[0.06] shadow-lg shadow-black/10 max-w-full overflow-x-hidden">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 mb-3 shrink-0">
        <h3 className="text-lg font-semibold transition-all duration-300">{title}</h3>
        <div
          className="flex flex-wrap gap-1 p-0.5 rounded-xl bg-surface/80 border border-white/[0.06] self-start"
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
      <div className="min-h-[280px] flex-1 min-h-0 touch-none" style={{ touchAction: 'none' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart key={animKey} data={data} margin={chartMargin}>
            <defs>
              <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={0.35} />
                <stop offset="40%" stopColor="#ec4899" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
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
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
              width={narrow ? 34 : 40}
              tick={(props) => {
                const { y, payload } = props;
                const text = `${(payload.value / 1000).toFixed(0)}k`;
                return (
                  <text x={0} y={y} dy={4} textAnchor="start" fill="#f1f5f9" fontSize={12}>
                    {text}
                  </text>
                );
              }}
            />
            <Tooltip content={renderTooltip} cursor={<CustomCursor />} />
            <Area
              type="monotone" dataKey="total" stroke="#ec4899" strokeWidth={2.5}
              fill="url(#netWorthGrad)" dot={false}
              activeDot={{ r: 5, fill: '#ec4899', stroke: '#ec489940', strokeWidth: 6 }}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
            {lastPoint && (
              <ReferenceDot
                x={lastPoint.date} y={lastPoint.total}
                r={4} fill="#ec4899" stroke="#0f172a" strokeWidth={2}
                isFront
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
