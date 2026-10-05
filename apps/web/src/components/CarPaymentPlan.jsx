import { usePrivacy } from '../context/PrivacyContext.jsx';
import { formatMoney } from '../utils/formatters.js';
import { carPaymentPlan } from '../lib/carPaymentPlan.js';

const dates = ['2026-11', '2027-05'];
const dateLabels = ['Novembre de 2026', 'Maig de 2027'];

export default function CarPaymentPlan({ people, emojis }) {
  const { hideMoney } = usePrivacy();
  const money = value => value == null ? '—' : hideMoney ? '••••' : formatMoney(value);
  const plans = people.map(person => carPaymentPlan(person.balance, person.share, ...dates));
  const valid = plans.every(Boolean);
  return <section className="border-t border-white/[0.08] pt-4 space-y-4" aria-label="Pla de pagaments del cotxe">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h5 className="text-sm font-medium text-text-primary">El cotxe en dos pagaments</h5>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {['Primer pagament', 'Liquidació'].map((title, index) => <div key={title} className="min-w-0 rounded-xl border border-white/[0.08] bg-black/10 p-3.5 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-400/10 text-xs text-sky-200">{index + 1}</span>
          <div className="flex-1 min-w-0"><h6 className="text-xs text-text-secondary">{title} · <time className="inline-block" dateTime={dates[index]}>{dateLabels[index]}</time></h6><p className="text-sm font-semibold tabular-nums">{formatMoney(index === 0 ? 12000 : 14000)}</p></div>
        </div>
        {valid && people.map((person, i) => {
          const payment = plans[i][index];
          const percent = payment.reserved == null ? 0 : payment.reserved / payment.amount * 100;
          return <div key={person.owner} className="border-t border-white/[0.06] pt-3 space-y-2 text-xs">
            <p className="flex justify-between gap-2"><span>{emojis[person.owner]} {person.owner} <span className="text-text-secondary">· {Math.round(person.share * 100)}%</span></span><span className="tabular-nums">{money(payment.amount)}</span></p>
            {!hideMoney && payment.reserved != null && <div role="progressbar" aria-label={`${title}: ${person.owner}`} aria-valuemin={0} aria-valuemax={payment.amount} aria-valuenow={payment.reserved} className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden"><div className="h-full rounded-full bg-sky-400/70" style={{ width: `${percent}%` }} /></div>}
            <p className="flex justify-between gap-2 text-text-secondary"><span>Reservat dels estalvis</span><span className="tabular-nums">{money(payment.reserved)}</span></p>
            {payment.missing !== 0 && <>
            <p className="flex justify-between gap-2 text-text-secondary"><span>Falten</span><span className="tabular-nums text-text-primary">{money(payment.missing)}</span></p>
            <p className="flex justify-between gap-2 text-text-secondary"><span>{index === 0 ? 'Fins al primer pagament' : 'Després del primer pagament'}</span><span className="text-right tabular-nums">{payment.monthly == null ? (payment.missing == null ? '—' : 'Pendent ara') : money(payment.monthly) + ' / mes'}</span></p>
            </>}
          </div>;
        })}
      </div>)}
    </div>
    {!valid && <p role="alert" className="text-xs text-red-300">La liquidació ha de ser posterior al primer pagament. Selecciona dos mesos vàlids.</p>}
  </section>;
}
