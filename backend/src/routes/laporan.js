// ============================================================================
// routes/laporan.js — Endpoint CRUD laporan error + komentar + riwayat status.
//
// ENDPOINT:
//   GET    /api/laporan                    — daftar laporan (dengan filter)
//   GET    /api/laporan/:id               — detail satu laporan (termasuk
//                                            komentar & riwayat status)
//   POST   /api/laporan                   — buat laporan baru (petugas/admin)
//   PATCH  /api/laporan/:id/status        — ubah status (hanya admin)
//   POST   /api/laporan/:id/komentar      — tambah komentar (petugas/admin)
//   DELETE /api/laporan/:id               — hapus laporan (hanya admin)
//
// ALUR STATUS (state machine):
//   Dilaporkan -> Diverifikasi -> Sedang Diperbaiki -> Selesai
//   Plus jalan kembali satu langkah kalau ternyata info kurang / salah
//   diagnosis. Aturan ini dijaga di TRANSISI_STATUS di bawah — kalau ada
//   yang mencoba lompat status (misal Dilaporkan langsung ke Selesai),
//   server menolak dengan 400. Ini penting supaya riwayat status masuk akal
//   dan tidak ada laporan yang "tiba-tiba selesai" tanpa pernah diperbaiki.
//
// SETIAP PERUBAHAN STATUS:
//   1. Validasi transisi (apakah boleh?).
//   2. Update tabel laporan + updated_at.
//   3. Simpan jejak ke tabel riwayat_status (audit trail).
//   4. Buat notifikasi untuk pelapor.
// Keempat langkah ini dibungkus dalam SATU TRANSAKSI database (db.transaction)
// supaya kalau ada satu langkah gagal, semuanya batal — tidak ada data
// setengah-setengah.
// ============================================================================

import express from 'express';
import db from '../db/database.js';
import { wajibLogin, wajibRole } from '../middleware/auth.js';
import { beritahuSemuaAdmin, buatNotifikasi } from '../utils/notifikasi.js';
import { DAFTAR_SISTEM, JENIS_ERROR, DAFTAR_PRIORITAS, DAFTAR_STATUS } from '../db/seed.js';

const router = express.Router();

// Semua endpoint laporan butuh login (diterapkan sekali untuk seluruh router).
router.use(wajibLogin);

// ---------------------------------------------------------------------------
// TRANSISI_STATUS: status apa saja yang boleh dituju dari status sekarang.
// Kunci = status saat ini, nilai = daftar status yang diizinkan.
// ---------------------------------------------------------------------------
const TRANSISI_STATUS = {
  'Dilaporkan': ['Diverifikasi'],
  'Diverifikasi': ['Sedang Diperbaiki', 'Dilaporkan'],
  'Sedang Diperbaiki': ['Selesai', 'Diverifikasi'],
  'Selesai': ['Diverifikasi'], // dibuka lagi kalau ternyata error muncul kembali
};

// ---------------------------------------------------------------------------
// GET /api/laporan
// Query filter (opsional): ?status=... &sistem=... &prioritas=... &milik=saya
//   - status / sistem / prioritas: filter persis nilainya.
//   - milik=saya: hanya laporan yang dibuat user yang sedang login.
//   - Petugas biasa tetap bisa MELIHAT semua laporan (transparansi di
//     internal Disdukcapil), tapi tombol ubah/hapus hanya untuk admin.
// ---------------------------------------------------------------------------
router.get('/', (req, res) => {
  const { status, sistem, prioritas, milik } = req.query;

  // Query dibangun dinamis: hanya tambahkan kondisi WHERE untuk filter
  // yang benar-benar dikirim. Parameter memakai "?" (prepared statement)
  // supaya aman dari SQL injection — JANGAN pernah menempel input user
  // langsung ke string SQL!
  let sql = `
    SELECT l.*, u.nama AS pelapor_nama, u.username AS pelapor_username
    FROM laporan l
    JOIN users u ON u.id = l.pelapor_id
    WHERE 1 = 1
  `;
  const params = [];
  if (status) { sql += ' AND l.status = ?'; params.push(status); }
  if (sistem) { sql += ' AND l.sistem = ?'; params.push(sistem); }
  if (prioritas) { sql += ' AND l.prioritas = ?'; params.push(prioritas); }
  if (milik === 'saya') { sql += ' AND l.pelapor_id = ?'; params.push(req.user.id); }
  sql += ' ORDER BY l.created_at DESC';

  const rows = db.prepare(sql).all(...params);
  res.json({ data: rows });
});

// ---------------------------------------------------------------------------
// GET /api/laporan/:id — detail lengkap: data laporan + komentar +
// riwayat status. Dipakai halaman detail di frontend.
// ---------------------------------------------------------------------------
router.get('/:id', (req, res) => {
  const laporan = db.prepare(`
    SELECT l.*, u.nama AS pelapor_nama, u.username AS pelapor_username
    FROM laporan l
    JOIN users u ON u.id = l.pelapor_id
    WHERE l.id = ?
  `).get(req.params.id);

  if (!laporan) {
    return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
  }

  const komentar = db.prepare(`
    SELECT k.*, u.nama AS penulis_nama, u.role AS penulis_role
    FROM komentar k
    JOIN users u ON u.id = k.penulis_id
    WHERE k.laporan_id = ?
    ORDER BY k.created_at ASC
  `).all(req.params.id);

  const riwayat = db.prepare(`
    SELECT r.*, u.nama AS diubah_oleh_nama
    FROM riwayat_status r
    JOIN users u ON u.id = r.diubah_oleh_id
    WHERE r.laporan_id = ?
    ORDER BY r.created_at ASC
  `).all(req.params.id);

  res.json({ data: { ...laporan, komentar, riwayat } });
});

// ---------------------------------------------------------------------------
// POST /api/laporan — buat laporan baru.
// Body: { sistem, jenis_error, judul, deskripsi, lokasi, prioritas }
// Kode laporan dibuat otomatis: TGP-001, TGP-002, ... (dari id baris).
// Setelah dibuat, semua admin mendapat notifikasi.
// ---------------------------------------------------------------------------
router.post('/', (req, res) => {
  const { sistem, jenis_error, judul, deskripsi, lokasi, prioritas } = req.body || {};

  // --- Validasi input (jangan percaya input dari client!) ---
  if (!sistem || !DAFTAR_SISTEM.includes(sistem)) {
    return res.status(400).json({ error: `Sistem tidak valid. Pilihan: ${DAFTAR_SISTEM.join(', ')}.` });
  }
  if (!jenis_error || !JENIS_ERROR.includes(jenis_error)) {
    return res.status(400).json({ error: `Jenis error tidak valid. Pilihan: ${JENIS_ERROR.join(', ')}.` });
  }
  if (!judul || judul.trim().length < 5) {
    return res.status(400).json({ error: 'Judul minimal 5 karakter.' });
  }
  if (!deskripsi || deskripsi.trim().length < 10) {
    return res.status(400).json({ error: 'Deskripsi minimal 10 karakter. Jelaskan errornya sedetail mungkin.' });
  }
  if (prioritas && !DAFTAR_PRIORITAS.includes(prioritas)) {
    return res.status(400).json({ error: `Prioritas tidak valid. Pilihan: ${DAFTAR_PRIORITAS.join(', ')}.` });
  }

  // --- Simpan (transaksi: laporan + riwayat awal + notifikasi admin) ---
  const buat = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO laporan (pelapor_id, sistem, jenis_error, judul, deskripsi, lokasi, prioritas)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, sistem, jenis_error, judul.trim(), deskripsi.trim(),
      (lokasi || '-').trim(), prioritas || 'Sedang',
    );

    const kode = `TGP-${String(info.lastInsertRowid).padStart(3, '0')}`;
    db.prepare('UPDATE laporan SET kode = ? WHERE id = ?').run(kode, info.lastInsertRowid);

    // Riwayat awal: laporan dibuat dengan status Dilaporkan.
    db.prepare(`
      INSERT INTO riwayat_status (laporan_id, status_lama, status_baru, diubah_oleh_id)
      VALUES (?, NULL, 'Dilaporkan', ?)
    `).run(info.lastInsertRowid, req.user.id);

    return info.lastInsertRowid;
  });

  const laporanId = buat();
  beritahuSemuaAdmin(laporanId, `Laporan baru ${req.user.nama}: ${judul.trim()}`);

  const baru = db.prepare('SELECT * FROM laporan WHERE id = ?').get(laporanId);
  res.status(201).json({ message: 'Laporan berhasil dibuat.', data: baru });
});

// ---------------------------------------------------------------------------
// PATCH /api/laporan/:id/status — ubah status (HANYA admin/teknisi).
// Body: { status: 'Diverifikasi' | 'Sedang Diperbaiki' | 'Selesai' | ... }
// ---------------------------------------------------------------------------
router.patch('/:id/status', wajibRole('admin'), (req, res) => {
  const { status } = req.body || {};

  if (!status || !DAFTAR_STATUS.includes(status)) {
    return res.status(400).json({ error: `Status tidak valid. Pilihan: ${DAFTAR_STATUS.join(', ')}.` });
  }

  const laporan = db.prepare('SELECT * FROM laporan WHERE id = ?').get(req.params.id);
  if (!laporan) {
    return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
  }
  if (laporan.status === status) {
    return res.status(400).json({ error: `Status sudah ${status}.` });
  }

  // Cek apakah transisi diizinkan (lihat TRANSISI_STATUS di atas).
  const boleh = TRANSISI_STATUS[laporan.status] || [];
  if (!boleh.includes(status)) {
    return res.status(400).json({
      error: `Tidak bisa mengubah status dari "${laporan.status}" langsung ke "${status}". Jalur yang diizinkan: ${boleh.join(' atau ') || 'tidak ada'}.`,
    });
  }

  // Transaksi: update laporan + simpan riwayat + notifikasi pelapor.
  db.transaction(() => {
    db.prepare(`
      UPDATE laporan SET status = ?, updated_at = datetime('now', '+7 hours')
      WHERE id = ?
    `).run(status, laporan.id);

    db.prepare(`
      INSERT INTO riwayat_status (laporan_id, status_lama, status_baru, diubah_oleh_id)
      VALUES (?, ?, ?, ?)
    `).run(laporan.id, laporan.status, status, req.user.id);
  })();

  // Beri tahu pelapor (kecuali kalau yang mengubah adalah pelapor sendiri).
  if (laporan.pelapor_id !== req.user.id) {
    buatNotifikasi(
      laporan.pelapor_id,
      laporan.id,
      `Laporan ${laporan.kode} status berubah: ${laporan.status} -> ${status}.`,
    );
  }

  const terbaru = db.prepare('SELECT * FROM laporan WHERE id = ?').get(laporan.id);
  res.json({ message: `Status diubah menjadi ${status}.`, data: terbaru });
});

// ---------------------------------------------------------------------------
// POST /api/laporan/:id/komentar — tambah komentar / update progres.
// Body: { isi }
// Siapa pun yang login boleh berkomentar; admin biasanya menulis progres
// perbaikan, petugas menambah info. Komentar baru memberi notifikasi ke
// pihak lain (pelapor kalau yang komen admin, admin kalau yang komen petugas).
// ---------------------------------------------------------------------------
router.post('/:id/komentar', (req, res) => {
  const { isi } = req.body || {};
  if (!isi || isi.trim().length < 2) {
    return res.status(400).json({ error: 'Isi komentar minimal 2 karakter.' });
  }

  const laporan = db.prepare('SELECT * FROM laporan WHERE id = ?').get(req.params.id);
  if (!laporan) {
    return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
  }

  const info = db.prepare(`
    INSERT INTO komentar (laporan_id, penulis_id, isi)
    VALUES (?, ?, ?)
  `).run(laporan.id, req.user.id, isi.trim());

  // Notifikasi ke pihak lain.
  if (req.user.role === 'admin' && laporan.pelapor_id !== req.user.id) {
    buatNotifikasi(laporan.pelapor_id, laporan.id, `Komentar baru dari teknisi di laporan ${laporan.kode}.`);
  } else if (req.user.role === 'petugas') {
    beritahuSemuaAdmin(laporan.id, `Komentar baru dari ${req.user.nama} di laporan ${laporan.kode}.`);
  }

  const komentar = db.prepare(`
    SELECT k.*, u.nama AS penulis_nama, u.role AS penulis_role
    FROM komentar k JOIN users u ON u.id = k.penulis_id
    WHERE k.id = ?
  `).get(info.lastInsertRowid);

  res.status(201).json({ message: 'Komentar ditambahkan.', data: komentar });
});

// ---------------------------------------------------------------------------
// DELETE /api/laporan/:id — hapus laporan (HANYA admin).
// Komentar, riwayat, dan notifikasi terkait ikut terhapus otomatis karena
// ON DELETE CASCADE di skema database (lihat db/database.js).
// ---------------------------------------------------------------------------
router.delete('/:id', wajibRole('admin'), (req, res) => {
  const laporan = db.prepare('SELECT * FROM laporan WHERE id = ?').get(req.params.id);
  if (!laporan) {
    return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
  }
  db.prepare('DELETE FROM laporan WHERE id = ?').run(req.params.id);
  res.json({ message: `Laporan ${laporan.kode} berhasil dihapus.` });
});

export default router;
