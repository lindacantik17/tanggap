// ============================================================================
// pages/LaporanListPage.jsx — Daftar semua laporan + filter.
//
// FITUR:
//   - Filter: status, sistem, prioritas, dan "hanya laporan saya".
//   - Setiap baris: kode, judul, sistem, prioritas, status, pelapor, tanggal.
//   - Klik baris -> halaman detail.
//   - Daftar pilihan filter (sistem, jenis error, dll.) diambil dari
//     GET /api/referensi supaya selalu sama dengan backend.
// ============================================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { BadgeStatus, BadgePrioritas, BadgeSistem } from '../components/Badge';

export default function LaporanListPage() {
  const [laporan, setLaporan] = useState([]);
  const [referensi, setReferensi] = useState({ sistem: [], prioritas: [], status: [] });
  const [filter, setFilter] = useState({ status: '', sistem: '', prioritas: '', milik: '' });
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState('');

  // Muat daftar referensi sekali saat halaman dibuka.
  useEffect(() => {
    api.get('/referensi').then(({ data }) => setReferensi(data)).catch(() => {});
  }, []);

  // Muat ulang daftar laporan setiap kali filter berubah.
  useEffect(() => {
    async function muat() {
      setMemuat(true);
      setError('');
      try {
        // Bangun query string hanya dari filter yang terisi.
        const params = new URLSearchParams();
        if (filter.status) params.set('status', filter.status);
        if (filter.sistem) params.set('sistem', filter.sistem);
        if (filter.prioritas) params.set('prioritas', filter.prioritas);
        if (filter.milik) params.set('milik', 'saya');
        const query = params.toString();
        const { data } = await api.get(`/laporan${query ? `?${query}` : ''}`);
        setLaporan(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setMemuat(false);
      }
    }
    muat();
  }, [filter]);

  function ubahFilter(kunci, nilai) {
    setFilter((f) => ({ ...f, [kunci]: nilai }));
  }

  const selectClass =
    'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100';

// Tab status cepat ala mockup (layar "Status & Riwayat"): Semua / per status.
// Tab ini hanya mengatur filter.status yang sudah ada — bukan filter baru.
const TAB_STATUS = ['Semua', 'Dilaporkan', 'Diverifikasi', 'Sedang Diperbaiki', 'Selesai'];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daftar Laporan Error</h1>
          <p className="text-sm text-slate-500">Semua laporan error di Disdukcapil — klik untuk melihat detail &amp; progres.</p>
        </div>
        <Link
          to="/laporan/baru"
          className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Lapor Error
        </Link>
      </div>

      {/* Tab status cepat ala mockup */}
      <div className="flex flex-wrap gap-2">
        {TAB_STATUS.map((t) => {
          const aktif = (t === 'Semua' && !filter.status) || filter.status === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => ubahFilter('status', t === 'Semua' ? '' : t)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ${
                aktif
                  ? 'bg-blue-600 text-white ring-blue-600'
                  : 'bg-white text-slate-600 ring-slate-300 hover:bg-blue-50'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
        <select value={filter.sistem} onChange={(e) => ubahFilter('sistem', e.target.value)} className={selectClass}>
          <option value="">Semua Sistem</option>
          {referensi.sistem.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.prioritas} onChange={(e) => ubahFilter('prioritas', e.target.value)} className={selectClass}>
          <option value="">Semua Prioritas</option>
          {referensi.prioritas.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={filter.milik === 'saya'}
            onChange={(e) => ubahFilter('milik', e.target.checked ? 'saya' : '')}
            className="accent-blue-600"
          />
          Hanya laporan saya
        </label>
        {(filter.status || filter.sistem || filter.prioritas || filter.milik) && (
          <button
            onClick={() => setFilter({ status: '', sistem: '', prioritas: '', milik: '' })}
            className="rounded-md px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            Reset filter
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">Gagal memuat laporan: {error}</div>
      )}

      {/* Daftar laporan */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {memuat ? (
          <p className="p-6 text-center text-sm text-slate-500">Memuat laporan...</p>
        ) : laporan.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">
            Tidak ada laporan yang cocok dengan filter. Coba ubah filter atau buat laporan baru.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {laporan.map((l) => (
              <li key={l.id}>
                <Link to={`/laporan/${l.id}`} className="block px-4 py-4 hover:bg-blue-50/50 sm:px-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-medium text-slate-500">{l.kode}</span>
                    <span className="flex-1 text-sm font-semibold text-slate-900 sm:text-base">{l.judul}</span>
                    <BadgePrioritas prioritas={l.prioritas} />
                    <BadgeStatus status={l.status} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <BadgeSistem sistem={l.sistem} />
                    <span>{l.jenis_error}</span>
                    <span>Pelapor: {l.pelapor_nama}</span>
                    <span>Lokasi: {l.lokasi}</span>
                    <span>{l.created_at}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-slate-400">Menampilkan {laporan.length} laporan.</p>
    </div>
  );
}
