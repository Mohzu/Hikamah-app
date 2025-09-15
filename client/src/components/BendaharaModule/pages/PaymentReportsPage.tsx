import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Calendar, Download } from 'lucide-react';
import type { Pembayaran } from '../types';

export function PaymentReportsPage() {
  const [pembayaranData, setPembayaranData] = useState<Pembayaran[]>([]);
  const [filteredData, setFilteredData] = useState<Pembayaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    fetchPembayaranData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [pembayaranData, dateRange]);

  const fetchPembayaranData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bendahara/pembayaran', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setPembayaranData(data.data);
      }
    } catch (error) {
      console.error('Error fetching pembayaran data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...pembayaranData];

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(pembayaran => {
        const pembayaranDate = new Date(pembayaran.dibuat_pada);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return pembayaranDate >= startDate && pembayaranDate <= endDate;
      });
    }

    setFilteredData(filtered);
  };

  const getTotalPendapatan = () => {
    return filteredData
      .filter(p => p.status === 'Diverifikasi')
      .reduce((sum, p) => sum + p.jumlah_pembayaran, 0);
  };

  const getPembayaranTerverifikasi = () => {
    return filteredData.filter(p => p.status === 'Diverifikasi').length;
  };

  const getPembayaranDitolak = () => {
    return filteredData.filter(p => p.status === 'Ditolak').length;
  };

  const getPembayaranMenunggu = () => {
    return filteredData.filter(p => p.status === 'MenungguVerifikasi').length;
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
      year: 'numeric'
    });
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Tanggal', 'Nama Santri', 'Jumlah', 'Status'],
      ...filteredData.map(p => [
        formatDate(p.dibuat_pada),
        p.nama_santri,
        p.jumlah_pembayaran.toString(),
        p.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-pembayaran-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Laporan Keuangan</h1>
            <p className="text-gray-600">Analisis dan laporan pembayaran santri</p>
          </div>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Laporan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Akhir</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pendapatan</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalPendapatan())}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Terverifikasi</p>
              <p className="text-2xl font-bold text-gray-900">{getPembayaranTerverifikasi()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Menunggu</p>
              <p className="text-2xl font-bold text-gray-900">{getPembayaranMenunggu()}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ditolak</p>
              <p className="text-2xl font-bold text-gray-900">{getPembayaranDitolak()}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Detail Pembayaran</h2>
          <p className="text-sm text-gray-600">Total {filteredData.length} pembayaran</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Santri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((pembayaran) => (
                <tr key={pembayaran.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(pembayaran.dibuat_pada)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {pembayaran.nama_santri}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(pembayaran.jumlah_pembayaran)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      pembayaran.status === 'Diverifikasi'
                        ? 'bg-green-100 text-green-800'
                        : pembayaran.status === 'Ditolak'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {pembayaran.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
