import { SHEET_RANGE } from '../config';

// ─── Direct Google Sheets API (implicit / no-backend mode) ────────────────

export async function checkSheetAccess(accessToken, spreadsheetId) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_RANGE}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  return res.ok;
}

export async function fetchSheetData(accessToken, spreadsheetId) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_RANGE}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error ${res.status} reading the sheet`);
  }

  const data = await res.json();
  const rows = data.values || [];
  if (rows.length < 2) throw new Error('The sheet is empty or has no data');
  return rows.map(row => row.join(',')).join('\n');
}

// ─── Backend proxy (backend mode — JWT auth, auto-refreshes Google token) ─

export async function checkSheetAccessViaBackend(appJwt, spreadsheetId, apiUrl) {
  try {
    const res = await fetch(`${apiUrl}/sheets/${spreadsheetId}/access`, {
      headers: { Authorization: `Bearer ${appJwt}` },
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({ ok: false }));
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

export async function fetchSheetDataViaBackend(appJwt, spreadsheetId, apiUrl) {
  const res = await fetch(`${apiUrl}/sheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${appJwt}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('jwt_expired');
    throw new Error(body.message || `Error ${res.status} reading the sheet`);
  }

  return await res.text();
}

export async function appendRowsViaBackend(appJwt, spreadsheetId, rows, apiUrl) {
  const res = await fetch(`${apiUrl}/sheets/${spreadsheetId}/append`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${appJwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rows }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Error ${res.status}`);
  }

  return await res.json();
}
