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

      const values = rows.map(r => [
        r.date, r.month, r.year, r.type, r.category, r.entity, r.amount,
      ]);

      const { spreadsheetId } = request.params;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:G:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        request.log.warn(err, 'sheets append error');
        return reply.code(502).send({
          error: 'sheets_append_error',
          message: err.error?.message || `Google Sheets returned ${res.status}`,
        });
      }

      const data = await res.json();
      return { ok: true, rowsAdded: data.updates?.updatedRows || rows.length };
    },
  );
}
