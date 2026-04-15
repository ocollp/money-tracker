import Fastify from 'fastify';
import cors from '@fastify/cors';
import { getDb } from './db.js';
import { registerAuth } from './plugins/auth.js';
import { authRoutes } from './routes/auth.js';
import { meRoutes } from './routes/me.js';
import { sheetsRoutes } from './routes/sheets.js';
import { webauthnRoutes } from './routes/webauthn.js';

export async function buildApp(opts = {}) {
  const fastify = Fastify({ logger: opts.logger ?? true });

  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
    : true;

  await fastify.register(cors, {
    origin: corsOrigins,
    credentials: true,
  });

  await registerAuth(fastify);
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(meRoutes, { prefix: '/me' });
  await fastify.register(sheetsRoutes, { prefix: '/sheets' });
  await fastify.register(webauthnRoutes, { prefix: '/auth/webauthn' });

  fastify.get('/health', async () => ({
    ok: true,
    service: 'money-tracker-api',
    db: Boolean(getDb()),
  }));

  fastify.get('/', async () => ({
    message: 'Money Tracker API',
    auth: 'POST /auth/google',
    profile: 'GET/PATCH /me (Authorization: Bearer JWT)',
  }));

  return fastify;
}
