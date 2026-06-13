import { computeStatistics } from '../utils/statistics.js';

export function computeStatisticsAsOf(months, monthKey, options = {}) {
  if (!months?.length || !monthKey) return null;
  const idx = months.findIndex((m) => m.key === monthKey);
  if (idx < 0) return null;
  return computeStatistics(months.slice(0, idx + 1), options);
}
