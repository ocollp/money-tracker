export function eur(value) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function pct(value, decimals = 1) {
  if (value == null || isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function signedEur(value) {
  if (value == null || isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${eur(value).replace(/^-/, '')}${value < 0 ? '' : ''}`.replace('€', ' €');
}

export function formatSignedEur(value) {
  if (value == null || isNaN(value)) return '—';
  const formatted = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${formatted} €`;
}
