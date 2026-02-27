import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMoney } from '../utils/formatters';

// Always show first and last date at the margins; 1 or 2 in the middle with correct spacing
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

export default function NetWorthChart({ months, totals, title = 'Patrimoni', subtitle = 'Diners i inversions', tooltipLabel = 'Patrimoni' }) {
  const [narrow, setNarrow] = useState(typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const onChange = (e) => setNarrow(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const data = months.map((m, i) => ({
    date: m.shortLabel,
    total: totals[i],
  }));
  const xTicks = getXAxisTicks(data, narrow);
  const chartMargin = {
    top: 5,
    right: narrow ? 16 : 12,
    bottom: 12,
    left: 0,
  };
  const tickFontSize = narrow ? 10 : 11;

  const renderTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        className="rounded-xl px-3 py-2 shadow-lg"
        style={{ background: '#1e293b', border: '1px solid #334155' }}
      >
        <div className="text-xs font-medium" style={{ color: '#f1f5f9' }}>{label}</div>
        <div className="font-normal" style={{ color: '#f1f5f9' }}>{formatMoney(payload[0].value)}</div>
      </div>
    );
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-surface-alt/80 rounded-2xl px-5 pt-5 pb-3 border border-white/[0.06] shadow-lg shadow-black/10">
      <h3 className="text-lg font-semibold mb-3 shrink-0">{title}</h3>
      {subtitle && <p className="text-xs text-text-secondary mb-4 shrink-0">{subtitle}</p>}
      <div className="min-h-[280px] flex-1 min-h-0 touch-none" style={{ touchAction: 'none' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={chartMargin}>
            <defs>
              <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={0.3} />
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
              width={40}
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
            <Tooltip content={renderTooltip} />
            <Area
              type="monotone" dataKey="total" stroke="#ec4899" strokeWidth={2.5}
              fill="url(#netWorthGrad)" dot={false} activeDot={{ r: 5, fill: '#ec4899' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
