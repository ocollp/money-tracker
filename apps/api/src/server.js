import { connectDb } from './db.js';
import { assertJwtConfigured } from './lib/jwt.js';
import { buildApp } from './app.js';

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || '0.0.0.0';

await connectDb();
assertJwtConfigured();

const fastify = await buildApp();
await fastify.listen({ port, host });
console.log(`API listening on http://${host}:${port}`);
