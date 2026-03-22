import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { formatMoney } from '../utils/formatters';

export default function MonthlyChangeChart({ changes }) {
  const data = changes.map(c => ({
    date: c.month.shortLabel,
    value: c.value,
    pct: c.pct,
  }));

  return (
    <div className="bg-surface-alt/80 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/10">
      <h3 className="text-lg font-semibold mb-4">Cambio mensual</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis
              dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={false} tickLine={false} interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={45}
            />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(v, name, props) => [
                `${formatMoney(v)} (${v > 0 ? '+' : ''}${props.payload.pct.toFixed(1)}%)`,
                'Cambio'
              ]}
            />
            <ReferenceLine y={0} stroke="#334155" />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.value >= 0 ? '#22c55e' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
