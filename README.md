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
   - `VITE_SPREADSHEET_ID` — ID of your Google Sheet (from the sheet URL)
   - Optional (mortgage card): `VITE_MORTGAGE_END_YEAR` and `VITE_MORTGAGE_END_MONTH` (remaining months are computed automatically), or `VITE_MORTGAGE_REMAINING_MONTHS`; plus `VITE_MORTGAGE_MONTHLY_PAYMENT`, `VITE_OWNERSHIP_SHARE`

3. Run locally:

   ```bash
   npm run dev
   ```

## Before you push

To avoid committing secrets or personal data, run:

```bash
npm run check-safe
```

This checks that `.env` and `public/data.csv` are not staged. Run it before `git commit` (or add it to a pre-commit hook). Never commit `.env` — use GitHub Actions secrets for deployment.

## Deploy (e.g. GitHub Pages)

- Add the same env vars as **Repository secrets** (Settings → Secrets and variables → Actions).
- Push to `main`; the workflow builds and deploys. The site will be at `https://<user>.github.io/<repo>/`.

## Stack

React, Vite, Tailwind CSS, Recharts. Google Identity Services + Google Sheets API for auth and data.
