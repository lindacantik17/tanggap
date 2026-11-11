// ============================================================================
// notifikasi.js — Fungsi kecil untuk membuat notifikasi di database.
//
// KONSEP:
// Notifikasi di TANGGAP itu sederhana: hanya baris di tabel `notifikasi`.
// Tidak ada push notification / WebSocket — frontend cukup mengambil daftar
// notifikasi lewat API setiap kali halaman dimuat (atau berkala).
// Ini sudah cukup untuk belajar alur "kejadian -> beri tahu user terkait".
//
// KAPAN NOTIFIKASI DIBUAT (lihat pemakaiannya di routes/):
//   - Laporan baru dibuat        -> semua admin diberitahu.
//   - Status laporan berubah     -> pelapor diberitahu.
//   - Komentar baru ditambahkan  -> pihak lain yang terlibat diberitahu.
// ============================================================================

import db from '../db/database.js';

// Buat satu notifikasi untuk satu user.
export function buatNotifikasi(userId, laporanId, pesan) {
  db.prepare(`
    INSERT INTO notifikasi (user_id, laporan_id, pesan)
    VALUES (?, ?, ?)
  `).run(userId, laporanId, pesan);
}

// Buat notifikasi yang sama untuk SEMUA admin (misal saat ada laporan baru).
// Dipakai supaya teknisi langsung tahu ada laporan masuk tanpa harus
// membuka halaman daftar laporan.
export function beritahuSemuaAdmin(laporanId, pesan) {
  const adminList = db.prepare(`SELECT id FROM users WHERE role = 'admin'`).all();
  const insert = db.prepare(`
    INSERT INTO notifikasi (user_id, laporan_id, pesan) VALUES (?, ?, ?)
  `);
  for (const admin of adminList) {
    insert.run(admin.id, laporanId, pesan);
  }
}
