export function formatMoney(value) {
  const num = Number(value);
  if (value == null || isNaN(num)) return '—';
  const formatted = new Intl.NumberFormat('es-ES', {
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

export const COLORS = [
  '#6366f1', '#22c55e', '#eab308', '#ef4444', '#06b6d4',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#64748b',
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
