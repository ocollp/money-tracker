import { getDb } from '../db.js';
import { fetchGoogleUserInfo } from '../lib/googleUser.js';
import { signAppJwt } from '../lib/jwt.js';
import { defaultSettings } from '../lib/userModel.js';

export async function authRoutes(fastify) {
  fastify.post('/google', async (request, reply) => {
    const db = getDb();
    if (!db) {
      return reply.code(503).send({ error: 'database_not_configured' });
    }

    const { accessToken } = request.body || {};
    if (!accessToken || typeof accessToken !== 'string') {
      return reply.code(400).send({ error: 'accessToken_required' });
    }

    let googleUser;
    try {
      googleUser = await fetchGoogleUserInfo(accessToken);
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
            updatedAt: now,
          },
        }
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
