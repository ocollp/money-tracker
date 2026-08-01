import { SHEET_RANGE } from '../config';

const SHEETS_META_FIELDS = 'spreadsheetId';

function sheetMetaUrl(spreadsheetId) {
  return `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=${SHEETS_META_FIELDS}`;
}

function sheetValuesUrl(spreadsheetId) {
  return `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_RANGE}`;
}

// ─── Direct Google Sheets API (implicit / no-backend mode) ────────────────

export async function checkSheetAccess(accessToken, spreadsheetId) {
  const res = await fetch(sheetMetaUrl(spreadsheetId), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.ok;
}

/** @returns {Promise<string[][]>} */
export async function fetchSheetData(accessToken, spreadsheetId) {
  const res = await fetch(sheetValuesUrl(spreadsheetId), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error ${res.status} reading the sheet`);
  }

  const data = await res.json();
  const values = data.values || [];
  if (values.length < 2) throw new Error('The sheet is empty or has no data');
  return values;
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

export const SHEET_AUTH_ERRORS = {
  JWT_EXPIRED: 'jwt_expired',
  GOOGLE_REAUTH: 'google_reauth_required',
};

/** @returns {Promise<string[][]>} */
export async function fetchSheetDataViaBackend(appJwt, spreadsheetId, apiUrl) {
  const res = await fetch(`${apiUrl}/sheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${appJwt}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      if (body.error === 'google_token_expired') {
        throw new Error(SHEET_AUTH_ERRORS.GOOGLE_REAUTH);
      }
      throw new Error(SHEET_AUTH_ERRORS.JWT_EXPIRED);
    }
    throw new Error(body.message || `Error ${res.status} reading the sheet`);
  }

  const body = await res.json();
  const values = body.values || [];
  if (values.length < 2) throw new Error('The sheet is empty or has no data');
  return values;
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
