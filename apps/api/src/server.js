import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

fastify.get('/health', async () => ({
  ok: true,
  service: 'money-tracker-api',
}));

fastify.get('/', async () => ({
  message: 'Money Tracker API',
  docs: 'Add auth and /profile routes here; see apps/api/README.md',
}));

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || '0.0.0.0';

await fastify.listen({ port, host });
console.log(`API listening on http://${host}:${port}`);
