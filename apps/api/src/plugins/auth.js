import { verifyAppJwt } from '../lib/jwt.js';

export async function registerAuth(fastify) {
  fastify.decorate('authenticate', async function (request, reply) {
    const h = request.headers.authorization;
    if (!h || !h.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'missing_authorization' });
    }
    try {
      const payload = verifyAppJwt(h.slice(7));
      request.googleSub = payload.googleSub;
    } catch {
      return reply.code(401).send({ error: 'invalid_token' });
    }
  });
}
