// ============================================================================
// api/client.js — Satu-satunya tempat frontend memanggil backend.
//
// KENAPA DIABSTRAKSI?
// Supaya semua halaman memakai cara yang sama untuk request: token JWT
// otomatis ditempel, error dibaca dengan rapi, dan kalau token kedaluwarsa
// (401) user langsung diarahkan ke halaman login.
// Kalau suatu hari base URL API berubah, cukup ubah di sini.
//
// CARA PAKAI DI HALAMAN:
//   import { api } from '../api/client';
//   const { data } = await api.get('/laporan');
//   const { data } = await api.post('/laporan', { judul, ... });
// ============================================================================

const BASE_URL = '/api'; // di-proxy Vite ke http://localhost:3001 (lihat vite.config.js)

// --- Token disimpan di localStorage -----------------------------------------
// localStorage = penyimpanan kecil di browser yang bertahan walau tab ditutup.
// Token di sini BUKAN password — token hanya berlaku 8 jam dan bisa dicabut
// dengan mengganti JWT_SECRET di backend.
export function simpanToken(token) {
  localStorage.setItem('tanggap_token', token);
}
export function ambilToken() {
  return localStorage.getItem('tanggap_token');
}
export function hapusToken() {
  localStorage.removeItem('tanggap_token');
  localStorage.removeItem('tanggap_user');
}
export function simpanUser(user) {
  localStorage.setItem('tanggap_user', JSON.stringify(user));
}
export function ambilUser() {
  try {
    return JSON.parse(localStorage.getItem('tanggap_user') || 'null');
  } catch {
    return null;
  }
}

// --- Fungsi request generik -------------------------------------------------
async function request(path, { method = 'GET', body, token = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  // Tempel token ke header Authorization (kecuali untuk login/register).
  if (token) {
    const t = ambilToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Backend selalu mengembalikan JSON, bahkan untuk error.
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    // 401 = token tidak valid / kedaluwarsa -> lempar error khusus supaya
    // AuthContext bisa mengarahkan user ke halaman login.
    const err = new Error(json.error || `Request gagal (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return json;
}

// Objek api: get/post/patch/delete — cukup panggil sesuai kebutuhan.
export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  // postTanpaToken dipakai untuk login/register (belum punya token).
  postPublik: (path, body) => request(path, { method: 'POST', body, token: false }),
};
