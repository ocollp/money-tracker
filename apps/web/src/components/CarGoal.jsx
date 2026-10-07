import { useEffect, useState } from 'react';
import CarPaymentPlan from './CarPaymentPlan.jsx';
import { usePrivacy } from '../context/PrivacyContext.jsx';
import { fetchSheetData, fetchSheetDataViaBackend } from '../services/sheetsApi.js';
import { sheetValuesToMonths } from '../lib/sheetMonths.js';
import { carGoal, carSavingsBalance, savingsPaceBalance } from '../lib/carGoal.js';
import { formatMoney } from '../utils/formatters.js';
import { API_URL, HAS_BACKEND, PROFILE_PRIMARY_ID, PROFILE_SECONDARY_ID, PROFILE_EMOJIS } from '../config.js';

function recentPace(history) {
  const samples = (history || []).slice(-4);
  if (samples.length < 2) return null;
  const first = samples[0];
  const last = samples.at(-1);
  const index = m => { const [y, n] = m.key.split('-').map(Number); return y * 12 + n; };
  const elapsed = index(last) - index(first);
  return elapsed > 0 ? (savingsPaceBalance(last) - savingsPaceBalance(first)) / elapsed : null;
}

export default function CarGoal({ profiles, profile, months, appJwt, accessToken }) {
  const { hideMoney } = usePrivacy();
  const [other, setOther] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const otherId = profile === PROFILE_PRIMARY_ID ? PROFILE_SECONDARY_ID : PROFILE_PRIMARY_ID;
  const sheetId = profiles.find(p => p.id === otherId)?.sheetId;
  useEffect(() => {
    let cancelled = false;
    setOther(null);
    if (!sheetId) return;
    const request = HAS_BACKEND && appJwt
      ? fetchSheetDataViaBackend(appJwt, sheetId, API_URL)
      : fetchSheetData(accessToken, sheetId);
    request.then(values => {
      const history = sheetValuesToMonths(values);
      const latest = history.at(-1);
      if (!cancelled) setOther({ sheetId, balance: carSavingsBalance(latest, otherId === PROFILE_PRIMARY_ID ? 0.65 : 0.35), history });
    }).catch(() => { if (!cancelled) setOther({ sheetId, error: true }); });
    return () => { cancelled = true; };
  }, [sheetId, otherId, appJwt, accessToken, attempt, months]);
  const latest = months?.at(-1);
  const own = carSavingsBalance(latest, profile === PROFILE_PRIMARY_ID ? 0.65 : 0.35);
  const peer = sheetId && other && other.sheetId === sheetId && !other.error
    ? other.balance ?? null
    : null;
  const price = 26000;
  const result = profile === PROFILE_PRIMARY_ID ? carGoal(price, own, peer) : carGoal(price, peer, own);
  const orderedPeople = profile === PROFILE_PRIMARY_ID ? result.people : [...result.people].reverse();
  const ownOwner = profile === PROFILE_PRIMARY_ID ? 'Olga' : 'Andrea';
  const emojisByOwner = {
    Olga: profiles.find(person => person.id === PROFILE_PRIMARY_ID)?.emoji || PROFILE_EMOJIS[PROFILE_PRIMARY_ID],
    Andrea: profiles.find(person => person.id === PROFILE_SECONDARY_ID)?.emoji || PROFILE_EMOJIS[PROFILE_SECONDARY_ID],
  };
  const money = value => hideMoney ? '••••' : formatMoney(value);
  return (
    <div className="rounded-xl border border-violet-500/15 bg-white/[0.02] p-3 sm:p-4 space-y-4">
      <h4 className="flex items-center gap-2.5 text-xs font-medium leading-snug text-text-secondary"><span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06] text-lg">🚗</span> Toyota Yaris GR Sport</h4>
      <p className="flex items-center justify-between gap-2 text-xs text-text-secondary">Preu total del cotxe <span className="text-sm text-text-primary tabular-nums">{formatMoney(price)}</span></p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {orderedPeople.map((person) => {
          const pace = recentPace(person.owner === ownOwner ? months : other && other.sheetId === sheetId ? other.history : null);
          return (
          <div key={person.owner} className="rounded-xl border border-white/[0.06] bg-black/10 p-3.5 sm:p-4 space-y-3.5 text-xs">
            <p className="flex items-center justify-between font-semibold text-sm"><span className="flex items-center gap-1.5"><span aria-hidden>{emojisByOwner[person.owner]}</span>{person.owner}</span><span className="rounded-full bg-violet-400/10 px-2 py-0.5 text-[11px] font-medium text-violet-200">{person.share * 100}%</span></p>
            <p className="flex justify-between gap-2 text-text-secondary">{person.owner === ownOwner ? 'Necessito' : 'Necessita'} <span className="text-text-primary tabular-nums">{formatMoney(person.payment)}</span></p>
            <p className="flex justify-between gap-2 text-text-secondary">Estalvis <span className="text-emerald-300 tabular-nums">{person.balance == null ? '—' : money(person.balance)}</span></p>
            {person.balance != null ? <>
              {!hideMoney && <div role="progressbar" aria-label={`Progrés ${person.owner}`} aria-valuemin={0} aria-valuemax={person.payment} aria-valuenow={Math.min(person.payment, Math.max(0, person.balance))} className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${Math.min(100, Math.max(0, person.balance / person.payment * 100))}%` }} />
              </div>}
              {!hideMoney && <p className="text-right text-[11px] tabular-nums text-text-secondary/75">{Math.min(100, Math.max(0, person.balance / person.payment * 100)).toFixed(0)}% cobert</p>}
              {person.missing > 0 && (
                <p className="flex flex-wrap items-baseline justify-between gap-1 text-white">
                  <span>Falten</span>
                  <strong className="text-sm font-semibold tabular-nums text-red-300">{money(person.missing)}</strong>
                </p>
              )}
              {person.missing > 0 && (pace == null || pace > 0) && <div className="border-t border-white/[0.06] pt-3 space-y-1">
                {(pace == null || pace >= 0) && <p className="flex justify-between items-baseline gap-2 text-text-secondary"><span>Mitjana mensual</span><span className="tabular-nums text-right">{pace == null ? 'sense prou dades' : `${money(pace)} / mes`}</span></p>}
              </div>}
            </> : <p className="text-text-secondary">{!sheetId || other?.error ? 'Saldo no disponible' : 'Carregant saldo…'}</p>}
          </div>
        ); })}
      </div>
      {other?.error && <button type="button" onClick={() => setAttempt(n => n + 1)} className="text-xs underline text-text-secondary">Tornar a carregar el saldo</button>}
      <CarPaymentPlan people={orderedPeople} emojis={emojisByOwner} />
    </div>
  );
}
