import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { getDb } from '../db.js';
import { signAppJwt } from '../lib/jwt.js';
import { defaultSettings } from '../lib/userModel.js';

const RP_NAME = 'Finances personals';

function rpId() {
  return process.env.WEBAUTHN_RP_ID || 'localhost';
}

function expectedOrigins() {
  const env = process.env.WEBAUTHN_ORIGIN;
  if (env) return env.split(',').map(s => s.trim()).filter(Boolean);
  const id = rpId();
  const origins = [`https://${id}`];
  if (id === 'localhost') origins.push('http://localhost:5173', 'http://localhost:5174');
  return origins;
}

// In-memory challenge store (per-user, short-lived).
// A production app should use Redis or DB, but for a single-user personal app
// with one server instance this is fine.
const challenges = new Map();
function setChallenge(key, challenge) {
  challenges.set(key, { challenge, ts: Date.now() });
  // Cleanup stale entries (> 5 min)
  for (const [k, v] of challenges) {
    if (Date.now() - v.ts > 300_000) challenges.delete(k);
  }
}
function getChallenge(key) {
  const entry = challenges.get(key);
  challenges.delete(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > 300_000) return null;
  return entry.challenge;
}

export async function webauthnRoutes(fastify) {
  // ─── Registration (requires existing JWT session) ───────────────────────

  fastify.get(
    '/register-options',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const db = getDb();
      if (!db) return { error: 'database_not_configured' };

      const user = await db.collection('users').findOne({ googleSub: request.googleSub });
      if (!user) return { error: 'user_not_found' };

      const existingCreds = (user.passkeys || []).map(pk => ({
        id: pk.credentialId,
        transports: pk.transports,
      }));

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: rpId(),
        userID: new TextEncoder().encode(user.googleSub),
        userName: user.email || user.name || 'user',
        userDisplayName: user.name || user.email || 'User',
        attestationType: 'none',
        excludeCredentials: existingCreds,
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
      });

      setChallenge(`reg:${user.googleSub}`, options.challenge);
      return options;
    },
  );

  fastify.post(
    '/register',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const db = getDb();
      if (!db) return reply.code(503).send({ error: 'database_not_configured' });

      const user = await db.collection('users').findOne({ googleSub: request.googleSub });
      if (!user) return reply.code(404).send({ error: 'user_not_found' });

      const expectedChallenge = getChallenge(`reg:${user.googleSub}`);
      if (!expectedChallenge) {
        return reply.code(400).send({ error: 'challenge_expired' });
      }

      let verification;
      try {
        verification = await verifyRegistrationResponse({
          response: request.body,
          expectedChallenge,
          expectedOrigin: expectedOrigins(),
          expectedRPID: rpId(),
        });
      } catch (e) {
        request.log.warn(e, 'webauthn registration verify');
        return reply.code(400).send({ error: 'verification_failed', message: e.message });
      }

      if (!verification.verified || !verification.registrationInfo) {
        return reply.code(400).send({ error: 'not_verified' });
      }

      const { credential } = verification.registrationInfo;

      const passkey = {
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString('base64'),
        counter: credential.counter,
        transports: request.body.response?.transports || [],
        createdAt: new Date(),
      };

      await db.collection('users').updateOne(
        { googleSub: user.googleSub },
        { $push: { passkeys: passkey } },
      );

      return { ok: true };
    },
  );

  // ─── Authentication (no JWT needed — this IS the login) ─────────────────

  fastify.post('/login-options', async (request, reply) => {
    const db = getDb();
    if (!db) return reply.code(503).send({ error: 'database_not_configured' });

    const options = await generateAuthenticationOptions({
      rpID: rpId(),
      userVerification: 'preferred',
    });

    setChallenge(`auth:${options.challenge}`, options.challenge);

    return options;
  });

  fastify.post('/login', async (request, reply) => {
    const db = getDb();
    if (!db) return reply.code(503).send({ error: 'database_not_configured' });

    const { id: credentialId } = request.body || {};
    if (!credentialId) {
      return reply.code(400).send({ error: 'missing_credential_id' });
    }

    const user = await db.collection('users').findOne({
      'passkeys.credentialId': credentialId,
    });
    if (!user) {
      return reply.code(401).send({ error: 'unknown_credential' });
    }

    const passkey = user.passkeys.find(pk => pk.credentialId === credentialId);
    if (!passkey) {
      return reply.code(401).send({ error: 'credential_not_found' });
    }

    let clientChallenge;
    try {
      const clientDataJSON = Buffer.from(request.body.response.clientDataJSON, 'base64url');
      const clientData = JSON.parse(clientDataJSON.toString('utf8'));
      clientChallenge = clientData.challenge;
    } catch {
      return reply.code(400).send({ error: 'invalid_client_data' });
    }

    const matchedChallenge = getChallenge(`auth:${clientChallenge}`);
    if (!matchedChallenge) {
      return reply.code(400).send({ error: 'challenge_expired' });
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: request.body,
        expectedChallenge: matchedChallenge,
        expectedOrigin: expectedOrigins(),
        expectedRPID: rpId(),
        credential: {
          id: passkey.credentialId,
          publicKey: new Uint8Array(Buffer.from(passkey.publicKey, 'base64')),
          counter: passkey.counter,
          transports: passkey.transports,
        },
      });
    } catch (e) {
      request.log.warn(e, 'webauthn login verify');
      return reply.code(401).send({ error: 'verification_failed', message: e.message });
    }

    if (!verification.verified) {
      return reply.code(401).send({ error: 'not_verified' });
    }

    // Update counter
    await db.collection('users').updateOne(
      { googleSub: user.googleSub, 'passkeys.credentialId': credentialId },
      { $set: { 'passkeys.$.counter': verification.authenticationInfo.newCounter } },
    );

    const token = signAppJwt(user.googleSub);

    return {
      token,
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      settings: user.settings || defaultSettings(),
    };
  });
}
