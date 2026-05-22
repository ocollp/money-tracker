export function formatMoney(value) {
  const num = Number(value);
  if (value == null || isNaN(num)) return '—';
  const formatted = new Intl.NumberFormat('ca-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(num);
  return `${formatted} €`;
}

export function formatPct(value) {
  if (value == null || isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatChange(value) {
  if (value == null || isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatMoney(value)}`;
}

export function splitYearsAndMonths(totalMonths) {
  const total = Math.max(0, Math.round(Number(totalMonths)) || 0);
  return { years: Math.floor(total / 12), months: total % 12, total };
}

export function formatUpdatedClock(date) {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  try {
    return date.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export const COLORS = [
  '#38bdf8', '#22c55e', '#6366f1', '#f87171', '#06b6d4',
  '#7dd3fc', '#8b5cf6', '#14b8a6', '#f97316', '#64748b',
  '#a855f7', '#84cc16',
];

export const ENTITY_COLORS = {};
let colorIdx = 0;
export function getEntityColor(entity) {
  if (!ENTITY_COLORS[entity]) {
    ENTITY_COLORS[entity] = COLORS[colorIdx % COLORS.length];
    colorIdx++;
  }
  return ENTITY_COLORS[entity];
}
