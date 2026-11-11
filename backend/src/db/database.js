// ============================================================================
// database.js — Koneksi SQLite + pembuatan tabel (skema database).
//
// CARA KERJA:
// - better-sqlite3 membuka file database (dibuat otomatis kalau belum ada).
// - Fungsi initDb() membuat tabel-tabel kalau belum ada (CREATE TABLE IF
//   NOT EXISTS), jadi aman dijalankan berulang kali.
// - Semua waktu disimpan dalam WIB (Asia/Jakarta). Triknya: SQLite punya
//   fungsi datetime('now', '+7 hours') — 'now' itu UTC, ditambah 7 jam
//   menjadi WIB. Ini pola yang sama dipakai proyek LAYANKU, karena
//   SQLite tidak kenal zona waktu Asia/Jakarta secara langsung.
//
// TABEL-TABEL:
//   users          — akun petugas & admin/teknisi
//   laporan        — laporan error yang dibuat petugas
//   komentar       — update progres / diskusi di dalam satu laporan
//   riwayat_status — jejak audit: siapa mengubah status apa, kapan
//   notifikasi     — pesan pemberitahuan untuk user (status berubah, dll)
// ============================================================================

import Database from 'better-sqlite3';
import { config } from '../config.js';

// Buka (atau buat) file database. Opsi verbose dimatikan supaya log bersih.
const db = new Database(config.dbPath);

// Aktifkan foreign key. Secara default SQLite TIDAK menegakkan foreign key,
// jadi harus dihidupkan manual per koneksi. Ini penting supaya misal ada
// komentar yang menunjuk laporan_id yang tidak ada, langsung ditolak.
db.pragma('foreign_keys = ON');

// ---------------------------------------------------------------------------
// initDb(): membuat semua tabel + data referensi awal (daftar sistem & jenis
// error). Dipanggil sekali saat server mulai (lihat index.js).
// ---------------------------------------------------------------------------
export function initDb() {
  // --- Tabel users ----------------------------------------------------------
  // role: 'petugas' (pelapor, user biasa) atau 'admin' (teknisi yang
  // memperbaiki + mengelola semua laporan).
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nama          TEXT    NOT NULL,
      username      TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      role          TEXT    NOT NULL CHECK (role IN ('petugas', 'admin')),
      created_at    TEXT    NOT NULL DEFAULT (datetime('now', '+7 hours'))
    );
  `);

  // --- Tabel laporan --------------------------------------------------------
  // Satu baris = satu laporan error.
  //   kode       : nomor laporan yang ramah dibaca manusia, mis. TGP-001.
  //                Dibuat otomatis dari id (lihat routes/laporan.js).
  //   sistem     : sistem apa yang error (SIAK, Jaringan/Internet, dst).
  //   jenis_error: macam errornya (Tidak Bisa Dibuka, Lambat, dst).
  //   prioritas  : Rendah / Sedang / Tinggi / Darurat.
  //   status     : alur penanganan (lihat TRANSISI_STATUS di routes/laporan.js)
  //                Dilaporkan -> Diverifikasi -> Sedang Diperbaiki -> Selesai
  db.exec(`
    CREATE TABLE IF NOT EXISTS laporan (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      kode        TEXT    UNIQUE,
      pelapor_id  INTEGER NOT NULL REFERENCES users(id),
      sistem      TEXT    NOT NULL,
      jenis_error TEXT    NOT NULL,
      judul       TEXT    NOT NULL,
      deskripsi   TEXT    NOT NULL,
      lokasi      TEXT    NOT NULL DEFAULT '-',
      prioritas   TEXT    NOT NULL DEFAULT 'Sedang'
                  CHECK (prioritas IN ('Rendah', 'Sedang', 'Tinggi', 'Darurat')),
      status      TEXT    NOT NULL DEFAULT 'Dilaporkan'
                  CHECK (status IN ('Dilaporkan', 'Diverifikasi', 'Sedang Diperbaiki', 'Selesai')),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now', '+7 hours')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now', '+7 hours'))
    );
  `);

  // --- Tabel komentar -------------------------------------------------------
  // Setiap laporan bisa didiskusikan: admin menulis progres perbaikan,
  // petugas bisa menambah info (misal "errornya masih muncul setelah
  // restart"). Komentar diurutkan dari yang terlama.
  db.exec(`
    CREATE TABLE IF NOT EXISTS komentar (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      laporan_id INTEGER NOT NULL REFERENCES laporan(id) ON DELETE CASCADE,
      penulis_id INTEGER NOT NULL REFERENCES users(id),
      isi        TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now', '+7 hours'))
    );
  `);

  // --- Tabel riwayat_status -------------------------------------------------
  // Jejak audit: setiap kali status berubah, simpan siapa yang mengubah,
  // dari status apa ke status apa, dan kapan. Ini yang ditampilkan di
  // halaman detail laporan sebagai "Riwayat Status".
  // ON DELETE CASCADE: kalau laporannya dihapus, riwayatnya ikut terhapus.
  db.exec(`
    CREATE TABLE IF NOT EXISTS riwayat_status (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      laporan_id    INTEGER NOT NULL REFERENCES laporan(id) ON DELETE CASCADE,
      status_lama   TEXT,
      status_baru   TEXT    NOT NULL,
      diubah_oleh_id INTEGER NOT NULL REFERENCES users(id),
      created_at    TEXT    NOT NULL DEFAULT (datetime('now', '+7 hours'))
    );
  `);

  // --- Tabel notifikasi -----------------------------------------------------
  // Pemberitahuan sederhana (disimpan di DB, bukan push notification).
  // Contoh pemicu:
  //   - laporan baru dibuat      -> semua admin dapat notifikasi
  //   - status laporan berubah   -> pelapor dapat notifikasi
  //   - ada komentar baru        -> pelapor/admin terkait dapat notifikasi
  // Frontend menampilkan ini sebagai ikon lonceng + daftar.
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifikasi (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      laporan_id INTEGER REFERENCES laporan(id) ON DELETE CASCADE,
      pesan      TEXT    NOT NULL,
      dibaca     INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now', '+7 hours'))
    );
  `);

  // Index supaya pencarian laporan per pelapor / per status cepat.
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_laporan_pelapor ON laporan(pelapor_id);
    CREATE INDEX IF NOT EXISTS idx_laporan_status  ON laporan(status);
    CREATE INDEX IF NOT EXISTS idx_notifikasi_user ON notifikasi(user_id, dibaca);
  `);
}

// Koneksi database dipakai bersama oleh semua route (satu instance saja).
export default db;
