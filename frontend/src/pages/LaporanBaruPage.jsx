// ============================================================================
// pages/LaporanBaruPage.jsx — Form membuat laporan error baru.
//
// FIELD FORM:
//   - Sistem yang error (dropdown dari /api/referensi)
//   - Jenis error (dropdown)
//   - Judul (ringkas, misal "SIAK tidak bisa dibuka")
//   - Deskripsi (detail: sejak kapan, pesan error apa, dampaknya)
//   - Lokasi (ruang/loket, misal "Ruang Pelayanan")
//   - Prioritas (Rendah / Sedang / Tinggi / Darurat)
//
// Setelah berhasil, user diarahkan ke halaman detail laporan yang baru dibuat.
// ============================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100';

export default function LaporanBaruPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [referensi, setReferensi] = useState({ sistem: [], jenisError: [], prioritas: [] });
  const [form, setForm] = useState({
    sistem: '', jenis_error: '', judul: '', deskripsi: '', lokasi: '', prioritas: 'Sedang',
  });
  const [error, setError] = useState('');
  const [memuat, setMemuat] = useState(false);

  useEffect(() => {
    api.get('/referensi').then(({ data }) => {
      setReferensi(data);
      // Isi nilai awal dropdown dengan pilihan pertama.
      setForm((f) => ({
        ...f,
        sistem: data.sistem[0] || '',
        jenis_error: data.jenisError[0] || '',
      }));
    }).catch(() => {});
  }, []);

  function ubah(kunci, nilai) {
    setForm((f) => ({ ...f, [kunci]: nilai }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMemuat(true);
    try {
      const { data } = await api.post('/laporan', form);
      // Berhasil -> buka halaman detail laporan baru.
      navigate(`/laporan/${data.id}`);
    } catch (err) {
      setError(err.message || 'Gagal membuat laporan.');
    } finally {
      setMemuat(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Tombol kembali ala mockup */}
      <button onClick={() => navigate('/laporan')} className="text-sm font-medium text-blue-600 hover:underline">
        ← Kembali ke daftar laporan
      </button>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Buat Laporan</h1>
      <p className="mt-1 text-sm text-slate-500">
        Laporkan error sistem di Disdukcapil. Teknisi akan mendapat notifikasi dan segera menindaklanjuti.
        Semakin detail deskripsinya, semakin cepat diperbaiki.
      </p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        {/* Nama Pelapor — tampil saja (diisi otomatis dari akun login),
            seperti di mockup. Backend tetap mencatat pelapor dari token. */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nama Pelapor</label>
          <input
            value={user?.nama || ''}
            readOnly
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Sistem yang Error *</label>
            <select value={form.sistem} onChange={(e) => ubah('sistem', e.target.value)} className={inputClass} required>
              {referensi.sistem.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Jenis Error *</label>
            <select value={form.jenis_error} onChange={(e) => ubah('jenis_error', e.target.value)} className={inputClass} required>
              {referensi.jenisError.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Judul Laporan *</label>
          <input
            value={form.judul}
            onChange={(e) => ubah('judul', e.target.value)}
            className={inputClass}
            placeholder="misal: SIAK tidak bisa dibuka sejak pagi"
            minLength={5}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Deskripsi *</label>
          <textarea
            value={form.deskripsi}
            onChange={(e) => ubah('deskripsi', e.target.value)}
            className={`${inputClass} min-h-28`}
            placeholder="Jelaskan: sejak kapan error, pesan error apa yang muncul, berapa komputer yang terdampak, dan dampak ke pelayanan warga."
            minLength={10}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Lokasi</label>
            <input
              value={form.lokasi}
              onChange={(e) => ubah('lokasi', e.target.value)}
              className={inputClass}
              placeholder="misal: Ruang Pelayanan, Loket 3, MPP"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Prioritas *</label>
            <select value={form.prioritas} onChange={(e) => ubah('prioritas', e.target.value)} className={inputClass} required>
              {referensi.prioritas.map((p) => (
                <option key={p} value={p}>
                  {p}{p === 'Darurat' ? ' — pelayanan lumpuh' : p === 'Tinggi' ? ' — ganggu pelayanan' : p === 'Sedang' ? ' — ganggu sebagian' : ' — tidak mendesak'}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Darurat = pelayanan lumpuh total. Pakai dengan bijak.
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={memuat}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Send size={16} />
            {memuat ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/laporan')}
            className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
