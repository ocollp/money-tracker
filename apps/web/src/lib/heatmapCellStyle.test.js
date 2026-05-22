import { describe, it, expect } from 'vitest';
import { computeHeatmapScaleMax, heatmapCellBackground } from './heatmapCellStyle.js';

describe('heatmapCellStyle', () => {
  it('uses p90 for scale max', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100].map((value) => ({ value }));
    expect(computeHeatmapScaleMax(rows)).toBe(100);
  });

  it('matches heatmap alpha without glow for normal months', () => {
    const style = heatmapCellBackground(4_500, 10_000);
    expect(style.backgroundColor).toMatch(/^rgba\(34, 197, 94, 0\.49/);
    expect(style.boxShadow).toBe('none');
  });

  it('adds glow only when requested for strong months', () => {
    const style = heatmapCellBackground(8_000, 10_000, { withGlow: true });
    expect(style.boxShadow).not.toBe('none');
  });
});
