require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const os        = require('os');
const pool      = require('./config/db');
const authMw    = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

/* ── Middleware ─────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ── Routes ─────────────────────────────────────────────────── */
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/overtime',  authMw, require('./routes/lembur'));
app.use('/api/employees',authMw, require('./routes/karyawan'));
app.use('/api/laporan', authMw, require('./routes/laporan'));

app.get('/api/health', (_req, res) =>
  res.json({ status: 'OK', message: 'Form Lembur API berjalan', timestamp: new Date().toISOString() })
);

/* ── Startup ─────────────────────────────────────────────────── */
function getLocalIps() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter(n => n && n.family === 'IPv4' && !n.internal)
    .map(n => n.address);
}

async function runMigrations() {
  await pool.query('ALTER TABLE lembur_entries ADD COLUMN talenta_input TINYINT(1) NOT NULL DEFAULT 0')
    .then(() => console.log('[Migration] Kolom talenta_input ditambahkan.'))
    .catch(err => { if (err.code !== 'ER_DUP_FIELDNAME') console.error('[Migration]', err.message); });
}

const server = app.listen(PORT, HOST, async () => {
  await runMigrations();
  console.log(`\nServer berjalan di http://localhost:${PORT}`);
  getLocalIps().forEach(ip => console.log(`Akses LAN: http://${ip}:${PORT}`));
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} sudah dipakai. Backend mungkin sudah berjalan.`);
    getLocalIps().forEach(ip => console.log(`Cek: http://${ip}:${PORT}/api/health`));
    process.exit(0);
  }
  throw err;
});
