import { describe, it, expect } from 'vitest';
import { classifyLiquidEntry, buildAssetClassSeries, ASSET_CLASS_LABELS } from './assetClassBuckets.js';

describe('classifyLiquidEntry', () => {
  it('classifies pension keywords', () => {
    expect(
      classifyLiquidEntry({
        category: 'Plan de pensiones',
        entity: 'Indexa',
        type: 'Invertido',
        isHousing: false,
        isTravel: false,
      }),
    ).toBe('pension');
  });

  it('classifies indexed providers', () => {
    expect(
      classifyLiquidEntry({
        category: 'Invertido',
        entity: 'Indexa Capital',
        type: 'Invertido',
        isHousing: false,
        isTravel: false,
      }),
    ).toBe('indexed');
  });

  it('classifies generic bank Cash as other (Compte remunerat is only TR cuenta flexible)', () => {
    expect(
      classifyLiquidEntry({
        category: 'Efectivo',
        entity: 'BBVA',
        type: 'Cash',
        isHousing: false,
        isTravel: false,
      }),
    ).toBe('other');
  });

  it('classifies only Trade Republic Cuenta flexible as cash', () => {
    expect(
      classifyLiquidEntry({
        category: 'Cuenta flexible',
        entity: 'Trade Republic',
        type: 'Cash',
        isHousing: false,
        isTravel: false,
      }),
    ).toBe('cash');
    expect(
      classifyLiquidEntry({
        category: 'Compte flexible',
        entity: 'Trade Republic',
        type: 'Cash',
        isHousing: false,
        isTravel: false,
      }),
    ).toBe('cash');
    expect(
      classifyLiquidEntry({
        category: 'Invertido',
        entity: 'Trade Republic',
        type: 'Invertido',
        isHousing: false,
        isTravel: false,
      }),
    ).toBe('indexed');
  });

  it('classifies crowdfunding platforms', () => {
    expect(
      classifyLiquidEntry({
        category: 'Invertido',
        entity: 'Fundeen',
        type: 'Invertido',
        isHousing: false,
        isTravel: false,
      }),
    ).toBe('crowdfunding');
    expect(
      classifyLiquidEntry({
        category: 'Invertido',
        entity: 'Urbanitae',
        type: 'Invertido',
        isHousing: false,
        isTravel: false,
      }),
    ).toBe('crowdfunding');
  });

  it('classifies Revolut invested as Accions when not index-like', () => {
    expect(
      classifyLiquidEntry({
        category: 'Acciones',
        entity: 'Revolut',
        type: 'Invertido',
        isHousing: false,
        isTravel: false,
      }),
    ).toBe('equities');
  });

  it('does not classify other brokers as Accions', () => {
    expect(
      classifyLiquidEntry({
        category: 'Acciones',
        entity: 'DEGIRO',
        type: 'Invertido',
        isHousing: false,
        isTravel: false,
      }),
    ).toBe('other');
  });

  it('classifies crypto keywords and exchange invest rows', () => {
    expect(
      classifyLiquidEntry({
        category: 'Invertido',
        entity: 'Coinbase',
        type: 'Invertido',
        isHousing: false,
        isTravel: false,
      }),
    ).toBe('crypto');
    expect(
      classifyLiquidEntry({
        category: 'Cripto',
        entity: 'Revolut',
        type: 'Invertido',
        isHousing: false,
        isTravel: false,
      }),
    ).toBe('crypto');
  });

  it('defaults unknown invested to other', () => {
    expect(
      classifyLiquidEntry({
        category: 'Invertido',
        entity: 'Some PE fund',
        type: 'Invertido',
        isHousing: false,
        isTravel: false,
      }),
    ).toBe('other');
  });
});

describe('buildAssetClassSeries', () => {
  it('adds travel fund share into Fons d\'emergència, not a separate Viatges slice', () => {
    const months = [
      {
        shortLabel: 'Gen 24',
        key: '2024-01',
        entries: [],
        travelFund: 3000,
      },
    ];
    const { evolution, distribution } = buildAssetClassSeries(months, [0], [0], false, 1);
    expect(evolution[0][ASSET_CLASS_LABELS.other]).toBe(3000);
    expect(distribution.some((d) => d.name === 'Viatges')).toBe(false);
    expect(distribution.find((d) => d.name === ASSET_CLASS_LABELS.other)?.value).toBe(3000);
  });

  it('splits liquid rows and housing equity', () => {
    const months = [
      {
        shortLabel: 'Gen 24',
        key: '2024-01',
        entries: [
          {
            category: 'Efectivo',
            entity: 'BBVA',
            type: 'Cash',
            amount: 1000,
            isHousing: false,
            isTravel: false,
          },
          {
            category: 'Cuenta flexible',
            entity: 'Trade Republic',
            type: 'Cash',
            amount: 2500,
            isHousing: false,
            isTravel: false,
          },
          {
            category: 'Invertido',
            entity: 'Indexa',
            type: 'Invertido',
            amount: 5000,
            isHousing: false,
            isTravel: false,
          },
        ],
        travelFund: 0,
      },
    ];
    const housingEffective = [200_000];
    const mortgageEffective = [-150_000];
    const { distribution, evolution } = buildAssetClassSeries(
      months,
      housingEffective,
      mortgageEffective,
      true,
      1,
    );
    expect(evolution).toHaveLength(1);
    expect(evolution[0][ASSET_CLASS_LABELS.immo]).toBe(50_000);
    expect(evolution[0][ASSET_CLASS_LABELS.cash]).toBe(2500);
    expect(evolution[0][ASSET_CLASS_LABELS.other]).toBe(1000);
    expect(evolution[0][ASSET_CLASS_LABELS.indexed]).toBe(5000);
    const names = new Set(distribution.map((d) => d.name));
    expect(names.has(ASSET_CLASS_LABELS.immo)).toBe(true);
    expect(distribution.find((d) => d.name === ASSET_CLASS_LABELS.immo)?.isHousing).toBe(true);
    expect(names.has(ASSET_CLASS_LABELS.cash)).toBe(true);
    expect(names.has(ASSET_CLASS_LABELS.indexed)).toBe(true);
  });
});
