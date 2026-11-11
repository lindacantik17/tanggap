// ============================================================================
// routes/notifikasi.js — Endpoint notifikasi untuk user yang sedang login.
//
// ENDPOINT:
//   GET   /api/notifikasi              — daftar notifikasi saya (terbaru dulu)
//   GET   /api/notifikasi/belum-dibaca — jumlah notifikasi yang belum dibaca
//                                        (untuk angka di ikon lonceng)
//   PATCH /api/notifikasi/:id/baca     — tandai satu notifikasi sudah dibaca
//   PATCH /api/notifikasi/baca-semua   — tandai semua notifikasi sudah dibaca
//
// CATATAN KEAMANAN:
// Semua query selalu dibatasi `user_id = req.user.id`, supaya user hanya
// bisa melihat/mengubah notifikasinya SENDIRI, tidak bisa mengintip
// notifikasi user lain dengan menebak id.
// ============================================================================

import express from 'express';
import db from '../db/database.js';
import { wajibLogin } from '../middleware/auth.js';

const router = express.Router();

router.use(wajibLogin);

// Daftar notifikasi saya, yang terbaru dulu. ?limit=20 untuk membatasi.
router.get('/', (req, res) => {
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const rows = db.prepare(`
    SELECT * FROM notifikasi
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(req.user.id, limit);
  res.json({ data: rows });
});

// Jumlah yang belum dibaca (angka merah di ikon lonceng).
router.get('/belum-dibaca', (req, res) => {
  const row = db.prepare(`
    SELECT COUNT(*) AS n FROM notifikasi WHERE user_id = ? AND dibaca = 0
  `).get(req.user.id);
  res.json({ data: { belumDibaca: row.n } });
});

// Tandai satu notifikasi sudah dibaca.
router.patch('/:id/baca', (req, res) => {
  const info = db.prepare(`
    UPDATE notifikasi SET dibaca = 1 WHERE id = ? AND user_id = ?
  `).run(req.params.id, req.user.id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Notifikasi tidak ditemukan.' });
  }
  res.json({ message: 'Notifikasi ditandai sudah dibaca.' });
});

// Tandai semua notifikasi saya sudah dibaca.
router.patch('/baca-semua', (req, res) => {
  db.prepare('UPDATE notifikasi SET dibaca = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Semua notifikasi ditandai sudah dibaca.' });
});

export default router;
