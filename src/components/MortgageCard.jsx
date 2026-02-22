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

export default function MortgageCard({ housing }) {
  const [narrow, setNarrow] = useState(typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const onChange = (e) => setNarrow(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const debtPaidPct = housing.initialDebt > 0
    ? ((housing.totalPaid / housing.initialDebt) * 100).toFixed(1)
    : 0;

  return (
    <div className="h-full min-h-0 flex flex-col bg-surface-alt rounded-2xl px-5 pt-5 pb-3 border border-border space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Habitatge</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MiniStat label="Valor habitatge" value={formatMoney(housing.fullValue)} hint={formatMoney(housing.value)} />
        <MiniStat label="Deute total amb el banc" value={formatMoney(housing.fullDebt)} hint={formatMoney(housing.debt)} negative />
        <MiniStat label="Patrimoni net" value={formatMoney(housing.totalEquity ?? housing.equity)} highlight hint={formatMoney(housing.equity)} />
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-text-secondary">Progrés de la hipoteca</span>
          <span className="font-medium text-positive">{debtPaidPct}%</span>
        </div>
        <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
            style={{ width: `${debtPaidPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-text-secondary mt-1.5">
          <span>Quota: {formatMoney(housing.monthlyPayment)}/mes</span>
          {housing.monthsRemaining != null && housing.monthsRemaining > 0 && (
            <span>Queden {housing.monthsRemaining} mesos (~{(housing.monthsRemaining / 12).toFixed(0)} anys)</span>
          )}
        </div>
      </div>

      {housing.evolution.length > 1 && (
        <div className="h-52 touch-none" style={{ touchAction: 'none' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={housing.evolution}
              margin={{
                top: 5,
                right: narrow ? 16 : 12,
                bottom: 12,
                left: 0,
              }}
            >
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
                dataKey="date"
                axisLine={false}
                tickLine={false}
                ticks={getXAxisTicks(housing.evolution, narrow)}
                padding={{ left: 8, right: 8 }}
                tick={(props) => renderXAxisTick(
                  props,
                  housing.evolution[0]?.date,
                  housing.evolution[housing.evolution.length - 1]?.date,
                  narrow ? 10 : 11
                )}
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
                    <text x={0} y={y} dy={4} textAnchor="start" fill="#94a3b8" fontSize={11}>
                      {text}
                    </text>
                  );
                }}
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
              <Area type="monotone" dataKey="debt" name="Deute" stroke="#ef4444" fill="url(#debtGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="equity" name="Patrimoni net" stroke="#22c55e" fill="url(#equityGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, negative, highlight, hint, tooltip }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="bg-surface rounded-xl p-3 relative">
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-xs text-text-secondary">{label}</p>
        {tooltip && (
          <button
            type="button"
            className="text-text-secondary/50 hover:text-brand transition-colors"
            onMouseEnter={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
            onClick={() => setShowTip(p => !p)}
            aria-label="Info"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      {showTip && tooltip && (
        <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-surface-alt border border-border rounded-xl p-2.5 text-[11px] text-text-secondary leading-relaxed shadow-xl">
          {tooltip}
        </div>
      )}
      <p className={`text-sm font-bold ${highlight ? 'text-positive' : negative ? 'text-negative' : ''}`}>
        {value}
      </p>
      {hint && <p className="text-[10px] text-text-secondary/50 mt-0.5">{hint}</p>}
    </div>
  );
}
