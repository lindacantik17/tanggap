// ============================================================================
// index.js — Titik masuk (entry point) server backend TANGGAP.
//
// ALUR STARTUP:
//   1. Baca konfigurasi (config.js).
//   2. Inisialisasi database: buat tabel kalau belum ada (initDb).
//   3. Kalau tabel users masih kosong, isi data demo (seed) supaya aplikasi
//      langsung bisa dicoba tanpa daftar manual.
//   4. Buat aplikasi Express, pasang middleware (CORS, JSON parser).
//   5. Pasang semua router di bawah /api/...
//   6. Jalankan server di port yang dikonfigurasi.
//
// CARA MENJALANKAN:
//   npm start          (dari folder backend/)
//   npm run dev        (restart otomatis saat file berubah — untuk belajar)
//
// AKUN DEMO (dibuat otomatis oleh seed):
//   admin    / admin123    (role admin/teknisi)
//   petugas1 / petugas123  (role petugas)
//   petugas2 / petugas123  (role petugas)
// ============================================================================

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import db, { initDb } from './db/database.js';
import { seed } from './db/seed.js';
import authRoutes from './routes/auth.js';
import laporanRoutes from './routes/laporan.js';
import dashboardRoutes from './routes/dashboard.js';
import notifikasiRoutes from './routes/notifikasi.js';

// 1. Siapkan database (buat tabel kalau belum ada).
initDb();

// 2. Isi data demo kalau database masih kosong (belum ada user sama sekali).
//    Ini yang membuat Linda langsung bisa login dan melihat 7 laporan contoh
//    saat pertama kali menjalankan, tanpa harus isi manual.
const jumlahUser = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
if (jumlahUser === 0) {
  seed();
}

// 3. Buat aplikasi Express.
const app = express();

// CORS: mengizinkan frontend (Vite, port 5173) memanggil API ini.
// Tanpa CORS, browser akan memblokir request dari origin yang berbeda
// (frontend di :5173, backend di :3001 = origin berbeda).
app.use(cors());

// Middleware JSON: membaca body request yang dikirim sebagai JSON
// (misal saat login / membuat laporan) dan mengubahnya menjadi req.body.
app.use(express.json());

// 4. Route kesehatan server — untuk mengecek server hidup atau tidak.
//    Buka http://localhost:3001/health di browser, harus muncul {"status":"ok"}.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', aplikasi: 'TANGGAP', waktu: new Date().toISOString() });
});

// 5. Semua route API.
app.use('/api/auth', authRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifikasi', notifikasiRoutes);

// 6. Daftar referensi (sistem, jenis error, prioritas, status) — dipakai
//    frontend untuk mengisi dropdown di form lapor. Disimpan di satu tempat
//    supaya backend & frontend tidak punya daftar yang berbeda.
import { DAFTAR_SISTEM, JENIS_ERROR, DAFTAR_PRIORITAS, DAFTAR_STATUS } from './db/seed.js';
app.get('/api/referensi', (req, res) => {
  res.json({ data: { sistem: DAFTAR_SISTEM, jenisError: JENIS_ERROR, prioritas: DAFTAR_PRIORITAS, status: DAFTAR_STATUS } });
});

// 7. Handler 404 untuk route API yang tidak dikenal.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});

// 8. Sajikan frontend (opsional, untuk deploy satu server).
//    Kalau folder frontend/dist ADA (hasil `npm run build` di folder
//    frontend), Express ikut menyajikan file statisnya. Dengan begitu satu
//    server bisa melayani API + halaman web sekaligus — ini yang dipakai
//    saat deploy ke Render (satu Web Service saja, tanpa CORS).
//    Kalau folder dist TIDAK ada (mode belajar lokal), bagian ini diam saja
//    dan frontend tetap disajikan oleh Vite dev server di port 5173.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  // File statis: JS, CSS, gambar hasil build.
  app.use(express.static(frontendDist));
  // SPA fallback: semua route halaman (misal /laporan, /admin) dikembalikan
  // ke index.html supaya React Router yang menanganinya. Route /api sudah
  // ditangani di atas, jadi tidak sampai ke sini.
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  console.log('  Frontend disajikan dari:', frontendDist);
}

// 9. Jalankan server — hanya kalau file ini dijalankan langsung
//    (`node src/index.js`, misal lewat `npm start`).
//    Kalau file ini DIIMPOR (misal oleh api/index.js untuk Vercel
//    serverless), server tidak dijalankan; platform yang memanggil
//    aplikasi Express ini per request.
const dijalankanLangsung =
  process.argv[1] === fileURLToPath(import.meta.url);
if (dijalankanLangsung) {
  app.listen(config.port, config.host, () => {
    console.log('');
    console.log('  TANGGAP Backend berjalan');
    console.log(`  http://${config.host}:${config.port}`);
    console.log('  Akun demo: admin/admin123 (admin), petugas1/petugas123 (petugas)');
    console.log('');
  });
}

// Ekspor aplikasi supaya bisa dipakai sebagai serverless function
// (Vercel) tanpa mengubah perilaku saat dijalankan biasa.
export default app;
