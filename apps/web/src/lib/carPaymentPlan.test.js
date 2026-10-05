import { describe, expect, it } from 'vitest';
import { carPaymentPlan } from './carPaymentPlan.js';

const now = new Date(2026, 9, 5);
const plan = (balance, share = 0.65) => carPaymentPlan(balance, share, '2026-11', '2027-06', now);

describe('car payment plan', () => {
  it('splits both payments and counts distinct saving periods', () => {
    expect(plan(0).map(p => p.amount)).toEqual([7800, 9100]);
    expect(plan(0, 0.35).map(p => p.amount)).toEqual([4200, 4900]);
    expect(plan(0).map(p => p.months)).toEqual([1, 7]);
    expect(plan(0).map(p => p.monthly)).toEqual([7800, 1300]);
  });
  it('reserves savings only once, funding the first payment first', () => {
    expect(plan(10000).map(p => p.reserved)).toEqual([7800, 2200]);
    expect(plan(10000).map(p => p.missing)).toEqual([0, 6900]);
    expect(plan(10000)[1].monthly).toBe(986);
    expect(plan(5000).map(p => p.reserved)).toEqual([5000, 0]);
    expect(plan(20000).map(p => p.missing)).toEqual([0, 0]);
  });
  it('keeps unknown balances unknown', () => {
    expect(plan(null).every(p => p.reserved === null && p.missing === null && p.monthly === null)).toBe(true);
  });
  it('rejects invalid dates and avoids dividing by zero at a deadline', () => {
    expect(carPaymentPlan(0, 0.65, '', '2027-06', now)).toBeNull();
    expect(carPaymentPlan(0, 0.65, '2027-06', '2026-11', now)).toBeNull();
    expect(carPaymentPlan(0, 0.65, '2026-10', '2027-06', now)[0].monthly).toBeNull();
  });
});
