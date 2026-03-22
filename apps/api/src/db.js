import { MongoClient } from 'mongodb';

let client;
let db;

let testDbOverride;

export function setTestDb(instance) {
  testDbOverride = instance;
}

export function clearTestDb() {
  testDbOverride = undefined;
}

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[api] MONGODB_URI not set — auth and /me routes return 503');
    return null;
  }
  client = new MongoClient(uri);
  await client.connect();
  const name = process.env.MONGODB_DB_NAME || 'money_tracker';
  db = client.db(name);
  await db.collection('users').createIndex({ googleSub: 1 }, { unique: true });
  console.log(`[api] MongoDB connected (${name})`);
  return db;
}

export function getDb() {
  if (testDbOverride !== undefined) return testDbOverride;
  return db;
}

export async function closeDb() {
  if (client) await client.close();
}
