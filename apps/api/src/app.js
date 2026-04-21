import Fastify from 'fastify';
import cors from '@fastify/cors';
import { getDb } from './db.js';
import { isMongoUriConfigured, resolveMongoUri } from './lib/mongoEnv.js';
import { registerAuth } from './plugins/auth.js';
import { authRoutes } from './routes/auth.js';
import { meRoutes } from './routes/me.js';
import { sheetsRoutes } from './routes/sheets.js';
import { webauthnRoutes } from './routes/webauthn.js';

/** localhost and 127.0.0.1 are different Origins; mirror both so dev works either way. */
function parseCorsOrigins() {
  const raw = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  if (raw.length === 0) return true;
  const allowed = new Set(raw);
  for (const o of raw) {
    try {
      const u = new URL(o);
      if (u.hostname === 'localhost') {
        allowed.add(`${u.protocol}//127.0.0.1${u.port ? `:${u.port}` : ''}`);
      }
      if (u.hostname === '127.0.0.1') {
        allowed.add(`${u.protocol}//localhost${u.port ? `:${u.port}` : ''}`);
      }
    } catch {
      /* ignore invalid */
    }
  }
  return [...allowed];
}

export async function buildApp(opts = {}) {
  const fastify = Fastify({ logger: opts.logger ?? true });

  const corsOrigins = process.env.CORS_ORIGIN ? parseCorsOrigins() : true;

  await fastify.register(cors, {
    origin: corsOrigins,
    credentials: true,
  });

  await registerAuth(fastify);
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(meRoutes, { prefix: '/me' });
  await fastify.register(sheetsRoutes, { prefix: '/sheets' });
  await fastify.register(webauthnRoutes, { prefix: '/auth/webauthn' });

  fastify.get('/health', async () => {
    const { envKey } = resolveMongoUri();
    return {
      ok: true,
      service: 'money-tracker-api',
      mongoUriEnvSet: isMongoUriConfigured(),
      mongoUriEnvKey: envKey,
      db: Boolean(getDb()),
    };
  });

  fastify.get('/', async () => ({
    message: 'Money Tracker API',
    auth: 'POST /auth/google',
    profile: 'GET/PATCH /me (Authorization: Bearer JWT)',
  }));

  return fastify;
}
