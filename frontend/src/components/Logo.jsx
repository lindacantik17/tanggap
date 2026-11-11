// ============================================================================
// components/Logo.jsx — Logo TANGGAP mengikuti mockup Flutter.
//
// Logo mockup: ikon headset biru dengan lencana tanda seru (!) — melambangkan
// helpdesk: petugas memakai headset, siap menindaklanjuti kendala.
// Dipakai di header (Layout) dan halaman login. Ukuran bisa diatur lewat
// prop `size` (ukuran ikon) dan `kotak` (ukuran kotak biru).
// ============================================================================

import { Headphones } from 'lucide-react';

export default function Logo({ size = 20, kotak = 'h-9 w-9', rounded = 'rounded-lg' }) {
  return (
    <span className={`relative flex ${kotak} shrink-0 items-center justify-center ${rounded} bg-blue-600 text-white`}>
      <Headphones size={size} />
      {/* Lencana tanda seru seperti di mockup */}
      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-800 text-[10px] font-bold leading-none text-white ring-2 ring-white">
        !
      </span>
    </span>
  );
}
