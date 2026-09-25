import { describe, it, expect } from 'vitest';
import { carGoal, remuneratedBalance, savingsPaceBalance, carSavingsBalance } from './carGoal.js';

describe('car goal', () => {
  it('adds only each owner’s share of the shared fund to car savings', () => {
    const month = { travelFund: 1391, entries: [
      { category: 'Cuenta flexible', entity: 'Trade Republic', type: 'Cash', amount: 8000 },
      { category: 'Cuenta compartida flexible', entity: 'Trade Republic', type: 'Cash', amount: 1391, isTravel: true },
    ] };
    expect(carSavingsBalance(month, 0.65)).toBeCloseTo(8904.15);
    expect(carSavingsBalance(month, 0.35)).toBeCloseTo(8486.85);
    expect(savingsPaceBalance(month)).toBe(8000);
    expect(carSavingsBalance(null, 0.65)).toBeNull();
  });
  it('includes personal BBVA cash in car savings and pace, excluding shared and housing rows', () => {
    const month = { travelFund: 1391, entries: [
      { category: 'Cuenta flexible', entity: 'Trade Republic', type: 'Cash', amount: 8000 },
      { entity: 'BBVA', type: 'Cash', amount: 2000 },
      { entity: 'BBVA', type: 'Cash', amount: 500, isTravel: true },
      { entity: 'BBVA', type: 'Cash', amount: 150000, isHousing: true },
      { entity: 'BBVA', type: 'Invertido', amount: 3000 },
    ] };
    expect(savingsPaceBalance(month)).toBe(10000);
    expect(remuneratedBalance(month)).toBe(8000);
    expect(carSavingsBalance(month, 0.65)).toBeCloseTo(10904.15);
    expect(carSavingsBalance(month, 0.35)).toBeCloseTo(10486.85);
  });
  it('splits the full price 65/35 and sums individual shortfalls', () => {
    const result = carGoal(25000, 12000, 6000);
    expect(result.people.map(p => p.payment)).toEqual([16250, 8750]);
    expect(result.missing).toBe(7000);
  });
  it('does not use one person’s surplus to cover the other', () => {
    const result = carGoal(20000, 20000, 6000);
    expect(result.missing).toBe(1000);
    expect(result.people[0].remaining).toBe(7000);
  });
  it('distinguishes missing balances from zero', () => {
    expect(carGoal(20000, null, 0).missing).toBeNull();
    expect(carGoal(20000, 0, 0).missing).toBe(20000);
    expect(remuneratedBalance(null)).toBeNull();
  });
  it('excludes shared funds and other investments', () => {
    expect(remuneratedBalance({ entries: [
      { category: 'Cuenta flexible', entity: 'Trade Republic', type: 'Cash', amount: 8000 },
      { category: 'Cuenta flexible', entity: 'Trade Republic', type: 'Cash', amount: 500, isTravel: true },
      { category: 'Acciones', entity: 'Trade Republic', type: 'Invertido', amount: 3000 },
    ] })).toBe(8000);
  });
});
