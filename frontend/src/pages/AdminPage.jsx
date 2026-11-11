// ============================================================================
// pages/AdminPage.jsx — Halaman kelola untuk Admin / Teknisi.
//
// ISI:
//   - Statistik ringkas (kartu angka, sama seperti dashboard).
//   - Tabel SEMUA laporan dengan aksi cepat: ubah status (dropdown) langsung
//     dari tabel, tanpa harus membuka halaman detail.
//   - Filter status cepat (tab): Semua / Dilaporkan / Diverifikasi /
//     Sedang Diperbaiki / Selesai.
//
// CATATAN:
// Halaman ini HANYA untuk role admin. Penjaga ganda:
//   1. Di App.jsx, route /admin hanya dirender kalau user adalah admin.
//   2. Di backend, endpoint ubah status juga menolak non-admin (403).
// Jangan mengandalkan penjaga frontend saja — backend adalah benteng terakhir.
// ============================================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { BadgeStatus, BadgePrioritas } from '../components/Badge';

const TAB_STATUS = ['Semua', 'Dilaporkan', 'Diverifikasi', 'Sedang Diperbaiki', 'Selesai'];

const TRANSISI = {
  'Dilaporkan': ['Diverifikasi'],
  'Diverifikasi': ['Sedang Diperbaiki', 'Dilaporkan'],
  'Sedang Diperbaiki': ['Selesai', 'Diverifikasi'],
  'Selesai': ['Diverifikasi'],
};

export default function AdminPage() {
  const [laporan, setLaporan] = useState([]);
  const [tab, setTab] = useState('Semua');
  const [pesan, setPesan] = useState('');
  const [error, setError] = useState('');

  async function muat() {
    try {
      const query = tab === 'Semua' ? '' : `?status=${encodeURIComponent(tab)}`;
      const { data } = await api.get(`/laporan${query}`);
      setLaporan(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { muat(); }, [tab]);

  async function ubahStatusCepat(laporanItem, statusBaru) {
    if (!statusBaru) return;
    setPesan('');
    setError('');
    try {
      const { data } = await api.patch(`/laporan/${laporanItem.id}/status`, { status: statusBaru });
      setPesan(data.message);
      muat();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kelola Laporan (Admin / Teknisi)</h1>
        <p className="text-sm text-slate-500">
          Verifikasi laporan masuk, ubah status saat mulai diperbaiki, dan tandai selesai setelah beres.
          Pelapor otomatis mendapat notifikasi setiap kali status berubah.
        </p>
      </div>

      {pesan && (
        <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-600 ring-1 ring-blue-200">{pesan}</div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
      )}

      {/* Tab filter status */}
      <div className="flex flex-wrap gap-2">
        {TAB_STATUS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ${
              tab === t
                ? 'bg-blue-600 text-white ring-blue-600'
                : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'
            }`}
          >
            {t}
            {t !== 'Semua' && ` (${laporan.length})`}
          </button>
        ))}
      </div>

      {/* Tabel laporan */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Sistem</th>
              <th className="px-4 py-3">Prioritas</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ubah Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {laporan.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Tidak ada laporan pada tab ini.</td></tr>
            )}
            {laporan.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-slate-500">{l.kode}</td>
                <td className="px-4 py-3">
                  <Link to={`/laporan/${l.id}`} className="font-medium text-slate-900 hover:text-blue-600 hover:underline">
                    {l.judul}
                  </Link>
                  <span className="block text-xs text-slate-400">{l.pelapor_nama} · {l.created_at}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{l.sistem}</td>
                <td className="px-4 py-3"><BadgePrioritas prioritas={l.prioritas} /></td>
                <td className="px-4 py-3"><BadgeStatus status={l.status} /></td>
                <td className="px-4 py-3">
                  <select
                    value=""
                    onChange={(e) => ubahStatusCepat(l, e.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-600"
                  >
                    <option value="">Ubah ke...</option>
                    {(TRANSISI[l.status] || []).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">
        Menampilkan {laporan.length} laporan. Untuk komentar &amp; riwayat lengkap, buka halaman detail laporan.
      </p>
    </div>
  );
}
