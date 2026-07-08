import { execSync } from 'node:child_process';

const ports = [3001, 5174, 5173, 5175, 5176];

function sh(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8').trim();
}

function killPort(port) {
  try {
    const out = sh(`lsof -t -iTCP:${port} -sTCP:LISTEN || true`);
    if (!out) return;
    const pids = [...new Set(out.split(/\s+/).filter(Boolean))];
    if (!pids.length) return;
    execSync(`kill ${pids.join(' ')}`, { stdio: 'ignore' });
  } catch {
    // Best-effort only.
  }
}

for (const port of ports) killPort(port);

