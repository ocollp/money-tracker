# money-tracker-api

Fastify API: Google access token → verify with Google userinfo → upsert user in MongoDB → return **app JWT**. Web stores JWT and calls `GET/PATCH /me` for sheet IDs, labels, mortgage options, etc.

## Run locally

```bash
# from repo root
cp apps/api/.env.example apps/api/.env   # edit values
npm run dev:api
```

Default URL: `http://localhost:3001`  
Health: `GET /health` (includes `db: true|false`)

## Tests

```bash
npm run test -w money-tracker-api
# or from repo root (runs web + api)
npm test
```

Vitest + `fastify.inject()`, in-memory DB stub, mocked `fetch` for Google userinfo. No Mongo required.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/google` | — | Body `{ "code", "redirect_uri" }` (GIS popup: `redirect_uri` = page origin, e.g. `http://localhost:5174`) or `{ "accessToken" }` (implicit) → `{ token, user, settings }` |
| `GET` | `/me` | Bearer app JWT | Current user + settings |
| `PATCH` | `/me` | Bearer app JWT | Partial settings merge (allowed keys in `userModel`) |

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port |
| `HOST` | `0.0.0.0` | Bind address |
| `MONGODB_URI` | — | If unset, DB is disabled; `/auth/google` responds `503` |
| `MONGODB_DB_NAME` | `money_tracker` | Database name |
| `JWT_SECRET` | — | **Required** when `MONGODB_URI` is set |
| `JWT_EXPIRES_IN` | `7d` | App JWT expiry (jsonwebtoken string) |
| `CORS_ORIGIN` | `*` | Comma-separated allowed origins for the web app. Must include each dev origin (e.g. `http://localhost:5174`) and your production site origin — the same values must appear in **Google Cloud Console → OAuth 2.0 Client → Authorized JavaScript origins** and **Authorized redirect URIs** (GIS code flow uses the page origin as `redirect_uri` when exchanging the code, not `postmessage`). |

## Web app

Set `VITE_API_URL` (no trailing slash) in `apps/web/.env` to the API base URL, or omit it in dev to use the Vite proxy. The Google OAuth client must include scopes `openid email profile` (plus Sheets) so the same token works with userinfo.
