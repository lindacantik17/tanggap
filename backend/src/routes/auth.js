// ============================================================================
// routes/auth.js — Endpoint login & register.
//
// ENDPOINT:
//   POST /api/auth/login     — login, mengembalikan { token, user }
//   POST /api/auth/register  — daftar akun petugas baru (admin bisa mendaftarkan
//                              siapa saja; untuk belajar, endpoint ini terbuka
//                              tapi hanya membuat role 'petugas')
//   GET  /api/auth/me        — cek siapa user dari token (untuk frontend
//                              memastikan token masih valid saat refresh)
//
// ALUR LOGIN:
//   1. Cari user berdasarkan username.
//   2. Bandingkan password yang diketik dengan hash di database memakai
//      bcrypt.compare — JANGAN pernah membandingkan string password polos.
//   3. Kalau cocok, buat JWT (lihat middleware/auth.js) dan kirim ke user.
// ============================================================================

import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database.js';
import { buatToken, wajibLogin } from '../middleware/auth.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// POST /api/auth/login
// Body: { username, password }
// Berhasil -> 200 { token, user: { id, nama, username, role } }
// Gagal    -> 401 { error: ... }
// ---------------------------------------------------------------------------
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  // Cari user. Sengaja pesan errornya sama untuk username salah / password
  // salah, supaya penyerang tidak bisa menebak username mana yang terdaftar.
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }

  // bcrypt.compare: membandingkan password polos dengan hash di database.
  // Hash tidak bisa dibalik menjadi password asli — itulah kenapa aman
  // menyimpan hash, bukan password polos.
  const cocok = bcrypt.compareSync(password, user.password_hash);
  if (!cocok) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }

  const token = buatToken(user);
  res.json({
    token,
    user: { id: user.id, nama: user.nama, username: user.username, role: user.role },
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/register
// Body: { nama, username, password }
// Membuat akun role 'petugas'. (Admin dibuat lewat seed, supaya tidak ada
// orang iseng yang mendaftarkan diri jadi admin.)
// ---------------------------------------------------------------------------
router.post('/register', (req, res) => {
  const { nama, username, password } = req.body || {};

  if (!nama || !username || !password) {
    return res.status(400).json({ error: 'Nama, username, dan password wajib diisi.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter.' });
  }

  const sudahAda = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (sudahAda) {
    return res.status(409).json({ error: 'Username sudah dipakai. Pilih username lain.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`
    INSERT INTO users (nama, username, password_hash, role)
    VALUES (?, ?, ?, 'petugas')
  `).run(nama, username, hash);

  res.status(201).json({
    message: 'Akun petugas berhasil dibuat. Silakan login.',
    user: { id: info.lastInsertRowid, nama, username, role: 'petugas' },
  });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me — butuh token (wajibLogin). Mengembalikan data user dari
// token, supaya frontend bisa menampilkan nama & role tanpa login ulang.
// ---------------------------------------------------------------------------
router.get('/me', wajibLogin, (req, res) => {
  res.json({ user: req.user });
});

export default router;
