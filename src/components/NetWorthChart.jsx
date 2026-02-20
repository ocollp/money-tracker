import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMoney } from '../utils/formatters';

// Show few dates (5–6) so they stay readable; same on mobile and desktop
function getXAxisInterval(dataLength) {
  if (dataLength <= 5) return 0;
  const targetLabels = 5;
  return Math.max(0, Math.floor(dataLength / targetLabels) - 1);
}

// Recharts draws the first tick at the left edge of the band; the line starts at the band center.
// We don't shift the tick so the "J" of "Jun" stays at the left edge = where the line visually starts (band start after padding).
// That way hover over the label matches the first data point (Jun).
function renderXAxisTick(props, firstDate, lastDate, fontSize) {
  const { x, y, payload } = props;
  const isFirst = payload.value === firstDate;
  const isLast = payload.value === lastDate;
  const textAnchor = isFirst ? 'start' : isLast ? 'end' : 'middle';
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={8} textAnchor={textAnchor} fill="#94a3b8" fontSize={fontSize}>
        {payload.value}
      </text>
    </g>
  );
}

export default function NetWorthChart({ months, totals }) {
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
  const xInterval = getXAxisInterval(data.length);
  const chartMargin = {
    top: 5,
    right: narrow ? 16 : 12,
    bottom: 24,
    left: 8,
  };
  const tickFontSize = narrow ? 10 : 11;

  return (
    <div className="bg-surface-alt rounded-2xl p-5 border border-border">
      <h3 className="text-lg font-semibold mb-1">Patrimoni</h3>
      <p className="text-xs text-text-secondary mb-4">Patrimoni sense habitatge</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={chartMargin}>
            <defs>
              <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              interval={xInterval}
              padding={{ left: 8, right: 8 }}
              tick={(props) => renderXAxisTick(props, data[0]?.date, data[data.length - 1]?.date, tickFontSize)}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={40}
            />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(v) => [formatMoney(v), 'Patrimoni']}
            />
            <Area
              type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5}
              fill="url(#netWorthGrad)" dot={false} activeDot={{ r: 5, fill: '#6366f1' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
