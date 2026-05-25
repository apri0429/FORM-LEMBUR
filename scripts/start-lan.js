const { spawn, spawnSync } = require('child_process');
const net = require('net');
const os = require('os');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function getLanIp() {
  const networks = Object.values(os.networkInterfaces()).flat();
  const addresses = networks
    .filter((network) => network && network.family === 'IPv4' && !network.internal)
    .map((network) => network.address);

  return (
    addresses.find((ip) => ip.startsWith('192.168.')) ||
    addresses.find((ip) => ip.startsWith('10.')) ||
    addresses.find((ip) => /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) ||
    addresses[0] ||
    'localhost'
  );
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, '0.0.0.0');
  });
}

function prefixOutput(name, stream) {
  stream.on('data', (chunk) => {
    String(chunk)
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach((line) => console.log(`[${name}] ${line}`));
  });
}

function startApp(name, folder, env) {
  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'cmd.exe' : 'npm';
  const args = isWindows ? ['/d', '/s', '/c', 'npm.cmd start'] : ['start'];

  const child = spawn(command, args, {
    cwd: path.join(rootDir, folder),
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  prefixOutput(name, child.stdout);
  prefixOutput(name, child.stderr);

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`[${name}] berhenti dengan kode ${code}`);
    }
  });

  child.on('error', (error) => {
    console.log(`[${name}] gagal start: ${error.message}`);
  });

  return child;
}

async function main() {
  const ip = getLanIp();
  const backendPort = Number(process.env.BACKEND_PORT || process.env.PORT || 5000);
  const frontendPort = Number(process.env.FRONTEND_PORT || 3000);

  console.log('Menyiapkan akses LAN Form Lembur...');
  console.log(`Frontend: http://${ip}:${frontendPort}`);
  console.log(`Backend : http://${ip}:${backendPort}/api/health`);
  console.log('');

  const children = [];

  if (await isPortFree(backendPort)) {
    children.push(startApp('backend', 'backend', {
      HOST: '0.0.0.0',
      PORT: String(backendPort),
    }));
  } else {
    console.log(`[backend] port ${backendPort} sudah jalan, pakai server yang ada.`);
  }

  if (await isPortFree(frontendPort)) {
    children.push(startApp('frontend', 'frontend', {
      BROWSER: 'none',
      HOST: '0.0.0.0',
      PORT: String(frontendPort),
    }));
  } else {
    console.log(`[frontend] port ${frontendPort} sudah jalan, pakai server yang ada.`);
  }

  if (children.length === 0) {
    console.log('');
    console.log('Semua server sudah berjalan. Buka URL frontend di atas.');
    return;
  }

  console.log('');
  console.log('Biarkan terminal ini tetap terbuka selama aplikasi dipakai.');

  const stop = () => {
    children.forEach((child) => {
      if (child.killed) return;
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    });
    process.exit(0);
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
