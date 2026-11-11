// ============================================================================
// pages/LoginPage.jsx — Halaman login (desain mengikuti mockup Flutter).
//
// TAMPILAN (sesuai mockup):
//   - Logo headset biru + lencana "!" di atas, judul TANGGAP tebal biru tua,
//     tagline "Lapor Kendala, Kami Tindaklanjuti".
//   - Input Username/Email dan Password dengan ikon di dalam kolom.
//   - Tombol biru "Login ->".
//   - Latar biru muda dengan hiasan lingkaran biru lembut.
//
// ALUR (tidak berubah):
//   1. User mengetik username + password, klik Login.
//   2. AuthContext.login() memanggil POST /api/auth/login.
//   3. Kalau berhasil, token disimpan dan user diarahkan ke Dashboard.
//   4. Kalau gagal, tampilkan pesan error dari server.
//
// AKUN DEMO (ditampilkan di halaman supaya Linda langsung bisa mencoba):
//   admin    / admin123    (Admin / Teknisi)
//   petugas1 / petugas123  (Petugas)
// Tombol "isi otomatis" hanya mengisi form — user tetap harus klik Login
// (ini untuk belajar, bukan jalan pintas login).
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [memuat, setMemuat] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); // cegah reload halaman (perilaku default form)
    setError('');
    setMemuat(true);
    try {
      await login(username.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login gagal.');
    } finally {
      setMemuat(false);
    }
  }

  // Mengisi form dengan akun demo (tidak langsung login).
  function isiDemo(u, p) {
    setUsername(u);
    setPassword(p);
    setError('');
  }

  return (
    <div className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-4 py-8">
      {/* Hiasan latar biru muda seperti mockup (lingkaran lembut) */}
      <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-200/50" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-blue-200/40" />

      <div className="relative w-full max-w-md rounded-2xl border border-blue-100 bg-white p-6 shadow-md sm:p-8">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <Logo size={34} kotak="h-16 w-16" rounded="rounded-2xl" />
          </div>
          <h1 className="text-3xl font-bold tracking-wide text-blue-900">TANGGAP</h1>
          <p className="mt-1 text-sm font-medium text-blue-700">Lapor Kendala, Kami Tindaklanjuti</p>
          <p className="mt-2 text-sm text-slate-500">
            Aplikasi pelaporan kendala teknis bagi pegawai di lingkungan Disdukcapil Kota Tegal.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">Username / Email</label>
            <div className="relative">
              <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder="misal: petugas1"
                autoComplete="username"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={memuat}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <LogIn size={16} />
            {memuat ? 'Memeriksa...' : 'Login →'}
          </button>
        </form>

        {/* Akun demo */}
        <div className="mt-6 rounded-md bg-blue-50 p-3 text-sm">
          <p className="font-medium text-slate-700">Akun demo (klik untuk mengisi form):</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => isiDemo('admin', 'admin123')}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700"
            >
              Admin — admin / admin123
            </button>
            <button
              type="button"
              onClick={() => isiDemo('petugas1', 'petugas123')}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700"
            >
              Petugas — petugas1 / petugas123
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
