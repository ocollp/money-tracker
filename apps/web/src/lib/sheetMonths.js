import {
  parseCSV,
  parseSheetMatrix,
  groupByMonth,
  mergeFixedHousingSheetRows,
} from '../utils/parseCSV.js';

export const EMPTY_SHEET_ERROR = 'The sheet is empty or has no data';

function rowsToMonths(parsedRows, housing = {}) {
  const rows = mergeFixedHousingSheetRows(parsedRows, {
    amount: housing.amount,
    entity: housing.entity,
  });
  const months = groupByMonth(rows);
  if (!months.length) throw new Error(EMPTY_SHEET_ERROR);
  return months;
}

export function csvTextToMonths(csvText, housing = {}) {
  return rowsToMonths(parseCSV(csvText), housing);
}

export function sheetValuesToMonths(values, housing = {}) {
  return rowsToMonths(parseSheetMatrix(values), housing);
}

/** Stable fingerprint for poll/cache skip comparisons. */
export function sheetValuesFingerprint(values) {
  return JSON.stringify(values ?? []);
}
