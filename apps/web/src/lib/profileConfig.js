import {
  PROFILE_PRIMARY_ID,
  PROFILE_SECONDARY_ID,
  PROFILE_TERTIARY_ID,
} from '../config.js';

export const TERTIARY_CATEGORY_BUCKETS = {
  'cuenta corriente': 'Comptes corrents',
  acciones: 'Inversions',
  'cuenta flexible': 'Comptes remunerats',
};

const DEFAULT_FEATURES = {
  showTravelKpi: true,
  showPatrimonyKpi: true,
  showHousingSection: true,
  showPatterns: true,
  showMilestones: true,
  assetClassMode: 'default',
};

const TERTIARY_FEATURES = {
  showTravelKpi: false,
  showPatrimonyKpi: false,
  showHousingSection: false,
  showPatterns: false,
  showMilestones: false,
  assetClassMode: 'categoryGrouped',
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
