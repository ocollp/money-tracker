import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatMoney } from '../utils/formatters';

function getXAxisInterval(dataLength) {
  if (dataLength <= 5) return 0;
  const targetLabels = 5;
  return Math.max(0, Math.floor(dataLength / targetLabels) - 1);
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
    bottom: 24,
    left: 8,
  };
  const xInterval = data?.length ? getXAxisInterval(data.length) : 0;
  const tickFontSize = narrow ? 10 : 11;

  return (
    <div className="bg-surface-alt rounded-2xl p-5 border border-border">
      <h3 className="text-lg font-semibold mb-4">Cash vs Invertit</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={chartMargin}>
            <defs>
              <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              interval={xInterval}
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
              formatter={(v) => formatMoney(v)}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
            <Area type="monotone" dataKey="Cash" name="Efectiu" stroke="#f97316" fill="url(#cashGrad)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="Invested" name="Invertit" stroke="#a78bfa" fill="url(#invGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
