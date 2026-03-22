# Money Tracker

Personal finance dashboard: net worth over time, monthly changes, burn rate, runway, heatmap, and insights. Data from Google Sheets; login with Google.

**Monorepo:** `apps/web` (Vite + React) · `apps/api` (Fastify + MongoDB + JWT for profile/settings sync).

## Setup

1. Clone the repo and install dependencies (workspaces install web + api):

   ```bash
   npm install
   ```

2. Copy env template for the **web** app and fill in your values:

   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

   You can also keep a single `.env` at the **repository root** (same folder as `package.json`); Vite merges `VITE_*` from root **and** `apps/web/.env`, with the web app file winning on conflicts.

   Edit your `.env` (root or `apps/web/`) with:
   - `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID (Web application)
   - `VITE_SPREADSHEET_ID` — ID of the first Google Sheet (primary profile)
   - `VITE_SPREADSHEET_ID_2` — (optional) ID of a second Sheet (secondary profile). If set, a profile switcher appears next to the title.
   - Optional: `VITE_PROFILE_PRIMARY_LABEL`, `VITE_PROFILE_SECONDARY_LABEL`, `VITE_PROFILE_PRIMARY_EMOJI`, `VITE_PROFILE_SECONDARY_EMOJI` — customize switcher text and icons (defaults: Olga / Andrea with existing emojis). Internal profile IDs are `primary` and `secondary` for future API-driven config.
   - Optional (mortgage card): `VITE_MORTGAGE_END_YEAR` and `VITE_MORTGAGE_END_MONTH` (remaining months are computed automatically), plus `VITE_MORTGAGE_MONTHLY_PAYMENT`, `VITE_OWNERSHIP_SHARE`
   - Optional: `VITE_API_URL` — base URL of the API (e.g. `http://localhost:3001`). When set, after Google login the app exchanges the Google token for an app JWT and can load/save profile settings from MongoDB. If the API has no DB configured, the web app falls back to env-only config.

3. **Optional — API + MongoDB** for stored settings:

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

   Set `MONGODB_URI`, `JWT_SECRET`, and `CORS_ORIGIN` (your Vite origin). See `apps/api/README.md`.

4. Run locally:

   ```bash
   npm run dev          # Vite dev server (apps/web)
   npm run dev:api      # API on http://localhost:3001 (needs .env if using MongoDB)
   ```

## Tests

```bash
npm test           # run once (also runs on git commit via Husky)
npm run test:watch # watch mode while developing
```

Vitest covers `apps/web/src/utils/*.test.js` and the API under `apps/api/test/*.test.js` (no Mongo needed for API tests).

## Before you push

**Pre-commit (Husky):** each `git commit` runs `npm test` first. If tests fail, the commit is aborted.

To avoid committing secrets or personal data, run:

```bash
npm run check-safe
```

This checks that `.env` / `apps/web/.env` and `public/data.csv` are not staged. Never commit `.env` — use GitHub Actions secrets for deployment.

## Deploy (e.g. GitHub Pages)

- Add the same env vars as **Repository secrets** (Settings → Secrets and variables → Actions).
- Push to `main`; the workflow builds `apps/web` and deploys. The site will be at `https://<user>.github.io/<repo>/`.

The API (`apps/api`) is not deployed by this workflow; host it separately (Railway, Fly.io, etc.) and set `VITE_API_URL` in your Pages build secrets if you want JWT-backed settings in production.

## Stack

**Web:** React, Vite, Tailwind CSS, Recharts. Google Identity Services + Google Sheets API for auth and data.

**API:** Fastify, MongoDB, JWT — see `apps/api/README.md`.
