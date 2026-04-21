import { connectDb, getDb } from './db.js';
import { assertJwtConfigured } from './lib/jwt.js';
import { buildApp } from './app.js';

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || '0.0.0.0';

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

const fastify = await buildApp();
await fastify.listen({ port, host });
console.log(`API listening on http://${host}:${port}`);
