# Money Tracker

Personal finance dashboard: net worth over time, monthly changes, burn rate, runway, heatmap, and insights. Data from Google Sheets; login with Google.

## Setup

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Copy env template and fill in your values:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with:
   - `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID (Web application)
   - `VITE_SPREADSHEET_ID` — ID of the first Google Sheet (shown as “Olga” in the switcher)
   - `VITE_SPREADSHEET_ID_2` — (optional) ID of a second Sheet (shown as “Andrea”). If set, a profile switcher appears next to the title.
   - Optional (mortgage card): `VITE_MORTGAGE_END_YEAR` and `VITE_MORTGAGE_END_MONTH` (remaining months are computed automatically), plus `VITE_MORTGAGE_MONTHLY_PAYMENT`, `VITE_OWNERSHIP_SHARE`

3. Run locally:

   ```bash
   npm run dev
   ```

## Tests

```bash
npm test          # run once (also runs on git commit via Husky)
npm run test:watch # watch mode while developing
```

Vitest covers core logic: `parseCSV`, `groupByMonth`, `formatters`, and `computeStatistics` (see `src/utils/*.test.js`).

## Before you push

**Pre-commit (Husky):** each `git commit` runs `npm test` first. If tests fail, the commit is aborted.

To avoid committing secrets or personal data, run:

```bash
npm run check-safe
```

This checks that `.env` and `public/data.csv` are not staged. Never commit `.env` — use GitHub Actions secrets for deployment.

## Deploy (e.g. GitHub Pages)

- Add the same env vars as **Repository secrets** (Settings → Secrets and variables → Actions).
- Push to `main`; the workflow builds and deploys. The site will be at `https://<user>.github.io/<repo>/`.

## Stack

React, Vite, Tailwind CSS, Recharts. Google Identity Services + Google Sheets API for auth and data.
