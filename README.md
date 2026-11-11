# TANGGAP — Sistem Helpdesk Internal Disdukcapil

> **Proyek belajar** untuk memahami cara membangun sistem helpdesk (website responsif
> yang nyaman dibuka di HP). **Bukan** untuk dikumpulkan sebagai tugas orang lain —
> proyek ini dibuat supaya Linda paham arsitektur, alur, dan kode sebuah sistem
> helpdesk dari nol.

## Masalah yang diselesaikan

Di Disdukcapil, kalau ada error (SIAK tidak bisa dibuka, jaringan mati, aplikasi
antrean lemot, printer macet), petugas selama ini harus **menelepon orang SIAK**
untuk bertanya / melapor. TANGGAP menggantikan telepon itu dengan sistem:

1. **Petugas** melaporkan error lewat form (pilih sistem, jenis error, prioritas,
   deskripsi, lokasi).
2. **Admin / teknisi** mendapat notifikasi, memverifikasi laporan, lalu mengubah
   status saat mulai memperbaiki.
3. **Petugas** mendapat notifikasi setiap kali status berubah, dan bisa melihat
   progres perbaikan lewat komentar teknisi — tanpa perlu menelepon.

Status laporan: **Dilaporkan → Diverifikasi → Sedang Diperbaiki → Selesai**.

## Arsitektur (diagram sederhana)

```
┌─────────────────────────┐      HTTP + JSON       ┌─────────────────────────┐
│  FRONTEND (browser/HP)  │  ───────────────────▶  │  BACKEND (Node.js)    │
│  Vite + React + Tailwind│  ◀───────────────────  │  Express (port 3001)  │
│  port 5173 (dev)        │   Authorization: Bearer│  JWT + bcryptjs       │
└─────────────────────────┘   <token>              └───────────┬─────────────┘
                                                                │ better-sqlite3
                                                                ▼
                                                    ┌─────────────────────────┐
                                                    │  SQLite (1 file)      │
                                                    │  data/tanggap.db      │
                                                    │  users, laporan,      │
                                                    │  komentar,            │
                                                    │  riwayat_status,      │
                                                    │  notifikasi           │
                                                    └─────────────────────────┘
```

- **Frontend** tidak pernah menyentuh database langsung. Semua lewat API.
- **Backend** yang memvalidasi input, mengecek login (JWT), mengecek role
  (petugas vs admin), dan menulis ke database.
- **Database** satu file SQLite — gampang di-backup (tinggal copy file-nya),
  tidak butuh server database terpisah.

## Struktur folder

```
tanggap/
├── README.md                  <- file ini
├── backend/
│   ├── package.json           <- dependensi + script npm
│   ├── .env.example           <- contoh konfigurasi (salin ke .env kalau perlu)
│   ├── data/
│   │   └── tanggap.db         <- database SQLite (dibuat otomatis saat start)
│   └── src/
│       ├── index.js           <- entry point: rakit Express + jalankan server
│       ├── config.js          <- semua pengaturan (port, JWT secret, path DB)
│       ├── db/
│       │   ├── database.js    <- koneksi + pembuatan tabel (skema)
│       │   └── seed.js        <- akun demo + 7 laporan contoh + daftar referensi
│       ├── middleware/
│       │   └── auth.js        <- JWT: buat token, wajibLogin, wajibRole
│       ├── utils/
│       │   └── notifikasi.js  <- fungsi kecil pembuat notifikasi
│       └── routes/
│           ├── auth.js        <- login / register / me
│           ├── laporan.js     <- CRUD laporan + status + komentar
│           ├── dashboard.js   <- statistik ringkasan
│           └── notifikasi.js  <- daftar & tandai-dibaca notifikasi
└── frontend/
    ├── package.json
    ├── vite.config.js         <- port 5173 + proxy /api -> backend :3001
    ├── index.html
    └── src/
        ├── main.jsx           <- entry point React
        ├── App.jsx            <- routing + penjaga route (login/admin)
        ├── index.css          <- Tailwind + gaya dasar
        ├── api/
        │   └── client.js      <- fetch wrapper (token otomatis) + localStorage
        ├── context/
        │   └── AuthContext.jsx<- status login global (user, login, logout)
        ├── components/
        │   ├── Layout.jsx     <- header, navigasi, lonceng notifikasi
        │   └── Badge.jsx      <- lencana warna status/prioritas/sistem
        └── pages/
            ├── LoginPage.jsx
            ├── DashboardPage.jsx
            ├── LaporanListPage.jsx
            ├── LaporanBaruPage.jsx
            ├── LaporanDetailPage.jsx
            └── AdminPage.jsx
```

## Cara menjalankan

### Syarat

- Node.js 18+ (di VM ini: Node v24, sudah terpasang)
- npm (sudah terpasang)

### 1. Backend (terminal 1)

```bash
cd ~/workspace/tanggap/backend
npm install        # sekali saja (atau kalau package.json berubah)
npm start          # server jalan di http://127.0.0.1:3001
```

Saat pertama dijalankan, backend otomatis membuat database dan mengisinya
dengan akun demo + 7 laporan contoh (lihat `src/db/seed.js`).

Untuk mengulang dari nol (hapus semua data, kembali ke seed awal):

```bash
rm backend/data/tanggap.db*
npm start
```

### 2. Frontend (terminal 2)

```bash
cd ~/workspace/tanggap/frontend
npm install        # sekali saja
npm run dev        # buka http://127.0.0.1:5173 di browser
```

Untuk build production (mengecek tidak ada error):

```bash
npm run build      # hasil di frontend/dist/
npm run preview    # sajikan hasil build di http://127.0.0.1:4173
```

### Akun demo

| Username   | Password    | Role            |
| ---------- | ----------- | --------------- |
| `admin`    | `admin123`  | Admin / Teknisi |
| `petugas1` | `petugas123`| Petugas         |
| `petugas2` | `petugas123`| Petugas         |

## Deploy ke internet (Render, gratis)

Supaya TANGGAP bisa dibuka dari HP atau laptop mana saja lewat satu link,
tanpa menjalankan server di laptop sendiri, deploy ke Render (free tier):

1. Push repo ini ke GitHub.
2. Buka https://dashboard.render.com/blueprints/new, pilih repo ini.
   (Atau klik tombol di bawah — ganti `BobbyLeonardd` dengan username
   GitHub kamu kalau berbeda.)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/lindacantik17/tanggap)

3. Render membaca `render.yaml` dan membuat satu Web Service gratis.
   Tunggu build selesai (±2-3 menit), lalu buka URL-nya, misal
   `https://tanggap.onrender.com`. Login pakai akun demo di atas.

Catatan free tier (penting):
- Service "tidur" setelah 15 menit tidak dipakai; request pertama
  sesudah tidur butuh ~30-60 detik untuk bangun. Ini normal.
- Database SQLite tinggal di disk yang tidak persisten: kalau service
  restart, data laporan buatan user hilang dan kembali ke 7 laporan
  contoh (seed otomatis). Untuk belajar ini tidak masalah.
- Backend menyajikan frontend sekaligus (lihat `backend/src/index.js`
  bagian 8), jadi satu service saja sudah cukup — tidak perlu mengatur
  URL API atau CORS.

## Daftar API endpoint

Semua endpoint (kecuali login/register) butuh header `Authorization: Bearer <token>`.

### Auth — `src/routes/auth.js`

| Method | Endpoint              | Keterangan |
| ------ | --------------------- | ---------- |
| POST   | `/api/auth/login`     | Login, mengembalikan `{ token, user }` |
| POST   | `/api/auth/register`  | Daftar akun petugas baru |
| GET    | `/api/auth/me`        | Cek user dari token |

### Laporan — `src/routes/laporan.js`

| Method | Endpoint | Keterangan |
| ------ | -------- | ---------- |
| GET    | `/api/laporan` | Daftar laporan. Filter: `?status=&sistem=&prioritas=&milik=saya` |
| GET    | `/api/laporan/:id` | Detail + komentar + riwayat status |
| POST   | `/api/laporan` | Buat laporan baru |
| PATCH  | `/api/laporan/:id/status` | Ubah status (admin saja; transisi divalidasi) |
| POST   | `/api/laporan/:id/komentar` | Tambah komentar |
| DELETE | `/api/laporan/:id` | Hapus laporan (admin saja) |

### Dashboard & notifikasi

| Method | Endpoint | Keterangan |
| ------ | -------- | ---------- |
| GET    | `/api/dashboard/ringkasan` | Total, terbuka, per status/sistem/prioritas, 5 terbaru |
| GET    | `/api/notifikasi` | Daftar notifikasi saya (`?limit=20`) |
| GET    | `/api/notifikasi/belum-dibaca` | Jumlah belum dibaca (angka di lonceng) |
| PATCH  | `/api/notifikasi/:id/baca` | Tandai satu sudah dibaca |
| PATCH  | `/api/notifikasi/baca-semua` | Tandai semua sudah dibaca |
| GET    | `/api/referensi` | Daftar sistem, jenis error, prioritas, status |
| GET    | `/health` | Cek server hidup (`{"status":"ok"}`) |

## Struktur database (SQLite)

### `users`

| Kolom | Tipe | Keterangan |
| ----- | ---- | ---------- |
| id | INTEGER PK | — |
| nama | TEXT | Nama lengkap |
| username | TEXT UNIQUE | Dipakai login |
| password_hash | TEXT | Hash bcrypt, **bukan** password polos |
| role | TEXT | `petugas` atau `admin` |
| created_at | TEXT | Waktu WIB (`datetime('now','+7 hours')`) |

### `laporan`

| Kolom | Tipe | Keterangan |
| ----- | ---- | ---------- |
| id | INTEGER PK | — |
| kode | TEXT UNIQUE | Nomor ramah dibaca, mis. `TGP-001` |
| pelapor_id | INTEGER FK → users | Siapa yang melapor |
| sistem | TEXT | SIAK / Jaringan/Internet / Aplikasi Antrean / Aplikasi LAYANKU / Printer/Perangkat / Lainnya |
| jenis_error | TEXT | Tidak Bisa Dibuka / Lambat / Jaringan Mati / Data Tidak Muncul / Error Saat Proses / Perangkat Rusak / Lainnya |
| judul | TEXT | Ringkasan error |
| deskripsi | TEXT | Detail error |
| lokasi | TEXT | Ruang/loket, mis. "Ruang Pelayanan" |
| prioritas | TEXT | Rendah / Sedang / Tinggi / Darurat |
| status | TEXT | Dilaporkan / Diverifikasi / Sedang Diperbaiki / Selesai |
| created_at, updated_at | TEXT | Waktu WIB |

### `komentar`

| Kolom | Keterangan |
| ----- | ---------- |
| id | PK |
| laporan_id | FK → laporan (CASCADE: hapus laporan = hapus komentarnya) |
| penulis_id | FK → users |
| isi | Isi komentar / update progres |
| created_at | Waktu WIB |

### `riwayat_status`

Jejak audit perubahan status.

| Kolom | Keterangan |
| ----- | ---------- |
| id | PK |
| laporan_id | FK → laporan (CASCADE) |
| status_lama | Status sebelum diubah (NULL kalau baru dibuat) |
| status_baru | Status sesudah diubah |
| diubah_oleh_id | FK → users (siapa yang mengubah) |
| created_at | Waktu WIB |

### `notifikasi`

| Kolom | Keterangan |
| ----- | ---------- |
| id | PK |
| user_id | FK → users (penerima) |
| laporan_id | FK → laporan (boleh NULL) |
| pesan | Isi pemberitahuan |
| dibaca | 0 = belum dibaca, 1 = sudah dibaca |
| created_at | Waktu WIB |

## Panduan belajar (urut-urutan membaca file)

Baca file-file ini secara berurutan supaya paham sistem dari yang paling dasar:

### Tahap 1 — Fondasi (bagaimana data disimpan)

1. `backend/src/db/database.js` — skema tabel. Pahami dulu data apa saja yang
   disimpan sebelum melihat kodenya dipakai.
2. `backend/src/db/seed.js` — data awal + daftar referensi (sistem, jenis error).
   Lihat cara password di-hash (bcrypt) dan cara membuat tanggal mundur.

### Tahap 2 — Keamanan (bagaimana login bekerja)

3. `backend/src/middleware/auth.js` — **paling penting**: cara kerja JWT
   (buat token, verifikasi token, `wajibLogin`, `wajibRole`). Baca komentarnya.
4. `backend/src/routes/auth.js` — endpoint login/register; lihat cara
   `bcrypt.compare` memeriksa password.

### Tahap 3 — Fitur inti (CRUD + alur status)

5. `backend/src/routes/laporan.js` — file terbesar & terpenting. Perhatikan:
   - `TRANSISI_STATUS` (state machine status),
   - `db.transaction()` (supaya update status + riwayat + notifikasi tidak
     setengah-setengah),
   - prepared statement `?` (mencegah SQL injection).
6. `backend/src/utils/notifikasi.js` — fungsi kecil pembuat notifikasi.
7. `backend/src/routes/dashboard.js` — `COUNT + GROUP BY` di SQL untuk statistik.
8. `backend/src/routes/notifikasi.js` — kenapa semua query dibatasi
   `user_id = req.user.id` (supaya tidak bisa mengintip notifikasi orang lain).

### Tahap 4 — Server

9. `backend/src/index.js` + `backend/src/config.js` — cara Express dirakit:
   middleware, router, dan startup (initDb → seed → listen).

### Tahap 5 — Frontend (bagaimana React memakai API)

10. `frontend/src/api/client.js` — fetch wrapper + token di localStorage.
11. `frontend/src/context/AuthContext.jsx` — status login global (React Context).
12. `frontend/src/App.jsx` — routing + penjaga route (login/admin).
13. `frontend/src/pages/LoginPage.jsx` — form login (paling sederhana, mulai dari sini).
14. `frontend/src/pages/LaporanBaruPage.jsx` — form + POST ke API.
15. `frontend/src/pages/LaporanListPage.jsx` — daftar + filter (query string).
16. `frontend/src/pages/DashboardPage.jsx` — kartu statistik + daftar terbaru.
17. `frontend/src/pages/LaporanDetailPage.jsx` — detail + ubah status + komentar + riwayat.
18. `frontend/src/pages/AdminPage.jsx` — tabel kelola + ubah status cepat.
19. `frontend/src/components/Layout.jsx` — header + lonceng notifikasi (polling tiap 60 detik).

## Konsep penting yang dipakai (dan di mana melihatnya)

| Konsep | Di mana |
| ------ | ------- |
| REST API (GET/POST/PATCH/DELETE) | `backend/src/routes/*.js` |
| JWT (login tanpa session di server) | `backend/src/middleware/auth.js` |
| bcrypt (hash password) | `backend/src/routes/auth.js`, `backend/src/db/seed.js` |
| SQL prepared statement (anti SQL injection) | `backend/src/routes/laporan.js` |
| Transaksi database (semua-atau-tidak-sama-sekali) | `backend/src/routes/laporan.js` (buat laporan & ubah status) |
| State machine (alur status) | `TRANSISI_STATUS` di `backend/src/routes/laporan.js` |
| Foreign key + ON DELETE CASCADE | `backend/src/db/database.js` |
| Audit trail (riwayat_status) | `backend/src/routes/laporan.js` |
| React Context (state global) | `frontend/src/context/AuthContext.jsx` |
| React Router + route guard | `frontend/src/App.jsx` |
| Vite proxy (hindari CORS saat dev) | `frontend/vite.config.js` |
| localStorage (simpan token) | `frontend/src/api/client.js` |
| Polling notifikasi (refresh tiap 60 detik) | `frontend/src/components/Layout.jsx` |

## Batasan (yang sengaja belum dibuat)

- **Bukan APK native.** Frontend adalah web app responsif — dibuka lewat browser
  HP, bukan aplikasi Android/iOS terinstal. Ini disengaja supaya ringan untuk
  belajar (membangun APK butuh Android Studio + build native).
- **Notifikasi bukan push.** Notifikasi hanya tersimpan di database dan diambil
  frontend secara berkala (polling). Tidak ada WebSocket / Firebase Cloud
  Messaging. Kalau mau belajar push notification, itu langkah lanjutannya.
- **Tidak ada upload foto.** Laporan hanya teks. Kalau mau, bisa ditambah
  mengikuti pola `multer` di proyek LAYANKU.
- **Tidak ada monitoring otomatis.** Sistem tidak mendeteksi error sendiri
  (misal ping SIAK). Laporan dibuat manual oleh petugas. Monitoring otomatis
  adalah fitur lanjutan (butuh scheduler + health check).
- **Satu database file, satu server.** Belum ada backup otomatis / replikasi.
  Untuk belajar, cukup copy file `data/tanggap.db` sebagai backup.
- **JWT_SECRET default.** Nilai default di `src/config.js` hanya untuk belajar.
  Kalau dipakai sungguhan, wajib diisi lewat file `.env` dengan string acak
  yang panjang (lihat `.env.example`).

## Deploy ke Vercel (Hobby, gratis, tanpa kartu kredit)

Vercel Hobby adalah satu-satunya hosting gratis tanpa kartu yang masih
berlaku per November 2026 (riset lengkap: `Riset_Hosting_Gratis_TANGGAP.md`
di folder user files). Tapi Vercel itu serverless, bukan server persisten,
jadi ada adaptasi:

- Entry point: `api/index.js` mengekspor aplikasi Express dari
  `backend/src/index.js` (tanpa `app.listen()`).
- Routing: `vercel.json` meneruskan `/api/*` ke function dan route lain
  ke `index.html` (SPA fallback). File statis disajikan dari
  `frontend/dist`.
- Env var di dashboard Vercel (Production):
  `NODE_ENV=production`, `JWT_SECRET=<string acak>`,
  `DB_PATH=/tmp/tanggap.db`, `HOST=0.0.0.0`.
- Database: `/tmp` adalah satu-satunya folder yang bisa ditulis.
  Tiap cold start database dibuat ulang + di-seed (7 laporan contoh),
  jadi laporan yang dibuat user tidak awet. Sama seperti restart di
  Render free, tapi lebih sering terjadi.
- Deploy Render tetap bisa dipakai (lihat `render.yaml`); kode yang
  sama jalan di keduanya karena `app.listen()` hanya aktif saat
  `backend/src/index.js` dieksekusi langsung (`npm start`).
