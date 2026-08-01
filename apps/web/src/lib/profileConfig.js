import {
  PROFILE_PRIMARY_ID,
  PROFILE_SECONDARY_ID,
  PROFILE_TERTIARY_ID,
} from '../config.js';
import { ASSET_CLASS_LABELS } from '../utils/assetClassBuckets.js';
import {
  COLOR_ESTALVI_LIQUID,
  COLOR_PENSION,
  COLOR_REMUNERAT,
  COLOR_TERTIARY_CORRENTS,
  COLOR_TERTIARY_INVERSIONS,
} from './distributionPalette.js';

export const TERTIARY_CATEGORY_BUCKETS = {
  'cuenta corriente': 'Comptes corrents',
  acciones: 'Inversions',
  'cuenta flexible': 'Comptes remunerats',
  'plan de pensiones': ASSET_CLASS_LABELS.pension,
  'plan de pensions': ASSET_CLASS_LABELS.pension,
  'pla de pensions': ASSET_CLASS_LABELS.pension,
  // Sheet row: type Cash, category Cash, entity Efectivo
  cash: 'Efectivo',
  efectivo: 'Efectivo',
};

export const TERTIARY_DISTRIBUTION_COLORS = {
  'Comptes corrents': COLOR_TERTIARY_CORRENTS,
  Inversions: COLOR_TERTIARY_INVERSIONS,
  'Comptes remunerats': COLOR_REMUNERAT,
  [ASSET_CLASS_LABELS.pension]: COLOR_PENSION,
  Efectivo: COLOR_ESTALVI_LIQUID,
};

const DEFAULT_FEATURES = {
  showCurrentMonthKpi: false,
  showTravelKpi: true,
  showPatrimonyKpi: true,
  showHousingSection: true,
  showPatterns: true,
  showMilestones: true,
  assetClassMode: 'default',
  trimEmptyHeatmapMonths: false,
};

const TERTIARY_FEATURES = {
  showCurrentMonthKpi: false,
  showTravelKpi: false,
  showPatrimonyKpi: false,
  showHousingSection: false,
  showPatterns: true,
  showMilestones: false,
  assetClassMode: 'categoryGrouped',
  trimEmptyHeatmapMonths: true,
};

export function getProfileFeatures(profileId) {
  if (profileId === PROFILE_TERTIARY_ID) return TERTIARY_FEATURES;
  if (profileId === PROFILE_PRIMARY_ID) {
    return { ...DEFAULT_FEATURES, showMilestones: true };
  }
  if (profileId === PROFILE_SECONDARY_ID) {
    return { ...DEFAULT_FEATURES, showMilestones: false };
  }
  return { ...DEFAULT_FEATURES, showMilestones: profileId === PROFILE_PRIMARY_ID };
}
