export function computeHeatmapScaleMax(rows) {
  const data = Array.isArray(rows) ? rows : [];
  const absValues = data.map((d) => Math.abs(d.value)).sort((a, b) => a - b);
  const p90 = absValues.length > 0 ? absValues[Math.floor(absValues.length * 0.9)] : 1;
  return Math.max(p90, 1);
}

export function heatmapCellBackground(value, scaleMax, { withGlow = false } = {}) {
  if (value == null) return { backgroundColor: 'rgba(148, 163, 184, 0.05)' };
  const intensity = Math.min(Math.abs(value) / scaleMax, 1);
  const alpha = 0.2 + intensity * 0.65;
  if (value > 0) {
    return {
      backgroundColor: `rgba(34, 197, 94, ${alpha})`,
      boxShadow:
        withGlow && intensity > 0.5
          ? `0 0 8px rgba(34, 197, 94, ${intensity * 0.3})`
          : 'none',
    };
  }
  if (value < 0) {
    return {
      backgroundColor: `rgba(239, 68, 68, ${alpha})`,
      boxShadow:
        withGlow && intensity > 0.5
          ? `0 0 8px rgba(239, 68, 68, ${intensity * 0.3})`
          : 'none',
    };
  }
  return { backgroundColor: 'rgba(148, 163, 184, 0.08)' };
}
