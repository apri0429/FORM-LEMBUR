require('dotenv').config();
const express = require('express');
const cors = require('cors');
const os = require('os');
const pool = require('./config/db');
const lemburRoutes = require('./routes/lembur');
const karyawanRoutes = require('./routes/karyawan');
const authRoutes = require('./routes/auth');
const laporanRoutes = require('./routes/laporan');
const authMiddleware = require('./middleware/auth');

// Migration: tambah kolom talenta_input jika belum ada
pool.query('ALTER TABLE lembur_entries ADD COLUMN talenta_input TINYINT(1) NOT NULL DEFAULT 0')
  .then(() => console.log('[Migration] Kolom talenta_input ditambahkan.'))
  .catch(err => {
    if (err.code !== 'ER_DUP_FIELDNAME') console.error('[Migration]', err.message);
  });

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

function getLocalIps() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((network) => network && network.family === 'IPv4' && !network.internal)
    .map((network) => network.address);
}

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/lembur', authMiddleware, lemburRoutes);
app.use('/api/karyawan', authMiddleware, karyawanRoutes);
app.use('/api/laporan', authMiddleware, laporanRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Form Lembur API berjalan', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  getLocalIps().forEach((ip) => {
    console.log(`Akses LAN: http://${ip}:${PORT}`);
  });
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} sudah dipakai. Kemungkinan backend sudah berjalan.`);
    console.log(`Cek backend: http://localhost:${PORT}/api/health`);
    getLocalIps().forEach((ip) => {
      console.log(`Cek dari jaringan lokal: http://${ip}:${PORT}/api/health`);
    });
    process.exit(0);
  }

  throw error;
});
