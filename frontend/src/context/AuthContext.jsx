// ============================================================================
// context/AuthContext.jsx — Menyimpan status login untuk seluruh aplikasi.
//
// KONSEP REACT CONTEXT:
// Daripada setiap halaman mengecek localStorage sendiri, status login
// disimpan SATU kali di sini (user + token), lalu halaman mana pun bisa
// memakainya lewat hook useAuth().
//   const { user, login, logout, sudahLogin } = useAuth();
//
// ALUR:
//   - Saat aplikasi dimuat, cek localStorage: ada token + user? Kalau ada,
//     anggap sudah login (token masih akan diverifikasi server di setiap
//     request; kalau 401, otomatis logout).
//   - login(username, password): panggil API, simpan token + user.
//   - logout(): hapus token + user, kembali ke halaman login.
// ============================================================================

import { createContext, useContext, useEffect, useState } from 'react';
import { api, ambilToken, ambilUser, simpanToken, simpanUser, hapusToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // State awal dibaca dari localStorage supaya refresh halaman tidak
  // membuat user harus login ulang (selama token belum kedaluwarsa).
  const [user, setUser] = useState(() => ambilUser());
  const [memuat, setMemuat] = useState(true);

  // Saat pertama dimuat, verifikasi token ke server (/api/auth/me).
  // Kalau token sudah tidak valid, hapus dan anggap belum login.
  useEffect(() => {
    async function verifikasi() {
      if (ambilToken()) {
        try {
          const { user: userServer } = await api.get('/auth/me');
          setUser(userServer);
          simpanUser(userServer);
        } catch {
          hapusToken();
          setUser(null);
        }
      }
      setMemuat(false);
    }
    verifikasi();
  }, []);

  async function login(username, password) {
    const { token, user: userLogin } = await api.postPublik('/auth/login', { username, password });
    simpanToken(token);
    simpanUser(userLogin);
    setUser(userLogin);
    return userLogin;
  }

  function logout() {
    hapusToken();
    setUser(null);
  }

  const value = {
    user,
    sudahLogin: !!user,
    adalahAdmin: user?.role === 'admin',
    memuat,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook untuk memakai auth di halaman/komponen mana pun.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}
