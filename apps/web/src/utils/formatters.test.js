import { describe, it, expect } from 'vitest';
import { formatMoney, formatPct, formatChange, formatUpdatedClock } from './formatters.js';

describe('formatMoney', () => {
  it('formats integers with euro suffix', () => {
    expect(formatMoney(1500)).toMatch(/1[\s.]500/);
    expect(formatMoney(1500)).toContain('€');
  });

  it('returns em dash for null or NaN', () => {
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
    expect(formatMoney(NaN)).toBe('—');
  });
});

describe('formatPct', () => {
  it('adds sign and one decimal', () => {
    expect(formatPct(5.2)).toBe('+5.2%');
    expect(formatPct(-3)).toBe('-3.0%');
  });

  it('returns em dash for invalid', () => {
    expect(formatPct(null)).toBe('—');
    expect(formatPct(NaN)).toBe('—');
  });
});

describe('formatChange', () => {
  it('prefixes positive with plus', () => {
    expect(formatChange(100)).toMatch(/^\+/);
  });

  it('returns em dash for invalid', () => {
    expect(formatChange(null)).toBe('—');
  });
});

describe('formatUpdatedClock', () => {
  it('returns empty string for invalid input', () => {
    expect(formatUpdatedClock(null)).toBe('');
    expect(formatUpdatedClock(undefined)).toBe('');
  });

  it('returns time string for a Date', () => {
    const s = formatUpdatedClock(new Date('2024-06-15T14:05:00'));
    expect(s).toMatch(/14/);
    expect(s).toMatch(/05/);
  });
});
