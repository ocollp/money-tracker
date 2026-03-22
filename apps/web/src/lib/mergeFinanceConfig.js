import {
  SPREADSHEET_ID,
  SPREADSHEET_ID_2,
  PROFILE_PRIMARY_ID,
  PROFILE_SECONDARY_ID,
  PROFILE_LABELS,
  PROFILE_EMOJIS,
  MORTGAGE_END_YEAR,
  MORTGAGE_END_MONTH,
  MORTGAGE_MONTHLY_PAYMENT,
  OWNERSHIP_SHARE,
  ASSUMED_UNEMPLOYMENT,
} from '../config.js';

export function buildFinanceConfig(apiSettings) {
  const s = apiSettings || {};
  return {
    spreadsheetId: (s.spreadsheetId && String(s.spreadsheetId).trim()) || SPREADSHEET_ID,
    spreadsheetId2: (s.spreadsheetId2 && String(s.spreadsheetId2).trim()) || SPREADSHEET_ID_2,
    profileLabels: {
      [PROFILE_PRIMARY_ID]:
        (s.profilePrimaryLabel && String(s.profilePrimaryLabel).trim()) ||
        PROFILE_LABELS[PROFILE_PRIMARY_ID],
      [PROFILE_SECONDARY_ID]:
        (s.profileSecondaryLabel && String(s.profileSecondaryLabel).trim()) ||
        PROFILE_LABELS[PROFILE_SECONDARY_ID],
    },
    profileEmojis: {
      [PROFILE_PRIMARY_ID]:
        (s.profilePrimaryEmoji && String(s.profilePrimaryEmoji).trim()) ||
        PROFILE_EMOJIS[PROFILE_PRIMARY_ID],
      [PROFILE_SECONDARY_ID]:
        (s.profileSecondaryEmoji && String(s.profileSecondaryEmoji).trim()) ||
        PROFILE_EMOJIS[PROFILE_SECONDARY_ID],
    },
    mortgageEndYear:
      s.mortgageEndYear != null && !Number.isNaN(Number(s.mortgageEndYear))
        ? Number(s.mortgageEndYear)
        : MORTGAGE_END_YEAR,
    mortgageEndMonth:
      s.mortgageEndMonth != null && !Number.isNaN(Number(s.mortgageEndMonth))
        ? Number(s.mortgageEndMonth)
        : MORTGAGE_END_MONTH,
    mortgageMonthlyPayment:
      s.mortgageMonthlyPayment != null && !Number.isNaN(Number(s.mortgageMonthlyPayment))
        ? Number(s.mortgageMonthlyPayment)
        : MORTGAGE_MONTHLY_PAYMENT,
    ownershipShare:
      s.ownershipShare != null && !Number.isNaN(Number(s.ownershipShare))
        ? Number(s.ownershipShare)
        : OWNERSHIP_SHARE,
    assumedUnemployment:
      s.assumedUnemployment != null && !Number.isNaN(Number(s.assumedUnemployment))
        ? Number(s.assumedUnemployment)
        : ASSUMED_UNEMPLOYMENT,
  };
}

export function applyLocalProfileDisplay(financeConfig, local) {
  if (!local || typeof local !== 'object') return financeConfig;
  const L = { ...financeConfig.profileLabels };
  const E = { ...financeConfig.profileEmojis };
  const apply = (key, labelKey, emojiKey) => {
    const lv = local[labelKey];
    if (lv != null && String(lv).trim()) {
      L[key] = String(lv).trim();
    }
    const ev = local[emojiKey];
    if (ev != null && String(ev).trim()) {
      E[key] = String(ev).trim();
    }
  };
  apply(PROFILE_PRIMARY_ID, 'profilePrimaryLabel', 'profilePrimaryEmoji');
  apply(PROFILE_SECONDARY_ID, 'profileSecondaryLabel', 'profileSecondaryEmoji');
  return { ...financeConfig, profileLabels: L, profileEmojis: E };
}

export function financeConfigToStatsOptions(finance) {
  return {
    ownershipShare: finance.ownershipShare,
    mortgageEndYear: finance.mortgageEndYear,
    mortgageEndMonth: finance.mortgageEndMonth,
    mortgageMonthlyPayment: finance.mortgageMonthlyPayment,
    assumedUnemployment: finance.assumedUnemployment,
  };
}

export function financeConfigToSettingsFormShape(finance) {
  return {
    spreadsheetId: finance.spreadsheetId ?? null,
    spreadsheetId2: finance.spreadsheetId2 || null,
    profilePrimaryLabel: finance.profileLabels[PROFILE_PRIMARY_ID] ?? null,
    profileSecondaryLabel: finance.profileLabels[PROFILE_SECONDARY_ID] ?? null,
    profilePrimaryEmoji: finance.profileEmojis[PROFILE_PRIMARY_ID] ?? null,
    profileSecondaryEmoji: finance.profileEmojis[PROFILE_SECONDARY_ID] ?? null,
    mortgageEndYear: finance.mortgageEndYear,
    mortgageEndMonth: finance.mortgageEndMonth,
    mortgageMonthlyPayment: finance.mortgageMonthlyPayment,
    ownershipShare: finance.ownershipShare,
    assumedUnemployment: finance.assumedUnemployment,
  };
}
