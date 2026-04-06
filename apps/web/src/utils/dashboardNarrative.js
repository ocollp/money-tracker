import { formatMoney } from './formatters';

const STABLE_ABS = 250;

/**
 * One-line summary for the dashboard header (i18n via t.*).
 */
export function buildDashboardNarrative(stats, t) {
  if (!stats) return '';
  const parts = [];

  const ch = stats.changeVsPrev;
  if (ch != null) {
    const abs = Math.abs(ch);
    if (abs < STABLE_ABS) parts.push(t.narrativeLiquidStable);
    else if (ch > 0) parts.push(t.narrativeLiquidUp(formatMoney(ch)));
    else parts.push(t.narrativeLiquidDown(formatMoney(abs)));
  }

  if (stats.hasTravel && stats.travel) {
    if (stats.travel.pace === 'over') parts.push(t.narrativeTravelOver);
    else if (stats.travel.pace === 'watch') parts.push(t.narrativeTravelWatch);
  }

  return parts.filter(Boolean).join(' ');
}
