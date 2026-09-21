import KpiCard from './KpiCard.jsx';
import { formatMoney, formatChange, formatPct } from '../utils/formatters.js';

function compactMonth(key) {
  const [year, month] = key.split('-');
  const names = ['Gen.', 'Feb.', 'Març', 'Abr.', 'Maig', 'Juny', 'Jul.', 'Ag.', 'Set.', 'Oct.', 'Nov.', 'Des.'];
  return `${names[Number(month) - 1].replace('.', '')} ${year.slice(-2)}`;
}

export default function YearAgoCard({ stats }) {
  const current = stats.months.at(-1);
  if (!current) return null;
  const [year, month] = current.key.split('-');
  const previous = stats.months.find(m => m.key === `${Number(year) - 1}-${month}`);
  const twoYearsAgo = stats.months.find(m => m.key === `${Number(year) - 2}-${month}`);
  const comparisonMonths = [twoYearsAgo, previous, current].filter(Boolean);
  const difference = previous ? current.liquidTotal - previous.liquidTotal : null;
  const percent = previous?.liquidTotal > 0 ? difference / previous.liquidTotal * 100 : null;
  return (
    <KpiCard
      title="Diners i inversions · Comparativa anual"
      icon="📅"
      value={previous ? formatChange(difference) : '—'}
      privacyPct={percent}
      trend={difference ?? 0}
      subtitle={previous ? (percent != null ? `${formatPct(percent)} respecte a l’any passat` : null) : 'Sense dades del mateix mes de l’any anterior'}
      detail={comparisonMonths.length > 1 ? comparisonMonths.map(m => `${compactMonth(m.key)}: ${formatMoney(m.liquidTotal)}`).join(' · ') : null}
    />
  );
}
