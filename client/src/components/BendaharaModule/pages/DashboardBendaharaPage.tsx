import { useState, useEffect } from 'react';
import { DollarSign, Users, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import type { Pembayaran } from '../types';

export function DashboardBendaharaPage() {
  const [pembayaranMasuk, setPembayaranMasuk] = useState<Pembayaran[]>([]);
  const [totalPendapatan, setTotalPendapatan] = useState(0);
  const [pembayaranTerverifikasi, setPembayaranTerverifikasi] = useState(0);
  const [pembayaranMenunggu, setPembayaranMenunggu] = useState(0);

  useEffect(() => {
    // Fetch data dari API
    fetchPembayaranMasuk();
    fetchDashboardStats();
  }, []);

  const fetchPembayaranMasuk = async () => {
    try {
      const response = await fetch('/api/bendahara/pembayaran', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setPembayaranMasuk(data.data);
        setPembayaranMenunggu(data.data.length);
      }
    } catch (error) {
      console.error('Error fetching pembayaran masuk:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // Fetch total pendapatan dan pembayaran terverifikasi
      // Ini bisa diimplementasikan dengan endpoint terpisah atau query yang lebih kompleks
      const response = await fetch('/api/bendahara/pembayaran', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        const terverifikasi = data.data.filter((p: Pembayaran) => p.status === 'Diverifikasi');
        setPembayaranTerverifikasi(terverifikasi.length);
        setTotalPendapatan(terverifikasi.reduce((sum: number, p: Pembayaran) => sum + p.jumlah_pembayaran, 0));
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Bendahara</h1>
        <p className="text-gray-600">Kelola pembayaran dan keuangan pesantren</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pendapatan</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPendapatan)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pembayaran Terverifikasi</p>
              <p className="text-2xl font-bold text-gray-900">{pembayaranTerverifikasi}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Menunggu Verifikasi</p>
              <p className="text-2xl font-bold text-gray-900">{pembayaranMenunggu}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tren Pembayaran</p>
              <p className="text-2xl font-bold text-gray-900">+12%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Pembayaran Terbaru</h2>
          <p className="text-sm text-gray-600">Daftar pembayaran yang perlu diverifikasi</p>
        </div>
        <div className="p-6">
          {pembayaranMasuk.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada pembayaran yang menunggu verifikasi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pembayaranMasuk.slice(0, 5).map((pembayaran) => (
                <div key={pembayaran.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{pembayaran.nama_santri}</p>
                      <p className="text-sm text-gray-600">{formatDate(pembayaran.dibuat_pada)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(pembayaran.jumlah_pembayaran)}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {pembayaran.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
