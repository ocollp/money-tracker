import { parseCSV, groupByMonth, mergeFixedHousingSheetRows } from '../utils/parseCSV.js';

export const EMPTY_SHEET_ERROR = 'The sheet is empty or has no data';

export function csvTextToMonths(csvText, housing = {}) {
  const rows = mergeFixedHousingSheetRows(parseCSV(csvText), {
    amount: housing.amount,
    entity: housing.entity,
  });
  const months = groupByMonth(rows);
  if (!months.length) throw new Error(EMPTY_SHEET_ERROR);
  return months;
}
