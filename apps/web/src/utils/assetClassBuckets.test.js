import { describe, it, expect } from 'vitest';
import {
  classifyLiquidEntry,
  buildAssetClassSeries,
  buildCategoryGroupedAssetClassSeries,
  ASSET_CLASS_LABELS,
} from './assetClassBuckets.js';
import { TERTIARY_CATEGORY_BUCKETS } from '../lib/profileConfig.js';

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

  it('classifies generic bank Cash as other', () => {
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
        category: 'Acciones',
        entity: 'Trade Republic',
        type: 'Invertido',
        isHousing: false,
        isTravel: false,
      }),
    ).toBe('equities');
    expect(
      classifyLiquidEntry({
        category: 'ETF VWCE',
        entity: 'Trade Republic',
        type: 'Invertido',
        isHousing: false,
        isTravel: false,
      }),
    ).toBe('etfs');
  });

  it('classifies Revolut ETFs as indexed', () => {
    expect(
      classifyLiquidEntry({
        category: 'ETF',
        entity: 'Revolut',
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
  it('adds travel fund to Estalvi líquid bucket', () => {
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
          {
            category: 'Acciones',
            entity: 'Trade Republic',
            type: 'Invertido',
            amount: 3000,
            isHousing: false,
            isTravel: false,
          },
          {
            category: 'Acciones',
            entity: 'Revolut',
            type: 'Invertido',
            amount: 2000,
            isHousing: false,
            isTravel: false,
          },
          {
            category: 'ETF VWCE',
            entity: 'Trade Republic',
            type: 'Invertido',
            amount: 4000,
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
    expect(evolution[0][ASSET_CLASS_LABELS.etfs]).toBe(4000);
    expect(evolution[0][ASSET_CLASS_LABELS.equities]).toBe(5000);
    const names = new Set(distribution.map((d) => d.name));
    expect(names.has(ASSET_CLASS_LABELS.immo)).toBe(true);
    expect(distribution.find((d) => d.name === ASSET_CLASS_LABELS.immo)?.isHousing).toBe(true);
    expect(names.has(ASSET_CLASS_LABELS.cash)).toBe(true);
    expect(names.has(ASSET_CLASS_LABELS.indexed)).toBe(true);
    expect(names.has(ASSET_CLASS_LABELS.etfs)).toBe(true);
    expect(names.has(ASSET_CLASS_LABELS.equities)).toBe(true);
  });

  it('groups Diego & Montse categories into three buckets', () => {
    const months = [
      {
        shortLabel: 'Jul 26',
        key: '2026-07',
        entries: [
          { category: 'Cuenta corriente', entity: 'CaixaBank', type: 'Cash', amount: 20598, isHousing: false, isTravel: false },
          { category: 'Cuenta corriente', entity: 'Santander', type: 'Cash', amount: 11573, isHousing: false, isTravel: false },
          { category: 'Acciones', entity: 'Santander', type: 'Invertido', amount: 41253, isHousing: false, isTravel: false },
          { category: 'Cuenta flexible', entity: 'Revolut', type: 'Invertido', amount: 10001, isHousing: false, isTravel: false },
          { category: 'Cuenta flexible', entity: 'Trade Republic', type: 'Invertido', amount: 10534, isHousing: false, isTravel: false },
        ],
        travelFund: 0,
      },
    ];
    const { distribution } = buildCategoryGroupedAssetClassSeries(months, TERTIARY_CATEGORY_BUCKETS);
    const byName = Object.fromEntries(distribution.map((d) => [d.name, d.value]));
    expect(byName['Comptes corrents']).toBe(32171);
    expect(byName.Inversions).toBe(41253);
    expect(byName['Comptes remunerats']).toBe(20535);
    expect(distribution).toHaveLength(3);
  });
});
