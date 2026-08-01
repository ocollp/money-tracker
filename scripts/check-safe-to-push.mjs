#!/usr/bin/env node
import { execSync } from 'child_process';

const FORBIDDEN = ['.env', 'public/data.csv', 'apps/web/.env', 'apps/web/public/data.csv'];
const staged = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
  .trim()
  .split('\n')
  .filter(Boolean);

const bad = staged.filter((f) => {
  if (f.endsWith('.env.example')) return false;
  return FORBIDDEN.includes(f) || f.startsWith('.env') || f.includes('/.env');
});
if (bad.length) {
  console.error('❌ Do not commit these files:', bad.join(', '));
  process.exit(1);
}
console.log('✅ No sensitive files in this commit.');
