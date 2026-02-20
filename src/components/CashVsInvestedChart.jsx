import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatMoney } from '../utils/formatters';

export default function CashVsInvestedChart({ data }) {
  return (
    <div className="bg-surface-alt rounded-2xl p-5 border border-border">
      <h3 className="text-lg font-semibold mb-4">Cash vs Invertit</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
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
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
            <Area type="monotone" dataKey="Cash" name="Efectiu" stroke="#f97316" fill="url(#cashGrad)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="Invested" name="Invertit" stroke="#a78bfa" fill="url(#invGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
