// ============================================================================
// seed.js — Mengisi database dengan akun demo + laporan contoh.
//
// CARA PAKAI:
//   npm run seed        (dari folder backend/)
//
// File ini IDEMPOTEN: boleh dijalankan berkali-kali, tidak akan membuat
// duplikat. Caranya: sebelum insert, cek dulu apakah username/kode sudah
// ada (INSERT OR IGNORE + cek manual).
//
// AKUN DEMO (password sudah di-hash dengan bcrypt, jangan simpan password
// polos di database!):
//   admin     / admin123    (role: admin/teknisi)
//   petugas1  / petugas123  (role: petugas)
//   petugas2  / petugas123  (role: petugas)
//
// LAPORAN CONTOH: 7 laporan dengan berbagai status, sistem, dan prioritas,
// supaya saat pertama kali membuka aplikasi, dashboard langsung terlihat
// "hidup" dan Linda bisa mencoba semua fitur tanpa input manual dulu.
// ============================================================================

import bcrypt from 'bcryptjs';
import db, { initDb } from './database.js';

// ---------------------------------------------------------------------------
// Data referensi: daftar sistem & jenis error yang bisa dipilih di form.
// Disimpan di sini (bukan tabel terpisah) supaya gampang diubah, dan dipakai
// bersama oleh backend (validasi) dan frontend (dropdown).
// ---------------------------------------------------------------------------
export const DAFTAR_SISTEM = [
  'SIAK',
  'Jaringan/Internet',
  'Aplikasi Antrean',
  'Aplikasi LAYANKU',
  'Printer/Perangkat',
  'Lainnya',
];

export const JENIS_ERROR = [
  'Tidak Bisa Dibuka',
  'Lambat / Lemot',
  'Jaringan Mati',
  'Data Tidak Muncul',
  'Error Saat Proses',
  'Perangkat Rusak',
  'Lainnya',
];

export const DAFTAR_PRIORITAS = ['Rendah', 'Sedang', 'Tinggi', 'Darurat'];

export const DAFTAR_STATUS = ['Dilaporkan', 'Diverifikasi', 'Sedang Diperbaiki', 'Selesai'];

// ---------------------------------------------------------------------------
// seed(): isi database. Dipanggil langsung kalau file ini dijalankan
// (node src/db/seed.js) dan juga otomatis saat server start kalau tabel
// users masih kosong (lihat index.js).
// ---------------------------------------------------------------------------
export function seed() {
  initDb();

  // --- 1. Akun demo ---------------------------------------------------------
  // bcrypt.hashSync(password, 10): mengubah password menjadi hash.
  // Angka 10 = "salt rounds", semakin besar semakin aman tapi semakin
  // lambat. 10 adalah standar yang umum dipakai.
  const akunDemo = [
    { nama: 'Admin TANGGAP',   username: 'admin',    password: 'admin123',   role: 'admin' },
    { nama: 'Sari Wulandari',  username: 'petugas1', password: 'petugas123', role: 'petugas' },
    { nama: 'Budi Santoso',    username: 'petugas2', password: 'petugas123', role: 'petugas' },
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (nama, username, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);
  for (const a of akunDemo) {
    insertUser.run(a.nama, a.username, bcrypt.hashSync(a.password, 10), a.role);
  }

  // Ambil id user berdasarkan username (dibutuhkan untuk relasi pelapor).
  const idUser = (username) => db.prepare('SELECT id FROM users WHERE username = ?').get(username).id;

  // --- 2. Laporan contoh ----------------------------------------------------
  // created_at dibuat mundur beberapa jam/hari supaya terlihat realistis.
  // Format waktu SQLite: 'YYYY-MM-DD HH:MM:SS'.
  const laporanContoh = [
    {
      pelapor: 'petugas1', sistem: 'SIAK', jenis_error: 'Tidak Bisa Dibuka',
      judul: 'SIAK tidak bisa dibuka sejak pagi',
      deskripsi: 'Sejak pukul 08.00 aplikasi SIAK menampilkan pesan "koneksi gagal" di semua komputer ruang pelayanan. Warga sudah antre tapi tidak bisa dilayani.',
      lokasi: 'Ruang Pelayanan', prioritas: 'Darurat', status: 'Sedang Diperbaiki',
      jamLalu: 5,
    },
    {
      pelapor: 'petugas2', sistem: 'Jaringan/Internet', jenis_error: 'Jaringan Mati',
      judul: 'WiFi kantor mati total',
      deskripsi: 'Akses internet di lantai 2 mati. Lampu indikator router merah. Sudah coba restart router tapi tetap tidak menyala.',
      lokasi: 'Lantai 2', prioritas: 'Tinggi', status: 'Diverifikasi',
      jamLalu: 3,
    },
    {
      pelapor: 'petugas1', sistem: 'Aplikasi Antrean', jenis_error: 'Lambat / Lemot',
      judul: 'Aplikasi antrean sangat lambat',
      deskripsi: 'Membuka daftar antrean butuh waktu hampir 1 menit. Nomor antrean baru kadang tidak muncul.',
      lokasi: 'MPP', prioritas: 'Sedang', status: 'Dilaporkan',
      jamLalu: 2,
    },
    {
      pelapor: 'petugas2', sistem: 'Printer/Perangkat', jenis_error: 'Perangkat Rusak',
      judul: 'Printer KTP di loket 3 macet',
      deskripsi: 'Printer macet terus, kertas tersangkut di dalam. Sudah dibersihkan tapi masih sering macet.',
      lokasi: 'Loket 3', prioritas: 'Sedang', status: 'Dilaporkan',
      jamLalu: 26,
    },
    {
      pelapor: 'petugas1', sistem: 'Aplikasi LAYANKU', jenis_error: 'Data Tidak Muncul',
      judul: 'Dashboard LAYANKU tidak menampilkan antrean baru',
      deskripsi: 'Antrean yang dibuat warga lewat WhatsApp tidak muncul di dashboard petugas. Terakhir normal kemarin sore.',
      lokasi: 'Ruang Pelayanan', prioritas: 'Tinggi', status: 'Selesai',
      jamLalu: 30,
    },
    {
      pelapor: 'petugas2', sistem: 'SIAK', jenis_error: 'Error Saat Proses',
      judul: 'SIAK error saat cetak KK',
      deskripsi: 'Waktu proses cetak Kartu Keluarga muncul error "data tidak ditemukan", padahal nomor KK sudah benar.',
      lokasi: 'Loket 2', prioritas: 'Sedang', status: 'Selesai',
      jamLalu: 50,
    },
    {
      pelapor: 'petugas1', sistem: 'Lainnya', jenis_error: 'Lainnya',
      judul: 'Lampu ruang arsip berkedip',
      deskripsi: 'Lampu di ruang arsip berkedip-kedip, khawatir korsleting. Mohon dicek teknisi listrik.',
      lokasi: 'Ruang Arsip', prioritas: 'Rendah', status: 'Dilaporkan',
      jamLalu: 8,
    },
  ];

  const insertLaporan = db.prepare(`
    INSERT INTO laporan
      (kode, pelapor_id, sistem, jenis_error, judul, deskripsi, lokasi, prioritas, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+7 hours', ?), datetime('now', '+7 hours', ?))
  `);
  // Offset waktu SQLite: '-5 hours' artinya 5 jam yang lalu.
  const insertRiwayat = db.prepare(`
    INSERT INTO riwayat_status (laporan_id, status_lama, status_baru, diubah_oleh_id, created_at)
    VALUES (?, ?, ?, ?, datetime('now', '+7 hours', ?))
  `);

  const jumlahLaporanLama = db.prepare('SELECT COUNT(*) AS n FROM laporan').get().n;
  if (jumlahLaporanLama === 0) {
    laporanContoh.forEach((l, i) => {
      const info = insertLaporan.run(
        `TGP-${String(i + 1).padStart(3, '0')}`,
        idUser(l.pelapor), l.sistem, l.jenis_error, l.judul, l.deskripsi,
        l.lokasi, l.prioritas, l.status, `-${l.jamLalu} hours`, `-${l.jamLalu} hours`,
      );
      // Riwayat: laporan dibuat (status awal Dilaporkan), lalu kalau status
      // akhirnya bukan Dilaporkan, tambahkan langkah perubahannya.
      insertRiwayat.run(info.lastInsertRowid, null, 'Dilaporkan', idUser(l.pelapor), `-${l.jamLalu} hours`);
      if (l.status === 'Diverifikasi' || l.status === 'Sedang Diperbaiki' || l.status === 'Selesai') {
        insertRiwayat.run(info.lastInsertRowid, 'Dilaporkan', 'Diverifikasi', idUser('admin'), `-${l.jamLalu - 1} hours`);
      }
      if (l.status === 'Sedang Diperbaiki' || l.status === 'Selesai') {
        insertRiwayat.run(info.lastInsertRowid, 'Diverifikasi', 'Sedang Diperbaiki', idUser('admin'), `-${Math.max(l.jamLalu - 2, 1)} hours`);
      }
      if (l.status === 'Selesai') {
        insertRiwayat.run(info.lastInsertRowid, 'Sedang Diperbaiki', 'Selesai', idUser('admin'), `-${Math.max(l.jamLalu - 3, 1)} hours`);
      }
    });

    // --- 3. Komentar contoh -------------------------------------------------
    const idLaporan = (kode) => db.prepare('SELECT id FROM laporan WHERE kode = ?').get(kode).id;
    const insertKomentar = db.prepare(`
      INSERT INTO komentar (laporan_id, penulis_id, isi, created_at)
      VALUES (?, ?, ?, datetime('now', '+7 hours', ?))
    `);
    insertKomentar.run(idLaporan('TGP-001'), idUser('admin'), 'Sudah dicek, server SIAK pusat sedang maintenance. Perkiraan normal pukul 13.00. Mohon informasikan ke warga yang menunggu.', '-4 hours');
    insertKomentar.run(idLaporan('TGP-001'), idUser('petugas1'), 'Baik, sudah diinfokan ke warga. Ditunggu kabarnya.', '-3 hours');
    insertKomentar.run(idLaporan('TGP-002'), idUser('admin'), 'Router sudah diganti adaptornya. Sedang dites, mohon pantau 30 menit ke depan.', '-2 hours');
    insertKomentar.run(idLaporan('TGP-005'), idUser('admin'), 'Sudah diperbaiki, sinkronisasi antrean sudah jalan lagi. Silakan cek dashboard.', '-28 hours');

    // --- 4. Notifikasi contoh ----------------------------------------------
    const insertNotifikasi = db.prepare(`
      INSERT INTO notifikasi (user_id, laporan_id, pesan, dibaca, created_at)
      VALUES (?, ?, ?, ?, datetime('now', '+7 hours', ?))
    `);
    insertNotifikasi.run(idUser('petugas1'), idLaporan('TGP-001'), 'Laporan TGP-001 status berubah menjadi Sedang Diperbaiki.', 0, '-4 hours');
    insertNotifikasi.run(idUser('petugas1'), idLaporan('TGP-005'), 'Laporan TGP-005 sudah Selesai. Dashboard LAYANKU sudah normal kembali.', 0, '-28 hours');
    insertNotifikasi.run(idUser('admin'), idLaporan('TGP-003'), 'Laporan baru: Aplikasi antrean sangat lambat (TGP-003).', 0, '-2 hours');

    console.log('Seed selesai: 3 akun demo + 7 laporan contoh + komentar + notifikasi.');
  } else {
    console.log(`Seed dilewati: database sudah berisi ${jumlahLaporanLama} laporan.`);
  }
}

// Kalau file ini dijalankan langsung (npm run seed), jalankan seed().
import { fileURLToPath } from 'node:url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed();
}
