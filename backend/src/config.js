// ============================================================================
// config.js — Semua pengaturan aplikasi TANGGAP dikumpulkan di satu tempat.
//
// KENAPA ADA FILE INI?
// Supaya kalau mau ganti port, secret JWT, atau lokasi database, cukup ubah
// di sini (atau lewat file .env), tidak perlu mengobrak-abrik file lain.
// Ini pola yang bagus: "configuration in one place".
// ============================================================================

import 'dotenv/config'; // Membaca file .env (kalau ada) ke process.env
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// __dirname tidak tersedia di ESM (type: "module"), jadi dibuat manual.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  // Port backend. Frontend Vite nanti mem-proxy request /api ke port ini.
  // Bisa diubah lewat .env: PORT=3001
  port: Number(process.env.PORT || 3001),

  // Alamat host. 127.0.0.1 = hanya bisa diakses dari laptop sendiri (aman
  // untuk belajar). Kalau mau diakses dari HP di WiFi yang sama, ubah ke
  // 0.0.0.0 lewat .env: HOST=0.0.0.0
  host: process.env.HOST || '127.0.0.1',

  // Kunci rahasia untuk menandatangani token JWT.
  // PENTING: di proyek sungguhan, JANGAN tulis secret langsung di kode.
  // Di sini ada nilai default supaya Linda bisa langsung menjalankan tanpa
  // setup .env dulu, tapi kalau deploy beneran wajib ganti lewat .env!
  jwtSecret: process.env.JWT_SECRET || 'tanggap-belajar-rahasia-jangan-dipakai-produksi',

  // Masa berlaku token login: 8 jam. Setelah itu user harus login ulang.
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',

  // Lokasi file database SQLite. Satu file = satu database utuh.
  // Bisa diubah lewat .env: DB_PATH=/lokasi/lain/tanggap.db
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'tanggap.db'),
};
