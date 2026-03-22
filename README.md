# Money Tracker

Personal finance dashboard: net worth over time, monthly changes, burn rate, runway, heatmap, and insights. Data from Google Sheets; login with Google.

**Monorepo:** `apps/web` (Vite + React) · `apps/api` (Fastify placeholder for future auth & profile API).

## Setup

1. Clone the repo and install dependencies (workspaces install web + api):

   ```bash
   npm install
   ```

2. Copy env template for the **web** app and fill in your values:

   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

   Edit `apps/web/.env` with:
   - `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID (Web application)
   - `VITE_SPREADSHEET_ID` — ID of the first Google Sheet (primary profile)
   - `VITE_SPREADSHEET_ID_2` — (optional) ID of a second Sheet (secondary profile). If set, a profile switcher appears next to the title.
   - Optional: `VITE_PROFILE_PRIMARY_LABEL`, `VITE_PROFILE_SECONDARY_LABEL`, `VITE_PROFILE_PRIMARY_EMOJI`, `VITE_PROFILE_SECONDARY_EMOJI` — customize switcher text and icons (defaults: Olga / Andrea with existing emojis). Internal profile IDs are `primary` and `secondary` for future API-driven config.
   - Optional (mortgage card): `VITE_MORTGAGE_END_YEAR` and `VITE_MORTGAGE_END_MONTH` (remaining months are computed automatically), plus `VITE_MORTGAGE_MONTHLY_PAYMENT`, `VITE_OWNERSHIP_SHARE`

3. Run locally:

   ```bash
   npm run dev          # Vite dev server (apps/web)
   npm run dev:api      # API placeholder on http://localhost:3001
   ```

## Tests

```bash
npm test           # run once (also runs on git commit via Husky)
npm run test:watch # watch mode while developing
```

Vitest covers core logic under `apps/web/src/utils/*.test.js`.

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

The API (`apps/api`) is not deployed by this workflow; host it separately (Railway, Fly.io, etc.) when you add real endpoints.

## Stack

**Web:** React, Vite, Tailwind CSS, Recharts. Google Identity Services + Google Sheets API for auth and data.

**API:** Fastify (skeleton — see `apps/api/README.md`).
