// ============================================================================
// App.jsx — Routing aplikasi TANGGAP.
//
// STRUKTUR ROUTE:
//   /login          — halaman login (publik)
//   /               — Dashboard (butuh login)
//   /laporan        — daftar laporan (butuh login)
//   /laporan/baru   — form lapor error (butuh login)
//   /laporan/:id    — detail laporan (butuh login)
//   /admin          — kelola laporan (butuh login + role admin)
//
// PENJAGA ROUTE (Route Guard):
//   - <ButuhLogin>: kalau belum login, tendang ke /login.
//   - <ButuhAdmin>: kalau bukan admin, tampilkan pesan akses ditolak.
// Ini penjaga di SISI FRONTEND (untuk UX). Penjaga yang sebenarnya tetap
// di backend — setiap request API juga dicek token & role-nya.
// ============================================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LaporanListPage from './pages/LaporanListPage';
import LaporanBaruPage from './pages/LaporanBaruPage';
import LaporanDetailPage from './pages/LaporanDetailPage';
import AdminPage from './pages/AdminPage';

// Kalau belum login, alihkan ke /login.
function ButuhLogin({ children }) {
  const { sudahLogin, memuat } = useAuth();
  if (memuat) return <p className="py-16 text-center text-sm text-slate-500">Memuat...</p>;
  if (!sudahLogin) return <Navigate to="/login" replace />;
  return children;
}

// Kalau sudah login tapi membuka /login, alihkan ke dashboard.
function SudahLogin({ children }) {
  const { sudahLogin, memuat } = useAuth();
  if (memuat) return <p className="py-16 text-center text-sm text-slate-500">Memuat...</p>;
  if (sudahLogin) return <Navigate to="/" replace />;
  return children;
}

// Halaman admin: hanya untuk role admin.
function ButuhAdmin({ children }) {
  const { adalahAdmin } = useAuth();
  if (!adalahAdmin) {
    return (
      <div className="rounded-md bg-red-50 p-6 text-center text-sm text-red-700 ring-1 ring-red-200">
        Akses ditolak. Halaman ini hanya untuk Admin / Teknisi.
      </div>
    );
  }
  return children;
}

// Pembungkus: halaman yang butuh login ditampilkan di dalam Layout
// (header + navigasi + lonceng notifikasi).
function DenganLayout({ children }) {
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<SudahLogin><LoginPage /></SudahLogin>} />
          <Route path="/" element={<ButuhLogin><DenganLayout><DashboardPage /></DenganLayout></ButuhLogin>} />
          <Route path="/laporan" element={<ButuhLogin><DenganLayout><LaporanListPage /></DenganLayout></ButuhLogin>} />
          <Route path="/laporan/baru" element={<ButuhLogin><DenganLayout><LaporanBaruPage /></DenganLayout></ButuhLogin>} />
          <Route path="/laporan/:id" element={<ButuhLogin><DenganLayout><LaporanDetailPage /></DenganLayout></ButuhLogin>} />
          <Route
            path="/admin"
            element={
              <ButuhLogin>
                <DenganLayout>
                  <ButuhAdmin><AdminPage /></ButuhAdmin>
                </DenganLayout>
              </ButuhLogin>
            }
          />
          {/* Route yang tidak dikenal -> kembali ke dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
