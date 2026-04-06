import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import { clearTestDb, setTestDb } from '../src/db.js';
import { createMemoryDb } from './helpers/memoryDb.js';

vi.mock('../src/lib/googleTokens.js', () => ({
  exchangeCodeForTokens: vi.fn().mockResolvedValue({
    accessToken: 'mock-google-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Date.now() + 3600 * 1000,
  }),
  refreshAccessToken: vi.fn(),
  getValidAccessToken: vi.fn(),
}));

describe('app', () => {
  let app;

  afterEach(async () => {
    clearTestDb();
    vi.unstubAllGlobals();
    if (app) {
      await app.close();
      app = null;
    }
  });

  describe('without database (getDb() is null)', () => {
    beforeEach(async () => {
      setTestDb(null);
      app = await buildApp({ logger: false });
    });

    describe('GET /health', () => {
      it('returns ok and db false', async () => {
        const res = await app.inject({ method: 'GET', url: '/health' });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body.ok).toBe(true);
        expect(body.db).toBe(false);
      });
    });

    describe('POST /auth/google', () => {
      it('returns 503 database_not_configured', async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/auth/google',
          payload: { code: 'any' },
        });
        expect(res.statusCode).toBe(503);
        expect(JSON.parse(res.body).error).toBe('database_not_configured');
      });
    });
  });

  describe('with in-memory database', () => {
    beforeEach(async () => {
      setTestDb(createMemoryDb());
      app = await buildApp({ logger: false });
    });

    describe('POST /auth/google', () => {
      it('returns 400 when code and accessToken are missing', async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/auth/google',
          payload: {},
        });
        expect(res.statusCode).toBe(400);
        expect(JSON.parse(res.body).error).toBe('code_or_accessToken_required');
      });

      it('accepts accessToken (implicit flow) and returns JWT + user', async () => {
        vi.stubGlobal(
          'fetch',
          vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
              sub: 'sub-implicit',
              email: 'implicit@test.com',
              name: 'Implicit',
              picture: null,
            }),
          })
        );

        const res = await app.inject({
          method: 'POST',
          url: '/auth/google',
          payload: { accessToken: 'ya29.mock-access-token' },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body.token).toBeTruthy();
        expect(body.user.email).toBe('implicit@test.com');
        expect(body.settings.spreadsheetId).toBeNull();
      });

      it('returns 401 invalid_google_token when userinfo fails', async () => {
        vi.stubGlobal(
          'fetch',
          vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            text: async () => 'unauthorized',
          })
        );

        const res = await app.inject({
          method: 'POST',
          url: '/auth/google',
          payload: { code: 'bad' },
        });
        expect(res.statusCode).toBe(401);
        expect(JSON.parse(res.body).error).toBe('invalid_google_token');
      });

      it('creates user, default settings, and returns JWT + user', async () => {
        vi.stubGlobal(
          'fetch',
          vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
              sub: 'sub-new',
              email: 'a@b.com',
              name: 'Alice',
              picture: 'https://x/y.png',
            }),
          })
        );

        const res = await app.inject({
          method: 'POST',
          url: '/auth/google',
          payload: { code: 'good-code' },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body.token).toBeTruthy();
        expect(body.user.email).toBe('a@b.com');
        expect(body.user.name).toBe('Alice');
        expect(body.settings.spreadsheetId).toBeNull();
      });

      it('updates profile fields on repeat login for same googleSub', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: 'sub-same',
            email: 'old@b.com',
            name: 'Old',
            picture: null,
          }),
        });

        let res = await app.inject({
          method: 'POST',
          url: '/auth/google',
          payload: { code: 'c1' },
        });
        expect(res.statusCode).toBe(200);

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: 'sub-same',
            email: 'new@b.com',
            name: 'New',
            picture: 'https://pic',
          }),
        });

        res = await app.inject({
          method: 'POST',
          url: '/auth/google',
          payload: { code: 'c2' },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body.user.email).toBe('new@b.com');
        expect(body.user.name).toBe('New');
      });
    });

    describe('GET /me', () => {
      it('returns 401 when Authorization header is missing', async () => {
        const res = await app.inject({ method: 'GET', url: '/me' });
        expect(res.statusCode).toBe(401);
      });

      it('returns 401 when Bearer token is not a valid JWT', async () => {
        const res = await app.inject({
          method: 'GET',
          url: '/me',
          headers: { authorization: 'Bearer not.valid.jwt' },
        });
        expect(res.statusCode).toBe(401);
      });

      it('returns user and settings after successful /auth/google', async () => {
        vi.stubGlobal(
          'fetch',
          vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
              sub: 'me-user',
              email: 'me@test.com',
              name: 'Me',
              picture: null,
            }),
          })
        );

        const authRes = await app.inject({
          method: 'POST',
          url: '/auth/google',
          payload: { code: 'tok' },
        });
        const { token } = JSON.parse(authRes.body);

        const res = await app.inject({
          method: 'GET',
          url: '/me',
          headers: { authorization: `Bearer ${token}` },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body.user.email).toBe('me@test.com');
        expect(body.settings).toBeDefined();
      });
    });

    describe('PATCH /me', () => {
      it('returns 400 no_valid_fields when body has no allowed keys', async () => {
        vi.stubGlobal(
          'fetch',
          vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
              sub: 'patch-user',
              email: 'p@test.com',
              name: 'P',
              picture: null,
            }),
          })
        );

        const authRes = await app.inject({
          method: 'POST',
          url: '/auth/google',
          payload: { code: 'tok' },
        });
        const { token } = JSON.parse(authRes.body);

        const res = await app.inject({
          method: 'PATCH',
          url: '/me',
          headers: { authorization: `Bearer ${token}` },
          payload: { notAField: 1 },
        });
        expect(res.statusCode).toBe(400);
      });

      it('merges settings and persists for subsequent GET /me', async () => {
        vi.stubGlobal(
          'fetch',
          vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
              sub: 'merge-user',
              email: 'm@test.com',
              name: 'M',
              picture: null,
            }),
          })
        );

        const authRes = await app.inject({
          method: 'POST',
          url: '/auth/google',
          payload: { code: 'tok' },
        });
        const { token } = JSON.parse(authRes.body);

        const res = await app.inject({
          method: 'PATCH',
          url: '/me',
          headers: { authorization: `Bearer ${token}` },
          payload: {
            spreadsheetId: 'sheet-1',
            mortgageEndYear: 2040,
          },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body.settings.spreadsheetId).toBe('sheet-1');
        expect(body.settings.mortgageEndYear).toBe(2040);
        expect(body.settings.spreadsheetId2).toBeNull();

        const getRes = await app.inject({
          method: 'GET',
          url: '/me',
          headers: { authorization: `Bearer ${token}` },
        });
        const persisted = JSON.parse(getRes.body);
        expect(persisted.settings.spreadsheetId).toBe('sheet-1');
      });
    });
  });
});
