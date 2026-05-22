import { describe, it, expect } from 'vitest';
import { formatMoney, formatPct, formatChange, formatUpdatedClock, splitYearsAndMonths } from './formatters.js';

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

describe('splitYearsAndMonths', () => {
  it('splits total months into years and remainder', () => {
    expect(splitYearsAndMonths(340)).toEqual({ years: 28, months: 4, total: 340 });
    expect(splitYearsAndMonths(14)).toEqual({ years: 1, months: 2, total: 14 });
    expect(splitYearsAndMonths(5)).toEqual({ years: 0, months: 5, total: 5 });
    expect(splitYearsAndMonths(12)).toEqual({ years: 1, months: 0, total: 12 });
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
