import { execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const ports = [3001, 5174, 5173, 5175, 5176];

function listeners(port) {
  try {
    return [...new Set(execFileSync('lsof', ['-t', `-iTCP:${port}`, '-sTCP:LISTEN'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim().split(/\s+/).filter(Boolean).map(Number))];
  } catch (error) {
    if (error.status === 1) return [];
    throw error;
  }
}

function signal(pid, name) {
  try { process.kill(pid, name); } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}

async function releasePort(port) {
  const pids = listeners(port);
  if (!pids.length) return;
  for (const pid of pids) {
    signal(pid, 'SIGTERM');
    // Ctrl+Z suspends signal handling: resume so pending termination can finish.
    signal(pid, 'SIGCONT');
  }
  for (let attempt = 0; attempt < 50; attempt++) {
    if (!listeners(port).length) return;
    await delay(100);
  }
  throw new Error(`Port ${port} is still occupied. Close the previous dev server and retry.`);
}

try {
  await Promise.all(ports.map(releasePort));
} catch (error) {
  console.error(`[dev] ${error.message}`);
  process.exitCode = 1;
}
