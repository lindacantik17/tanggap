// ============================================================================
// components/Layout.jsx — Kerangka halaman: header, navigasi, dan lonceng
// notifikasi. Semua halaman (kecuali login) dibungkus komponen ini.
//
// ISI HEADER:
//   - Logo + nama aplikasi TANGGAP
//   - Navigasi: Dashboard | Laporan | Lapor Error | (Admin: Kelola)
//   - Lonceng notifikasi: angka = jumlah belum dibaca; klik -> dropdown
//     daftar notifikasi; tombol "tandai semua dibaca".
//   - Nama user + role + tombol Keluar.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, LayoutDashboard, FileText, PlusCircle, ShieldCheck, LogOut } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

function itemNav(ke, label, Icon) {
  return (
    <NavLink
      key={ke}
      to={ke}
      className={({ isActive }) =>
        `flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium ${
          isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  );
}

export default function Layout({ children }) {
  const { user, adalahAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [belumDibaca, setBelumDibaca] = useState(0);
  const [notifikasi, setNotifikasi] = useState([]);
  const [panelBuka, setPanelBuka] = useState(false);
  const panelRef = useRef(null);

  // Ambil jumlah notifikasi belum dibaca + daftar 5 terbaru.
  // Dipanggil saat komponen dimuat dan setiap kali panel lonceng dibuka.
  async function muatNotifikasi() {
    try {
      const { data } = await api.get('/notifikasi/belum-dibaca');
      setBelumDibaca(data.belumDibaca);
      const daftar = await api.get('/notifikasi?limit=5');
      setNotifikasi(daftar.data);
    } catch {
      // Kalau gagal (misal token habis), biarkan 0 — halaman akan menangani 401.
    }
  }

  useEffect(() => {
    muatNotifikasi();
    // Refresh otomatis tiap 60 detik supaya angka lonceng tetap segar.
    const timer = setInterval(muatNotifikasi, 60000);
    return () => clearInterval(timer);
  }, []);

  // Tutup panel kalau klik di luar panel.
  useEffect(() => {
    function tutupSaatKlikLuar(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setPanelBuka(false);
    }
    document.addEventListener('mousedown', tutupSaatKlikLuar);
    return () => document.removeEventListener('mousedown', tutupSaatKlikLuar);
  }, []);

  async function tandaiSemuaDibaca() {
    await api.patch('/notifikasi/baca-semua');
    setBelumDibaca(0);
    setNotifikasi((daftar) => daftar.map((n) => ({ ...n, dibaca: 1 })));
  }

  function keluar() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="leading-tight">
              <span className="block text-base font-bold tracking-wide text-blue-900">TANGGAP</span>
              <span className="block text-[11px] text-slate-500">Lapor Kendala, Kami Tindaklanjuti</span>
            </span>
          </Link>

          {/* Navigasi desktop */}
          <nav className="hidden items-center gap-1 md:flex">
            {itemNav('/', 'Dashboard', LayoutDashboard)}
            {itemNav('/laporan', 'Laporan', FileText)}
            {itemNav('/laporan/baru', 'Lapor Error', PlusCircle)}
            {adalahAdmin && itemNav('/admin', 'Kelola (Admin)', ShieldCheck)}
          </nav>

          <div className="flex items-center gap-2">
            {/* Lonceng notifikasi */}
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => { setPanelBuka((b) => !b); muatNotifikasi(); }}
                className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100"
                title="Notifikasi"
              >
                <Bell size={20} />
                {belumDibaca > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
                    {belumDibaca > 99 ? '99+' : belumDibaca}
                  </span>
                )}
              </button>

              {panelBuka && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                    <span className="text-sm font-semibold text-slate-900">Notifikasi</span>
                    <button onClick={tandaiSemuaDibaca} className="text-xs font-medium text-blue-600 hover:underline">
                      Tandai semua dibaca
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifikasi.length === 0 && (
                      <p className="px-4 py-6 text-center text-sm text-slate-500">Belum ada notifikasi.</p>
                    )}
                    {notifikasi.map((n) => (
                      <Link
                        key={n.id}
                        to={n.laporan_id ? `/laporan/${n.laporan_id}` : '/laporan'}
                        onClick={() => setPanelBuka(false)}
                        className={`block border-b border-slate-50 px-4 py-3 text-sm hover:bg-slate-50 ${n.dibaca ? 'text-slate-500' : 'bg-blue-50/50 font-medium text-slate-800'}`}
                      >
                        {n.pesan}
                        <span className="mt-0.5 block text-xs text-slate-400">{n.created_at}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Info user + keluar */}
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium text-slate-900">{user?.nama}</p>
              <p className="text-xs text-slate-500">{user?.role === 'admin' ? 'Admin / Teknisi' : 'Petugas'} · {user?.username}</p>
            </div>
            <button onClick={keluar} className="rounded-full p-2 text-slate-600 hover:bg-slate-100" title="Keluar">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Navigasi mobile (di bawah header) */}
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
          {itemNav('/', 'Dashboard', LayoutDashboard)}
          {itemNav('/laporan', 'Laporan', FileText)}
          {itemNav('/laporan/baru', 'Lapor Error', PlusCircle)}
          {adalahAdmin && itemNav('/admin', 'Kelola (Admin)', ShieldCheck)}
        </nav>
      </header>

      {/* ================= ISI HALAMAN ================= */}
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        TANGGAP — Sistem Helpdesk Internal Disdukcapil Kota Tegal · Proyek Belajar
      </footer>
    </div>
  );
}
