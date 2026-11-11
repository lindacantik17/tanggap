// ============================================================================
// pages/LaporanDetailPage.jsx — Detail satu laporan.
//
// ISI:
//   - Informasi laporan: kode, judul, sistem, jenis error, prioritas, status,
//     pelapor, lokasi, tanggal.
//   - Ubah status (HANYA admin): dropdown berisi status yang BOLEH dituju
//     dari status sekarang (aturan transisi dari backend). Kalau backend
//     menolak, tampilkan pesan errornya.
//   - Hapus laporan (HANYA admin, dengan konfirmasi).
//   - Komentar: daftar komentar + form tambah komentar (semua role).
//   - Riwayat status: jejak audit siapa mengubah status kapan.
// ============================================================================

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { BadgeStatus, BadgePrioritas, BadgeSistem } from '../components/Badge';

// Transisi yang diizinkan — HARUS sama dengan TRANSISI_STATUS di backend
// (backend/src/routes/laporan.js). Frontend menampilkannya supaya user
// tidak memilih status yang pasti ditolak, tapi backend tetap yang menjadi
// penjaga terakhir (jangan percaya validasi di frontend saja!).
const TRANSISI = {
  'Dilaporkan': ['Diverifikasi'],
  'Diverifikasi': ['Sedang Diperbaiki', 'Dilaporkan'],
  'Sedang Diperbaiki': ['Selesai', 'Diverifikasi'],
  'Selesai': ['Diverifikasi'],
};

export default function LaporanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, adalahAdmin } = useAuth();
  const [laporan, setLaporan] = useState(null);
  const [error, setError] = useState('');
  const [pesan, setPesan] = useState('');
  const [statusBaru, setStatusBaru] = useState('');
  const [isiKomentar, setIsiKomentar] = useState('');

  async function muat() {
    try {
      const { data } = await api.get(`/laporan/${id}`);
      setLaporan(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { muat(); }, [id]);

  async function ubahStatus(e) {
    e.preventDefault();
    if (!statusBaru) return;
    setPesan('');
    setError('');
    try {
      const { data } = await api.patch(`/laporan/${id}/status`, { status: statusBaru });
      setPesan(data.message);
      setStatusBaru('');
      muat();
    } catch (err) {
      setError(err.message);
    }
  }

  async function tambahKomentar(e) {
    e.preventDefault();
    if (!isiKomentar.trim()) return;
    setError('');
    try {
      await api.post(`/laporan/${id}/komentar`, { isi: isiKomentar });
      setIsiKomentar('');
      muat();
    } catch (err) {
      setError(err.message);
    }
  }

  async function hapusLaporan() {
    if (!window.confirm(`Hapus laporan ${laporan.kode}? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await api.del(`/laporan/${id}`);
      navigate('/laporan');
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !laporan) {
    return <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">{error}</div>;
  }
  if (!laporan) {
    return <p className="py-10 text-center text-sm text-slate-500">Memuat detail laporan...</p>;
  }

  const pilihanStatus = TRANSISI[laporan.status] || [];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Tombol kembali */}
      <button onClick={() => navigate('/laporan')} className="text-sm font-medium text-blue-600 hover:underline">
        ← Kembali ke daftar laporan
      </button>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
      )}
      {pesan && (
        <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-600 ring-1 ring-blue-200">{pesan}</div>
      )}

      {/* Kartu utama */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-medium text-slate-500">{laporan.kode}</span>
          <BadgeStatus status={laporan.status} />
          <BadgePrioritas prioritas={laporan.prioritas} />
          <BadgeSistem sistem={laporan.sistem} />
        </div>
        <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{laporan.judul}</h1>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{laporan.deskripsi}</p>

        <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Jenis Error</dt><dd className="font-medium text-slate-900">{laporan.jenis_error}</dd></div>
          <div><dt className="text-slate-500">Lokasi</dt><dd className="font-medium text-slate-900">{laporan.lokasi}</dd></div>
          <div><dt className="text-slate-500">Pelapor</dt><dd className="font-medium text-slate-900">{laporan.pelapor_nama} ({laporan.pelapor_username})</dd></div>
          <div><dt className="text-slate-500">Dibuat</dt><dd className="font-medium text-slate-900">{laporan.created_at}</dd></div>
          <div><dt className="text-slate-500">Terakhir Diubah</dt><dd className="font-medium text-slate-900">{laporan.updated_at}</dd></div>
        </dl>
      </div>

      {/* Ubah status (admin saja) */}
      {adalahAdmin && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Ubah Status (Admin / Teknisi)</h2>
          {pilihanStatus.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Tidak ada transisi status dari sini.</p>
          ) : (
            <form onSubmit={ubahStatus} className="mt-3 flex flex-wrap gap-2">
              <select
                value={statusBaru}
                onChange={(e) => setStatusBaru(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              >
                <option value="">Pilih status baru...</option>
                {pilihanStatus.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Simpan Status
              </button>
            </form>
          )}
          <button onClick={hapusLaporan} className="mt-4 text-sm font-medium text-red-600 hover:underline">
            Hapus laporan ini
          </button>
        </div>
      )}

      {/* Komentar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Komentar &amp; Update Progres</h2>
        <div className="mt-3 space-y-3">
          {laporan.komentar.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada komentar. Teknisi biasanya menulis progres perbaikan di sini.</p>
          )}
          {laporan.komentar.map((k) => (
            <div key={k.id} className="rounded-lg bg-slate-50 px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-800">{k.penulis_nama}</span>
                <span className="rounded bg-slate-200 px-1.5 py-0.5">{k.penulis_role === 'admin' ? 'Teknisi' : 'Petugas'}</span>
                <span>{k.created_at}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{k.isi}</p>
            </div>
          ))}
        </div>
        <form onSubmit={tambahKomentar} className="mt-4 flex gap-2">
          <input
            value={isiKomentar}
            onChange={(e) => setIsiKomentar(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            placeholder={adalahAdmin ? 'Tulis progres perbaikan...' : 'Tambah info (misal: error masih muncul)...'}
          />
          <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Kirim
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-400">Login sebagai: {user?.nama} ({user?.role})</p>
      </div>

      {/* Riwayat status */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Riwayat Status</h2>
        <ol className="mt-3 space-y-2">
          {laporan.riwayat.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-500">{r.created_at}</span>
              <span>
                {r.status_lama ? (
                  <><BadgeStatus status={r.status_lama} /> <span className="mx-1">→</span></>
                ) : 'Dibuat dengan status '}
                <BadgeStatus status={r.status_baru} />
              </span>
              <span className="text-xs text-slate-400">oleh {r.diubah_oleh_nama}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
