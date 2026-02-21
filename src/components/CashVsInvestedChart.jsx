import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatMoney } from '../utils/formatters';

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
      <text x={0} y={0} dy={8} textAnchor={textAnchor} fill="#94a3b8" fontSize={fontSize}>
        {payload.value}
      </text>
    </g>
  );
}

export default function CashVsInvestedChart({ data }) {
  const [narrow, setNarrow] = useState(typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const onChange = (e) => setNarrow(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const chartMargin = {
    top: 5,
    right: narrow ? 16 : 12,
    bottom: 26,
    left: 8,
  };
  const xTicks = getXAxisTicks(data, narrow);
  const tickFontSize = narrow ? 10 : 11;

  return (
    <div className="bg-surface-alt rounded-2xl p-5 border border-border">
      <h3 className="text-lg font-semibold mb-4">Cash vs Invertit</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={chartMargin}>
            <defs>
              <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#eab308" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              ticks={xTicks}
              padding={{ left: 8, right: 8 }}
              tick={(props) => renderXAxisTick(props, data?.[0]?.date, data?.[data.length - 1]?.date, tickFontSize)}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={40}
            />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }}
              labelStyle={{ color: '#94a3b8' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-xl px-3 py-2" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                    <div className="text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>{label}</div>
                    {payload.map((p) => (
                      <div key={p.dataKey} className="text-sm" style={{ color: p.color }}>
                        {p.name}: {formatMoney(p.value)}
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
            <Area type="monotone" dataKey="Cash" name="Cash" stroke="#eab308" fill="url(#cashGrad)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="Invested" name="Invertit" stroke="#6366f1" fill="url(#invGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
