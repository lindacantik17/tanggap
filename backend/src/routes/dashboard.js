// ============================================================================
// routes/dashboard.js — Endpoint statistik untuk dashboard.
//
// ENDPOINT:
//   GET /api/dashboard/ringkasan
//
// Mengembalikan angka-angka yang ditampilkan sebagai kartu di dashboard:
//   - total laporan & jumlah per status (berapa masih terbuka, berapa selesai)
//   - jumlah per sistem (SIAK berapa laporan, jaringan berapa, dst.)
//   - jumlah per prioritas (berapa Darurat, Tinggi, dst.)
//   - laporan terbaru (5 terakhir, untuk daftar "Aktivitas Terakhir")
//
// CARA KERJA:
// COUNT + GROUP BY di SQL jauh lebih efisien daripada mengambil semua
// laporan lalu menghitung di JavaScript. Biarkan database yang bekerja.
// ============================================================================

import express from 'express';
import db from '../db/database.js';
import { wajibLogin } from '../middleware/auth.js';

const router = express.Router();

router.use(wajibLogin);

router.get('/ringkasan', (req, res) => {
  // 1. Total laporan.
  const total = db.prepare('SELECT COUNT(*) AS n FROM laporan').get().n;

  // 2. Jumlah per status. Hasilnya diubah menjadi objek, misal:
  //    { Dilaporkan: 3, Diverifikasi: 1, 'Sedang Diperbaiki': 2, Selesai: 5 }
  const perStatus = {};
  for (const row of db.prepare('SELECT status, COUNT(*) AS n FROM laporan GROUP BY status').all()) {
    perStatus[row.status] = row.n;
  }

  // 3. Jumlah per sistem.
  const perSistem = {};
  for (const row of db.prepare('SELECT sistem, COUNT(*) AS n FROM laporan GROUP BY sistem').all()) {
    perSistem[row.sistem] = row.n;
  }

  // 4. Jumlah per prioritas.
  const perPrioritas = {};
  for (const row of db.prepare('SELECT prioritas, COUNT(*) AS n FROM laporan GROUP BY prioritas').all()) {
    perPrioritas[row.prioritas] = row.n;
  }

  // 5. Laporan masih terbuka = belum Selesai. Ini angka yang paling penting
  //    untuk petugas: "ada berapa error yang belum beres?"
  const terbuka = db.prepare(`SELECT COUNT(*) AS n FROM laporan WHERE status != 'Selesai'`).get().n;

  // 6. Laporan terbaru (5 terakhir).
  const terbaru = db.prepare(`
    SELECT l.*, u.nama AS pelapor_nama
    FROM laporan l
    JOIN users u ON u.id = l.pelapor_id
    ORDER BY l.created_at DESC
    LIMIT 5
  `).all();

  // 7. Kalau yang login petugas, tambahkan angka "laporan saya".
  const milikSaya = db.prepare('SELECT COUNT(*) AS n FROM laporan WHERE pelapor_id = ?').get(req.user.id).n;

  res.json({
    data: { total, terbuka, perStatus, perSistem, perPrioritas, terbaru, milikSaya },
  });
});

export default router;
