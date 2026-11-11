// ============================================================================
// pages/DashboardPage.jsx — Halaman utama setelah login (desain mengikuti
// mockup Flutter: layar "Beranda").
//
// ISI (sesuai mockup):
//   1. Kartu sapaan biru: "Hallo, [Nama]" + tombol besar "Buat Laporan".
//   2. Kartu ringkasan: Total Laporan, Masih Terbuka, Selesai, Laporan Saya.
//   3. Menu Utama: ubin "Status Laporan" & "Riwayat Laporan" (ke daftar laporan).
//   4. Peringatan kalau ada laporan berprioritas Darurat yang belum selesai.
//   5. Ringkasan per status (berapa Dilaporkan, Diverifikasi, dst.).
//   6. Ringkasan per sistem (SIAK berapa, jaringan berapa, dst.).
//   7. Daftar 5 laporan terbaru + tombol ke halaman Laporan.
//
// Data diambil dari GET /api/dashboard/ringkasan (satu request saja).
// ============================================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ClipboardList, CheckCircle2, Clock, User, PlusCircle, FileSearch, History } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { BadgeStatus, BadgePrioritas, BadgeSistem } from '../components/Badge';

function KartuAngka({ label, angka, Icon, warnaIkon }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`rounded-lg p-2 ${warnaIkon}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-1 text-3xl font-bold text-slate-900">{angka}</p>
    </div>
  );
}

// Ubin Menu Utama ala mockup: ikon biru di atas latar biru muda.
function UbinMenu({ ke, label, Icon }) {
  return (
    <Link
      to={ke}
      className="flex flex-col items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-5 text-center shadow-sm transition hover:bg-blue-100"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
        <Icon size={24} />
      </span>
      <span className="text-sm font-semibold text-slate-800">{label}</span>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [ringkasan, setRingkasan] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function muat() {
      try {
        const { data } = await api.get('/dashboard/ringkasan');
        setRingkasan(data);
      } catch (err) {
        setError(err.message);
      }
    }
    muat();
  }, []);

  if (error) {
    return <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">Gagal memuat dashboard: {error}</div>;
  }
  if (!ringkasan) {
    return <p className="py-10 text-center text-sm text-slate-500">Memuat dashboard...</p>;
  }

  const jumlahDarurat = ringkasan.perPrioritas?.Darurat || 0;
  const jumlahSelesai = ringkasan.perStatus?.Selesai || 0;

  return (
    <div className="space-y-6">
      {/* Kartu sapaan biru ala mockup + tombol Buat Laporan */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 p-5 shadow-md sm:p-6">
        <p className="text-sm text-blue-100">Hallo,</p>
        <h1 className="text-2xl font-bold text-white">{user?.nama}</h1>
        <p className="mt-1 text-sm text-blue-100">
          {ringkasan.terbuka > 0
            ? `Ada ${ringkasan.terbuka} laporan error yang belum selesai.`
            : 'Semua sistem terpantau normal. Tidak ada laporan yang belum selesai.'}
        </p>
        <Link
          to="/laporan/baru"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50 sm:w-auto sm:px-6"
        >
          <PlusCircle size={18} />
          Buat Laporan
        </Link>
      </div>

      {/* Peringatan darurat */}
      {jumlahDarurat > 0 && ringkasan.terbuka > 0 && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 ring-1 ring-red-200">
          <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={20} />
          <div>
            <p className="text-sm font-semibold text-red-800">
              Ada {jumlahDarurat} laporan berprioritas Darurat.
            </p>
            <p className="text-sm text-red-700">
              Segera cek daftar laporan dan koordinasikan dengan teknisi.
            </p>
          </div>
        </div>
      )}

      {/* Kartu angka — Total Laporan & Selesai seperti di mockup */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KartuAngka label="Total Laporan" angka={ringkasan.total} Icon={ClipboardList} warnaIkon="bg-blue-50 text-blue-600" />
        <KartuAngka label="Masih Terbuka" angka={ringkasan.terbuka} Icon={Clock} warnaIkon="bg-amber-50 text-amber-600" />
        <KartuAngka label="Selesai" angka={jumlahSelesai} Icon={CheckCircle2} warnaIkon="bg-green-50 text-green-600" />
        <KartuAngka label="Laporan Saya" angka={ringkasan.milikSaya} Icon={User} warnaIkon="bg-blue-50 text-blue-600" />
      </div>

      {/* Menu Utama ala mockup */}
      <div>
        <h2 className="text-base font-semibold text-slate-900">Menu Utama</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:max-w-md">
          <UbinMenu ke="/laporan" label="Status Laporan" Icon={FileSearch} />
          <UbinMenu ke="/laporan" label="Riwayat Laporan" Icon={History} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Per status */}
        <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Laporan per Status</h2>
          <div className="mt-4 space-y-3">
            {['Dilaporkan', 'Diverifikasi', 'Sedang Diperbaiki', 'Selesai'].map((status) => {
              const jumlah = ringkasan.perStatus?.[status] || 0;
              const persen = ringkasan.total ? Math.round((jumlah / ringkasan.total) * 100) : 0;
              return (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <BadgeStatus status={status} />
                    <span className="font-medium text-slate-700">{jumlah} laporan ({persen}%)</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${persen}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per sistem */}
        <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Laporan per Sistem</h2>
          <div className="mt-4 space-y-2">
            {Object.entries(ringkasan.perSistem || {}).length === 0 && (
              <p className="text-sm text-slate-500">Belum ada laporan.</p>
            )}
            {Object.entries(ringkasan.perSistem || {})
              .sort((a, b) => b[1] - a[1])
              .map(([sistem, jumlah]) => (
                <div key={sistem} className="flex items-center justify-between border-b border-blue-50 py-2 text-sm last:border-0">
                  <BadgeSistem sistem={sistem} />
                  <span className="font-medium text-slate-700">{jumlah} laporan</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Laporan terbaru */}
      <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Laporan Terbaru</h2>
          <Link to="/laporan" className="text-sm font-medium text-blue-600 hover:underline">
            Lihat semua →
          </Link>
        </div>
        <div className="mt-3 divide-y divide-slate-100">
          {ringkasan.terbaru.length === 0 && (
            <p className="py-4 text-sm text-slate-500">Belum ada laporan.</p>
          )}
          {ringkasan.terbaru.map((l) => (
            <Link key={l.id} to={`/laporan/${l.id}`} className="flex flex-wrap items-center gap-2 py-3 hover:bg-blue-50/50">
              <span className="font-mono text-sm font-medium text-slate-500">{l.kode}</span>
              <span className="flex-1 text-sm font-medium text-slate-900">{l.judul}</span>
              <BadgePrioritas prioritas={l.prioritas} />
              <BadgeStatus status={l.status} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
