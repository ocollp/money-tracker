import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatMoney } from '../utils/formatters';

export default function MortgageCard({ housing }) {
  const debtPaidPct = housing.initialDebt > 0
    ? ((housing.totalPaid / housing.initialDebt) * 100).toFixed(1)
    : 0;

  return (
    <div className="bg-surface-alt rounded-2xl p-5 border border-border space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Casa meva</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MiniStat label="Valor habitatge" value={formatMoney(housing.fullValue)} hint={`La meva part: ${formatMoney(housing.value)}`} />
        <MiniStat label="Deute total" value={formatMoney(-housing.fullDebt)} negative hint={`El meu deute: ${formatMoney(-housing.debt)}`} />
        <MiniStat label="El meu equity" value={formatMoney(housing.equity)} highlight />
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-text-secondary">Hipoteca pagada</span>
          <span className="font-medium text-brand">{debtPaidPct}%</span>
        </div>
        <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
            style={{ width: `${debtPaidPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-text-secondary mt-1.5">
          <span>Quota: {formatMoney(housing.monthlyPayment)}/mes</span>
          {housing.monthsRemaining && (
            <span>Falten {housing.monthsRemaining} mesos (~{(housing.monthsRemaining / 12).toFixed(0)} anys)</span>
          )}
        </div>
      </div>

      {housing.evolution.length > 1 && (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={housing.evolution} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={40}
              />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(v, name) => [formatMoney(v), name === 'debt' ? 'Deute' : 'Equity']}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
              <Area type="monotone" dataKey="debt" name="Deute" stroke="#ef4444" fill="url(#debtGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="equity" name="Equity" stroke="#22c55e" fill="url(#equityGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, negative, highlight, hint }) {
  return (
    <div className="bg-surface rounded-xl p-3">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-positive' : negative ? 'text-negative' : ''}`}>
        {value}
      </p>
      {hint && <p className="text-[10px] text-text-secondary/50 mt-0.5">{hint}</p>}
    </div>
  );
}
