import { getDb } from '../db.js';
import { fetchGoogleUserInfo } from '../lib/googleUser.js';
import { exchangeCodeForTokens } from '../lib/googleTokens.js';
import { signAppJwt } from '../lib/jwt.js';
import { defaultSettings } from '../lib/userModel.js';

/** ~50m — implicit flow tokens are ~1h; exact expiry not sent to backend */
const IMPLICIT_TOKEN_TTL_MS = 50 * 60 * 1000;

export async function authRoutes(fastify) {
  fastify.post('/google', async (request, reply) => {
    const db = getDb();
    if (!db) {
      return reply.code(503).send({ error: 'database_not_configured' });
    }

    const { code, accessToken: bodyAccessToken } = request.body || {};
    let googleAccessToken;
    let tokenFields = {};

    if (code && typeof code === 'string') {
      try {
        const tokens = await exchangeCodeForTokens(code);
        googleAccessToken = tokens.accessToken;
        tokenFields = {
          googleAccessToken: tokens.accessToken,
          googleTokenExpiresAt: tokens.expiresAt,
          ...(tokens.refreshToken ? { googleRefreshToken: tokens.refreshToken } : {}),
        };
      } catch (e) {
        request.log.warn(e, 'google code exchange');
        return reply.code(401).send({ error: 'invalid_google_code' });
      }
    } else if (bodyAccessToken && typeof bodyAccessToken === 'string') {
      const trimmed = bodyAccessToken.trim();
      if (!trimmed) {
        return reply.code(400).send({ error: 'accessToken_invalid' });
      }
      googleAccessToken = trimmed;
      tokenFields = {
        googleAccessToken,
        googleTokenExpiresAt: Date.now() + IMPLICIT_TOKEN_TTL_MS,
      };
    } else {
      return reply.code(400).send({ error: 'code_or_accessToken_required' });
    }

    let googleUser;
    try {
      googleUser = await fetchGoogleUserInfo(googleAccessToken);
    } catch (e) {
      request.log.warn(e, 'google userinfo');
      return reply.code(401).send({ error: 'invalid_google_token' });
    }

    const users = db.collection('users');
    const now = new Date();
    const existing = await users.findOne({ googleSub: googleUser.googleSub });

    if (!existing) {
      await users.insertOne({
        googleSub: googleUser.googleSub,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        settings: defaultSettings(),
        ...tokenFields,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await users.updateOne(
        { googleSub: googleUser.googleSub },
        {
          $set: {
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
            ...tokenFields,
            updatedAt: now,
          },
        },
      );
    }

    const user = await users.findOne({ googleSub: googleUser.googleSub });
    const token = signAppJwt(googleUser.googleSub);

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
