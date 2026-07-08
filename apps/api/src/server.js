import { connectDb, getDb } from './db.js';
import { assertJwtConfigured } from './lib/jwt.js';
import { buildApp } from './app.js';

const port = Number(process.env.PORT) || 3001;
// Default to loopback in local dev to avoid OS/network interface edge cases.
const host = process.env.HOST || '127.0.0.1';

try {
  await connectDb();
} catch (e) {
  // Render must not run without DB; locally Mongo is often off → still listen so Vite proxy / health work.
  if (process.env.RENDER) throw e;
  console.error(
    '[api] MongoDB no disponible — l\'API arrenca igual (mode local). Els endpoints que necessiten DB retornaran 503. Motiu:',
    e?.message || e,
  );
}
assertJwtConfigured();

// On Render, refuse to run a "zombie" API with no DB (everything would 503).
if (process.env.RENDER && !getDb()) {
  console.error(
    '[api] FATAL: MongoDB not connected. In Render → Environment add MONGODB_URI (same value as Atlas "Connect" string). Save and redeploy.',
  );
  process.exit(1);
}

const fastify = await buildApp({
  logger: Boolean(process.env.RENDER || process.env.NODE_ENV === 'production'),
});
await fastify.listen({
  port,
  host,
  // Avoid Fastify's default listen text that may enumerate network interfaces.
  listenTextResolver: (address) => `[api] Server listening at ${address}`,
});
