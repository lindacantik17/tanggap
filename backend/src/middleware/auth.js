// ============================================================================
// auth.js — Middleware (penjaga) untuk route yang butuh login.
//
// KONSEP JWT (JSON Web Token), cara kerjanya langkah demi langkah:
//   1. User login dengan username + password (lihat routes/auth.js).
//   2. Kalau password benar, server membuat TOKEN — sebuah string panjang
//      yang berisi data user (id, username, role) + tanda tangan digital.
//   3. Token dikirim ke frontend, disimpan di localStorage.
//   4. Setiap request berikutnya, frontend mengirim token lewat header:
//        Authorization: Bearer <token>
//   5. Middleware ini memeriksa token: apakah tanda tangannya valid dan
//      belum kedaluwarsa? Kalau valid, data user ditempel ke req.user,
//      lalu request diteruskan ke route. Kalau tidak valid, tolak 401.
//
// Middleware di Express = fungsi yang dijalankan SEBELUM handler route.
// Kalau middleware memanggil next(), request lanjut; kalau mengirim
// respons error, request berhenti di situ.
// ============================================================================

import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// ---------------------------------------------------------------------------
// buatToken(user): membuat JWT untuk user yang baru login.
// Payload (isi token) hanya berisi data yang tidak sensitif: id, username,
// nama, role. JANGAN pernah memasukkan password ke dalam token!
// ---------------------------------------------------------------------------
export function buatToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, nama: user.nama, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

// ---------------------------------------------------------------------------
// wajibLogin: middleware yang menolak request tanpa token valid.
// Dipakai di semua route /api/... kecuali /api/auth/login dan register.
// ---------------------------------------------------------------------------
export function wajibLogin(req, res, next) {
  // Header Authorization bentuknya: "Bearer <token>"
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Belum login. Sertakan token di header Authorization.' });
  }

  try {
    // jwt.verify akan error kalau tanda tangan tidak cocok / kedaluwarsa.
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload; // Tempel data user supaya bisa dipakai route berikutnya.
    next();
  } catch {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa. Silakan login ulang.' });
  }
}

// ---------------------------------------------------------------------------
// wajibRole(...roles): middleware pembatas role.
// Contoh: wajibRole('admin') = hanya admin/teknisi yang boleh lewat.
// Dipakai SETELAH wajibLogin, karena butuh req.user.
// ---------------------------------------------------------------------------
export function wajibRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Belum login.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Akses ditolak. Fitur ini hanya untuk role: ${roles.join(', ')}.` });
    }
    next();
  };
}
