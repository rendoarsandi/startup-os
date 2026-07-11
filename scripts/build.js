const { spawnSync } = require('child_process');

function isCommandAvailable(cmd) {
  try {
    const shell = process.platform === 'win32' ? true : '/bin/sh';
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    const result = spawnSync(checkCmd, { shell, stdio: 'ignore' });
    return result.status === 0;
  } catch (e) {
    return false;
  }
}

const hasBun = isCommandAvailable('bun');
const shell = process.platform === 'win32' ? true : '/bin/sh';

if (hasBun) {
  console.log('[Resilient Build] Bun detected! Running build using Bun workspaces...');
  const result = spawnSync('bun run --filter web build', { shell, stdio: 'inherit' });
  process.exit(result.status ?? 0);
} else {
  console.log('[Resilient Build] Bun not found in PATH. Falling back to NPM/Node...');
  const result = spawnSync('npm run build --workspace=web', { shell, stdio: 'inherit' });
  process.exit(result.status ?? 0);
}
