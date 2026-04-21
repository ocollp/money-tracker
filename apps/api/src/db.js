import { MongoClient } from 'mongodb';
import { resolveMongoUri } from './lib/mongoEnv.js';

let client;
let db;

let testDbOverride;

export function setTestDb(instance) {
  testDbOverride = instance;
}

export function clearTestDb() {
  testDbOverride = undefined;
}

const CONNECT_RETRIES = 4;
const CONNECT_BASE_DELAY_MS = 1500;

export async function connectDb() {
  const { uri } = resolveMongoUri();
  if (!uri) {
    console.warn(
      '[api] No MongoDB URI — set MONGODB_URI (or MONGODB_URL / DATABASE_URL) in Render → Environment.',
    );
    return null;
  }

  const name = process.env.MONGODB_DB_NAME || 'money_tracker';
  let lastErr;

  for (let attempt = 1; attempt <= CONNECT_RETRIES; attempt++) {
    let attemptClient;
    try {
      attemptClient = new MongoClient(uri);
      await attemptClient.connect();
      client = attemptClient;
      db = client.db(name);
      await db.collection('users').createIndex({ googleSub: 1 }, { unique: true });
      console.log(`[api] MongoDB connected (${name})`);
      return db;
    } catch (e) {
      lastErr = e;
      if (attemptClient) {
        try {
          await attemptClient.close();
        } catch {
          /* ignore */
        }
      }
      console.error(
        `[api] MongoDB connect attempt ${attempt}/${CONNECT_RETRIES} failed:`,
        e?.message || e,
      );
      if (attempt < CONNECT_RETRIES) {
        await new Promise((r) => setTimeout(r, CONNECT_BASE_DELAY_MS * attempt));
      }
    }
  }

  console.error(
    '[api] MongoDB: give up after retries. Check: Atlas Network Access (0.0.0.0/0), DB user/password in MONGODB_URI (URL-encode special chars), and MONGODB_DB_NAME.',
  );
  throw lastErr;
}

export function getDb() {
  if (testDbOverride !== undefined) return testDbOverride;
  return db;
}

export async function closeDb() {
  if (client) await client.close();
}
