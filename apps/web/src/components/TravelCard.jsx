import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMoney } from '../utils/formatters';
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
      <text x={0} y={0} dy={8} textAnchor={textAnchor} fill="#94a3b8" fontSize={fontSize}>
        {payload.value}
      </text>
    </g>
  );
}

export default function TravelCard({ travel }) {
  const { t } = useI18n();
  const [narrow, setNarrow] = useState(typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const onChange = (e) => setNarrow(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const chartData = travel.evolution
    .filter(d => d.fund !== 0)
    .map(d => ({ ...d, fund: d.fund * 2 }));
  const hasChart = chartData.length > 1;

  return (
    <div className="h-full min-h-0 flex flex-col bg-surface-alt/80 rounded-2xl px-5 pt-5 pb-3 border border-white/[0.06] shadow-lg shadow-black/10 space-y-5">
      <div>
        <h3 className="text-lg font-semibold">{t.travelTitle}</h3>
        <span className="text-sm font-bold text-positive">{formatMoney(travel.current * 2)}</span>
      </div>

      {hasChart && (
        <div className="h-52 touch-none" style={{ touchAction: 'none' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 5,
                right: narrow ? 16 : 12,
                bottom: 12,
                left: 0,
              }}
            >
              <defs>
                <linearGradient id="travelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                ticks={getXAxisTicks(chartData, narrow)}
                padding={{ left: 8, right: 8 }}
                tick={(props) => renderXAxisTick(
                  props,
                  chartData[0]?.date,
                  chartData[chartData.length - 1]?.date,
                  narrow ? 10 : 11
                )}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(1)}k`}
                width={40}
                tick={(props) => {
                  const { y, payload } = props;
                  const text = `${(payload.value / 1000).toFixed(1)}k`;
                  return (
                    <text x={0} y={y} dy={4} textAnchor="start" fill="#94a3b8" fontSize={11}>
                      {text}
                    </text>
                  );
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-xl px-3 py-2" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                      <div className="text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>{label}</div>
                      <div className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
                        {formatMoney(payload[0].value)}
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="fund"
                stroke="#f59e0b"
                fill="url(#travelGrad)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#f59e0b' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
