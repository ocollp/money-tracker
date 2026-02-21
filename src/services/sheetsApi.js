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
    throw new Error(err.error?.message || `Error ${res.status} al leer el Sheet`);
  }

  const data = await res.json();
  const rows = data.values || [];

  if (rows.length < 2) throw new Error('El Sheet está vacío o no tiene datos');

  return sheetRowsToCSV(rows);
}

function sheetRowsToCSV(rows) {
  return rows.map(row => row.join(',')).join('\n');
}
