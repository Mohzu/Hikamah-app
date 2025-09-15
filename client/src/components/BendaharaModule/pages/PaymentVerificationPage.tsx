import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import type { Pembayaran, VerifikasiPembayaranData } from '../types';

export function PaymentVerificationPage() {
  const [pembayaranMasuk, setPembayaranMasuk] = useState<Pembayaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPembayaran, setSelectedPembayaran] = useState<Pembayaran | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [verifikasiData, setVerifikasiData] = useState<VerifikasiPembayaranData>({
    status: 'Diverifikasi',
    alasan_penolakan: ''
  });

  useEffect(() => {
    fetchPembayaranMasuk();
  }, []);

  const fetchPembayaranMasuk = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bendahara/pembayaran', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setPembayaranMasuk(data.data);
      }
    } catch (error) {
      console.error('Error fetching pembayaran masuk:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifikasi = (pembayaran: Pembayaran) => {
    setSelectedPembayaran(pembayaran);
    setVerifikasiData({ status: 'Diverifikasi', alasan_penolakan: '' });
    setShowModal(true);
  };

  const handleTolak = (pembayaran: Pembayaran) => {
    setSelectedPembayaran(pembayaran);
    setVerifikasiData({ status: 'Ditolak', alasan_penolakan: '' });
    setShowModal(true);
  };

  const submitVerifikasi = async () => {
    if (!selectedPembayaran) return;
    try {
      const response = await fetch(`/api/bendahara/pembayaran/verifikasi/${selectedPembayaran.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(verifikasiData)
      });
      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        fetchPembayaranMasuk();
      } else {
        alert('Gagal memverifikasi pembayaran: ' + data.error);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Terjadi kesalahan saat memverifikasi pembayaran');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifikasi Pembayaran</h1>
        <p className="text-gray-600">Tinjau dan verifikasi pembayaran yang masuk</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Daftar Pembayaran Masuk</h2>
          <p className="text-sm text-gray-600">Total {pembayaranMasuk.length} pembayaran</p>
        </div>
        <div className="p-6 space-y-4">
          {pembayaranMasuk.map((pembayaran) => (
            <div key={pembayaran.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {pembayaran.bukti_pembayaran && (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${pembayaran.bukti_pembayaran}`}
                      alt="Bukti pembayaran"
                      className="w-16 h-16 rounded-lg object-cover border"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{pembayaran.nama_santri}</h3>
                    <p className="text-sm text-gray-600">{formatDate(pembayaran.dibuat_pada)}</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(pembayaran.jumlah_pembayaran)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {pembayaran.status === 'MenungguVerifikasi' ? (
                    <>
                      <button onClick={() => handleVerifikasi(pembayaran)} className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                        <CheckCircle className="w-4 h-4 mr-1" /> Verifikasi
                      </button>
                      <button onClick={() => handleTolak(pembayaran)} className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                        <XCircle className="w-4 h-4 mr-1" /> Tolak
                      </button>
                    </>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <Clock className="w-3 h-3 mr-1" /> {pembayaran.status}
                    </span>
                  )}
                  <button onClick={() => { setSelectedPembayaran(pembayaran); setShowModal(true); }} className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <Eye className="w-4 h-4 mr-1" /> Detail
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && selectedPembayaran && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {verifikasiData.status === 'Diverifikasi' ? 'Verifikasi Pembayaran' : 'Tolak Pembayaran'}
            </h3>
            <div className="space-y-4">
              {selectedPembayaran.bukti_pembayaran && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Bukti Pembayaran</p>
                  <img
                    src={`${import.meta.env.VITE_API_URL}${selectedPembayaran.bukti_pembayaran}`}
                    alt="Bukti pembayaran"
                    className="w-full max-h-80 object-contain border rounded-lg"
                  />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-700">Nama Santri</p>
                <p className="text-gray-900">{selectedPembayaran.nama_santri}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Jumlah Pembayaran</p>
                <p className="text-gray-900">{formatCurrency(selectedPembayaran.jumlah_pembayaran)}</p>
              </div>
              {verifikasiData.status === 'Ditolak' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alasan Penolakan</label>
                  <textarea
                    value={verifikasiData.alasan_penolakan || ''}
                    onChange={(e) => setVerifikasiData({ ...verifikasiData, alasan_penolakan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    rows={3}
                    placeholder="Masukkan alasan penolakan..."
                  />
                </div>
              )}
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Batal
              </button>
              <button onClick={submitVerifikasi} className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${verifikasiData.status === 'Diverifikasi' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {verifikasiData.status === 'Diverifikasi' ? 'Verifikasi' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


