#!/usr/bin/env node
/**
 * Ensures .env and public/data.csv are not staged for commit.
 * Usage: node scripts/check-safe-to-push.js
 * (optional: npm run check-safe before git push)
 */
import { execSync } from 'child_process';

const FORBIDDEN = ['.env', 'public/data.csv'];
const staged = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
  .trim()
  .split('\n')
  .filter(Boolean);

const bad = staged.filter((f) => FORBIDDEN.includes(f) || f.startsWith('.env'));
if (bad.length) {
  console.error('❌ Do not commit these files:', bad.join(', '));
  process.exit(1);
}
console.log('✅ No sensitive files in this commit.');
