// ============================================================================
// api/index.js — Entry point untuk deploy Vercel (serverless).
//
// Vercel menjalankan file di folder api/ sebagai serverless function.
// File ini mengimpor aplikasi Express dari backend lalu mengekspornya,
// supaya Vercel memanggilnya setiap ada request ke /api/* (lihat
// vercel.json: rewrite /api/:path* ke /api/index; path asli /api/...
// diteruskan utuh ke Express, jadi route di backend tidak berubah).
//
// PENTING: file ini TIDAK memanggil app.listen(). Guard di
// backend/src/index.js memastikan server hanya jalan kalau file itu
// dieksekusi langsung (npm start), bukan saat diimpor dari sini.
//
// ENV VAR YANG WAJIB DIISI DI DASHBOARD VERCEL:
//   DB_PATH=/tmp/tanggap.db  (satu-satunya folder yang bisa ditulis di
//                              serverless; database dibuat + di-seed otomatis
//                              tiap cold start, lalu kembali ke 7 laporan
//                              contoh — sama seperti restart di Render free)
//   JWT_SECRET=<string acak> (ganti secret default; wajib untuk deploy)
//   NODE_ENV=production
//   HOST=0.0.0.0
// ============================================================================

import app from '../backend/src/index.js';

export default app;
