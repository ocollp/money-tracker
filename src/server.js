const { spawn } = require('node:child_process');
const path = require('node:path');

const apiRoot = path.join(__dirname, '..', 'apps', 'api');
const entry = path.join(apiRoot, 'src', 'server.js');

const child = spawn(process.execPath, [entry], {
  stdio: 'inherit',
  cwd: apiRoot,
  env: process.env,
});

function forward(signal) {
  try {
    child.kill(signal);
  } catch {}
}
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, forward);
}

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code == null ? 0 : code);
});
