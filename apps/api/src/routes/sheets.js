import { getDb } from '../db.js';
import { getValidAccessToken } from '../lib/googleTokens.js';

const SHEET_RANGE = 'A:I';

async function getUser(googleSub) {
  const db = getDb();
  if (!db) return null;
  return db.collection('users').findOne({ googleSub });
}

export async function sheetsRoutes(fastify) {
  fastify.get(
    '/:spreadsheetId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const db = getDb();
      if (!db) return reply.code(503).send({ error: 'database_not_configured' });

      const user = await getUser(request.googleSub);
      if (!user) return reply.code(404).send({ error: 'user_not_found' });

      let accessToken;
      try {
        accessToken = await getValidAccessToken(user, db);
      } catch (e) {
        request.log.warn(e, 'google token refresh');
        return reply.code(401).send({ error: 'google_token_expired', message: 'Re-login required' });
      }

      const { spreadsheetId } = request.params;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_RANGE}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const status = res.status === 403 || res.status === 404 ? res.status : 502;
        return reply.code(status).send({
          error: 'sheets_api_error',
          message: err.error?.message || `Google Sheets returned ${res.status}`,
        });
      }

      const data = await res.json();
      const rows = data.values || [];
      const csv = rows.map(row => row.join(',')).join('\n');

      reply.type('text/plain').send(csv);
    },
  );

  fastify.get(
    '/:spreadsheetId/access',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const db = getDb();
      if (!db) return reply.code(503).send({ error: 'database_not_configured' });

      const user = await getUser(request.googleSub);
      if (!user) return reply.code(404).send({ error: 'user_not_found' });

      let accessToken;
      try {
        accessToken = await getValidAccessToken(user, db);
      } catch {
        return { ok: false };
      }

      const { spreadsheetId } = request.params;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_RANGE}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return { ok: res.ok };
    },
  );

  fastify.post(
    '/:spreadsheetId/append',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const db = getDb();
      if (!db) return reply.code(503).send({ error: 'database_not_configured' });

      const user = await getUser(request.googleSub);
      if (!user) return reply.code(404).send({ error: 'user_not_found' });

      const { rows } = request.body || {};
      if (!Array.isArray(rows) || rows.length === 0) {
        return reply.code(400).send({ error: 'missing_rows' });
      }

      let accessToken;
      try {
        accessToken = await getValidAccessToken(user, db);
      } catch (e) {
        request.log.warn(e, 'google token refresh');
        return reply.code(401).send({ error: 'google_token_expired', message: 'Re-login required' });
      }

      // Compact sheet layout: Fecha, Cash/Inversión, Categoria, Entidad, Cantidad
      // Sheets are newest-first: insert new month rows just below the header (row 2).
      const values = rows.map((r) => [
        r.date, r.type, r.category, r.entity, r.amount,
      ]);

      const { spreadsheetId } = request.params;
      const authHeaders = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };

      const metaRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,index)`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!metaRes.ok) {
        const err = await metaRes.json().catch(() => ({}));
        request.log.warn(err, 'sheets metadata error');
        return reply.code(502).send({
          error: 'sheets_metadata_error',
          message: err.error?.message || `Google Sheets returned ${metaRes.status}`,
        });
      }
      const meta = await metaRes.json();
      const sheetId = meta.sheets?.find((s) => s.properties?.index === 0)?.properties?.sheetId
        ?? meta.sheets?.[0]?.properties?.sheetId;
      if (sheetId == null) {
        return reply.code(502).send({ error: 'sheets_metadata_error', message: 'No sheet found' });
      }

      const insertRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            requests: [
              {
                insertDimension: {
                  range: {
                    sheetId,
                    dimension: 'ROWS',
                    startIndex: 1,
                    endIndex: 1 + values.length,
                  },
                  inheritFromBefore: false,
                },
              },
            ],
          }),
        },
      );
      if (!insertRes.ok) {
        const err = await insertRes.json().catch(() => ({}));
        request.log.warn(err, 'sheets insert rows error');
        return reply.code(502).send({
          error: 'sheets_insert_error',
          message: err.error?.message || `Google Sheets returned ${insertRes.status}`,
        });
      }

      const endRow = 1 + values.length;
      const updateRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2:E${endRow}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ values }),
        },
      );
      if (!updateRes.ok) {
        const err = await updateRes.json().catch(() => ({}));
        request.log.warn(err, 'sheets write values error');
        return reply.code(502).send({
          error: 'sheets_append_error',
          message: err.error?.message || `Google Sheets returned ${updateRes.status}`,
        });
      }

      const data = await updateRes.json();
      return { ok: true, rowsAdded: data.updatedRows || rows.length };
    },
  );
}
