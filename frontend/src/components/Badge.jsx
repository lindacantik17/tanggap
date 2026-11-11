// ============================================================================
// components/Badge.jsx — Lencana (badge) warna untuk status & prioritas.
//
// Satu komponen kecil dipakai di semua halaman supaya warna status konsisten:
//   Dilaporkan        -> abu-abu
//   Diverifikasi      -> biru
//   Sedang Diperbaiki -> kuning/oranye
//   Selesai           -> hijau
// Prioritas Darurat -> merah, Tinggi -> oranye, Sedang -> biru, Rendah -> abu.
// ============================================================================

const WARNA_STATUS = {
  'Dilaporkan': 'bg-slate-100 text-slate-700 ring-slate-300',
  'Diverifikasi': 'bg-blue-50 text-blue-700 ring-blue-300',
  'Sedang Diperbaiki': 'bg-amber-50 text-amber-700 ring-amber-300',
  'Selesai': 'bg-emerald-50 text-emerald-700 ring-emerald-300',
};

const WARNA_PRIORITAS = {
  'Rendah': 'bg-slate-100 text-slate-600 ring-slate-300',
  'Sedang': 'bg-blue-50 text-blue-700 ring-blue-300',
  'Tinggi': 'bg-orange-50 text-orange-700 ring-orange-300',
  'Darurat': 'bg-red-50 text-red-700 ring-red-300',
};

export function BadgeStatus({ status }) {
  const warna = WARNA_STATUS[status] || WARNA_STATUS['Dilaporkan'];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${warna}`}>
      {status}
    </span>
  );
}

export function BadgePrioritas({ prioritas }) {
  const warna = WARNA_PRIORITAS[prioritas] || WARNA_PRIORITAS['Sedang'];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${warna}`}>
      {prioritas}
    </span>
  );
}

// Badge kecil untuk nama sistem (SIAK, Jaringan, dst.) — netral abu-abu.
export function BadgeSistem({ sistem }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-300">
      {sistem}
    </span>
  );
}
