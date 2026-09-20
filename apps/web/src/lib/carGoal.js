import { classifyLiquidEntry } from '../utils/assetClassBuckets.js';

export function remuneratedBalance(month) {
  if (!month) return null;
  return month.entries.filter(row => !row.isHousing && !row.isTravel && classifyLiquidEntry(row) === 'cash')
    .reduce((sum, row) => sum + row.amount, 0);
}

export function carGoal(price, olga, andrea) {
  const shares = [0.65, 0.35];
  const people = [olga, andrea].map((balance, i) => {
    const payment = Math.round(price * shares[i] * 100) / 100;
    return { owner: i === 0 ? 'Olga' : 'Andrea', share: shares[i], payment, balance, missing: balance == null ? null : Math.max(0, payment - balance),
      remaining: balance == null ? null : Math.max(0, balance - payment) };
  });
  return { people, missing: people.some(p => p.missing == null) ? null : people.reduce((sum, p) => sum + p.missing, 0) };
}

export function savingsPaceBalance(month) {
  if (!month) return null;
  const bbva = month.entries.filter(row =>
    !row.isHousing && !row.isTravel &&
    String(row.entity).trim().toLowerCase() === 'bbva' &&
    String(row.type).trim().toLowerCase() === 'cash'
  ).reduce((sum, row) => sum + row.amount, 0);
  return remuneratedBalance(month) + bbva;
}
