import { describe, it, expect } from 'vitest';
import { buildMilestoneProgress } from './milestones.js';

describe('buildMilestoneProgress', () => {
  it('computes pct and remaining', () => {
    const p = buildMilestoneProgress(75_000, 100_000);
    expect(p.pct).toBe(75);
    expect(p.remaining).toBe(25_000);
    expect(p.achieved).toBe(false);
  });

  it('caps pct at 100 when over target', () => {
    const p = buildMilestoneProgress(120_000, 100_000);
    expect(p.pct).toBe(100);
    expect(p.achieved).toBe(true);
    expect(p.remaining).toBe(0);
  });
});
