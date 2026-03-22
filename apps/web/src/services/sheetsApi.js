import { SHEET_RANGE } from '../config';

export async function checkSheetAccess(accessToken, spreadsheetId) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_RANGE}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  return res.ok;
}

export async function fetchSheetData(accessToken, spreadsheetId) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_RANGE}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error ${res.status} reading the sheet`);
  }

  const data = await res.json();
  const rows = data.values || [];

  if (rows.length < 2) throw new Error('The sheet is empty or has no data');

  return sheetRowsToCSV(rows);
}

function sheetRowsToCSV(rows) {
  return rows.map(row => row.join(',')).join('\n');
}
