import { getDb } from '../db.js';
import { defaultSettings, sanitizePatch } from '../lib/userModel.js';

export async function meRoutes(fastify) {
  fastify.get(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const db = getDb();
      if (!db) return reply.code(503).send({ error: 'database_not_configured' });

      const user = await db.collection('users').findOne({ googleSub: request.googleSub });
      if (!user) return reply.code(404).send({ error: 'user_not_found' });

      return {
        user: {
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
        settings: user.settings || defaultSettings(),
      };
    }
  );

  fastify.patch(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const db = getDb();
      if (!db) return reply.code(503).send({ error: 'database_not_configured' });

      const patch = sanitizePatch(request.body);
      if (Object.keys(patch).length === 0) {
        return reply.code(400).send({ error: 'no_valid_fields' });
      }

      const users = db.collection('users');
      const user = await users.findOne({ googleSub: request.googleSub });
      if (!user) return reply.code(404).send({ error: 'user_not_found' });

      const prev = user.settings || defaultSettings();
      const next = { ...prev, ...patch };

      await users.updateOne(
        { googleSub: request.googleSub },
        { $set: { settings: next, updatedAt: new Date() } }
      );

      return { settings: next };
    }
  );
}
