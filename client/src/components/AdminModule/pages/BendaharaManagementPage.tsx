import React, { useMemo, useState } from 'react';
 import { Shield, User, AtSign, Mail, Lock, CheckCircle2, Eye, EyeOff, Save, Wallet } from 'lucide-react';

export function BendaharaManagementPage() {
  const [namaLengkap, setNamaLengkap] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isValid = useMemo(() => {
    const validName = namaLengkap.trim().length > 0;
    const validUsername = username.trim().length >= 3;
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validPassword = password.length >= 6;
    return validName && validUsername && validEmail && validPassword;
  }, [namaLengkap, username, email, password]);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/bendahara/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nama_lengkap: namaLengkap,
          username,
          email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const detail = data?.details ? Object.values(data.details).flat().join(', ') : data?.error;
        throw new Error(detail || 'Gagal membuat akun bendahara.');
      }

      setMessage(data?.data?.message || 'Akun bendahara berhasil dibuat.');
      setNamaLengkap('');
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Bendahara</h1>
            <p className="text-gray-600">Buat akun bendahara untuk mengelola transaksi dan pembayaran</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Buat Akun Bendahara Baru</h2>
              <p className="text-gray-600 text-sm">Isi data berikut untuk menambahkan akun</p>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-green-50 text-green-700 px-4 py-3 border border-green-200">
            <CheckCircle2 className="w-5 h-5 mt-0.5" />
            <div className="text-sm">{message}</div>
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 text-red-700 px-4 py-3 border border-red-200">
            <Shield className="w-5 h-5 mt-0.5 text-red-600" />
            <div className="text-sm">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Gunakan nama lengkap sesuai identitas.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Minimal 3 karakter"
                  required
                  minLength={3}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className={`text-xs ${username.length >= 3 ? 'text-green-600' : 'text-gray-400'}`}>{username.length}/3</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Nama unik untuk login bendahara.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="nama@email.com"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Pastikan email aktif untuk pemulihan akun.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Gunakan kombinasi huruf dan angka untuk keamanan.</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500">Semua kolom wajib diisi.</p>
            <button
              type="submit"
              disabled={loading || !isValid}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white bg-gray-600 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              {loading ? 'Menyimpan...' : 'Buat Akun'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
