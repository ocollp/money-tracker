import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatMoney, getEntityColor } from '../utils/formatters';

export default function EntityEvolutionChart({ data, entities }) {
  return (
    <div className="bg-surface-alt rounded-2xl p-5 border border-border">
      <h3 className="text-lg font-semibold mb-4">Evolució per entitat</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
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
              formatter={(v) => formatMoney(v)}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
              iconType="circle" iconSize={8}
            />
            {entities.map(entity => (
              <Line
                key={entity} type="monotone" dataKey={entity}
                stroke={getEntityColor(entity)} strokeWidth={2}
                dot={false} activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
