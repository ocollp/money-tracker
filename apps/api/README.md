# money-tracker-api

Minimal Fastify server for future auth, user profiles, and stored sheet configuration.

## Run locally

```bash
# from repo root
npm run dev:api
```

Default URL: `http://localhost:3001`  
Health check: `GET /health`

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port |
| `HOST` | `0.0.0.0` | Bind address |

## Next steps

- Add Postgres (or SQLite) and migrations
- `POST /auth/register`, `POST /auth/login`, session or JWT
- `GET/PATCH /me` or `/profile` for primary/secondary sheet IDs and labels
- CORS allowlist for the GitHub Pages / Vite dev origin
