# Cara Menjalankan Aplikasi Form Lembur

## Struktur Project
```
FORM LEMBUR/
├── backend/          ← Server Node.js + Express (Port 5000)
├── frontend/         ← React + MUI (Port 3000)
└── CARA MENJALANKAN.md
```

## Langkah Menjalankan

### Jalankan otomatis untuk akses IP lokal/LAN
Jalankan dari folder utama `FORM LEMBUR`:
```bash
npm run lan
```
Command ini otomatis mendeteksi IP lokal, menjalankan backend dan frontend, lalu menampilkan URL seperti:
```bash
http://192.168.x.x:3000
```
Gunakan URL itu dari device lain yang tersambung ke jaringan/Wi-Fi yang sama.

### 1. Jalankan Backend (Terminal 1)
```bash
cd backend
npm start
```
Server akan berjalan di: http://localhost:5000

### 2. Jalankan Frontend (Terminal 2)
```bash
cd frontend
npm start
```
Aplikasi akan terbuka otomatis di: http://localhost:3000

---

## Fitur Aplikasi
- **Dashboard** — Tampilkan semua form lembur, statistik, filter & search
- **Buat Form Baru** — Input form lembur dengan tabel entri dinamis
- **Detail Form** — Lihat detail lengkap, approval/tolak form
- **Edit Form** — Ubah data form yang sudah ada
- **Hapus Form** — Hapus form dari sistem

## API Endpoints (Backend)
| Method | Endpoint | Keterangan |
|--------|----------|-----------|
| GET | /api/lembur | Daftar semua form |
| GET | /api/lembur/stats | Statistik form |
| GET | /api/lembur/:id | Detail form |
| POST | /api/lembur | Buat form baru |
| PUT | /api/lembur/:id | Update form |
| PATCH | /api/lembur/:id/status | Update status |
| DELETE | /api/lembur/:id | Hapus form |
