import { spawn } from 'node:child_process';

console.log('Starting ResolveAI Backend and Frontend concurrently...\n');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const server = spawn(npmCmd, ['run', 'dev', '--workspace=server'], {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

const client = spawn(npmCmd, ['run', 'dev', '--workspace=client'], {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

function cleanup() {
  try {
    server.kill('SIGTERM');
    client.kill('SIGTERM');
  } catch {
    // Ignore error on teardown
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

server.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[Server] Exited with code ${code}`);
  }
});

client.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[Client] Exited with code ${code}`);
  }
});
