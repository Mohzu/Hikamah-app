import { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, Building2, Save, Plus , Clock, CheckCircle, XCircle} from 'lucide-react';
import type { Pembayaran, Biaya, CreateBiayaData } from '../types';

export function PaymentManagementPage() {
  const [pembayaranMasuk, setPembayaranMasuk] = useState<Pembayaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pembayaran' | 'biaya' | 'bank'>('pembayaran');
  const [biayaList, setBiayaList] = useState<Biaya[]>([]);
  const [showBiayaModal, setShowBiayaModal] = useState(false);
  const [newBiaya, setNewBiaya] = useState<CreateBiayaData>({
    nama_biaya: '',
    jumlah: 0,
    keterangan: '',
    tahun_ajaran: new Date().getFullYear().toString()
  });
  const [showTagihanModal, setShowTagihanModal] = useState(false);
  const [tagihanForm, setTagihanForm] = useState({
    id_santri: '',
    id_biaya: '',
    id_bank: '',
    status: 'BelumDibayar' as 'BelumDibayar' | 'MenungguVerifikasi',
  });
  const [bankForm, setBankForm] = useState({
    nama_bank: '',
    nomor_rekening: '',
    atas_nama: '',
    deskripsi: ''
  });

  useEffect(() => {
    fetchPembayaranMasuk();
    fetchBiayaList();
  }, []);

  const fetchPembayaranMasuk = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bendahara/pembayaran', {
        credentials: 'include'
      });
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

  const fetchBiayaList = async () => {
    try {
      const response = await fetch('/api/bendahara/biaya', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setBiayaList(data.data);
      }
    } catch (error) {
      console.error('Error fetching biaya list:', error);
    }
  };

  const handleCreateBiaya = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/bendahara/biaya', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newBiaya)
      });
      const data = await response.json();
      if (data.success) {
        setShowBiayaModal(false);
        setNewBiaya({ nama_biaya: '', jumlah: 0, keterangan: '', tahun_ajaran: new Date().getFullYear().toString() });
        fetchBiayaList();
        alert('Jenis biaya berhasil ditambahkan');
      } else {
        alert('Gagal menambahkan jenis biaya: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating biaya:', error);
      alert('Terjadi kesalahan saat menambahkan jenis biaya');
    }
  };

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/bendahara/rincian-pembayaran', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bankForm)
      });
      const data = await response.json();
      if (data.success) {
        alert('Rincian bank berhasil diperbarui');
      } else {
        alert('Gagal memperbarui rincian bank: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating bank:', error);
      alert('Terjadi kesalahan saat memperbarui rincian bank');
    }
  };

  const handleCreateTagihan = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation and coercion to numbers
    const idSantriNum = Number(tagihanForm.id_santri);
    const idBiayaNum = Number(tagihanForm.id_biaya);
    const idBankNum = Number(tagihanForm.id_bank);
    // jumlah diambil dari master biaya
    const selectedBiaya = biayaList.find(b => b.id === idBiayaNum);
    const jumlahNum = Number(selectedBiaya?.jumlah ?? 0);
    if ([idSantriNum, idBiayaNum, idBankNum].some(n => !Number.isInteger(n) || n <= 0) || !(jumlahNum > 0)) {
      alert('Pastikan ID santri/biaya/bank valid dan pilih jenis biaya yang memiliki jumlah');
      return;
    }
    try {
      const response = await fetch('/api/bendahara/tagihan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id_santri: idSantriNum,
          id_biaya: idBiayaNum,
          id_bank: idBankNum,
          jumlah: jumlahNum,
          status: tagihanForm.status,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Tagihan berhasil dibuat');
        setShowTagihanModal(false);
        setTagihanForm({ id_santri: '', id_biaya: '', id_bank: '', status: 'BelumDibayar' });
        fetchPembayaranMasuk();
      } else {
        alert('Gagal membuat tagihan: ' + (data.error || 'Tidak diketahui'));
      }
    } catch (error) {
      console.error('Error creating tagihan:', error);
      alert('Terjadi kesalahan saat membuat tagihan');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MenungguVerifikasi':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Menunggu Verifikasi
          </span>
        );
      case 'Diverifikasi':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Diverifikasi
          </span>
        );
      case 'Ditolak':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Ditolak
          </span>
        );
      default:
        return null;
    }
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Kelola Pembayaran</h1>
        <p className="text-gray-600">Kelola daftar pembayaran, jenis biaya, dan rincian bank</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[{ id: 'pembayaran', label: 'Pembayaran', icon: DollarSign }, { id: 'biaya', label: 'Jenis Biaya', icon: Plus }, { id: 'bank', label: 'Rincian Bank', icon: Building2 }].map((tab: any) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'pembayaran' && (
            <>
              <div className="p-0 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Daftar Pembayaran</h2>
                  <p className="text-sm text-gray-600">Total {pembayaranMasuk.length} pembayaran</p>
                </div>
                <button onClick={() => setShowTagihanModal(true)} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
                  <Plus className="w-4 h-4 mr-2" /> Buat Tagihan
                </button>
              </div>
              <div className="mt-6">
                {pembayaranMasuk.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Tidak ada pembayaran</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pembayaranMasuk.map((pembayaran) => (
                      <div key={pembayaran.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                              <DollarSign className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{pembayaran.nama_santri}</h3>
                              <p className="text-sm text-gray-600">{formatDate(pembayaran.dibuat_pada)}</p>
                              <p className="text-lg font-bold text-gray-900">{formatCurrency(pembayaran.jumlah_pembayaran)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'biaya' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Jenis Biaya</h3>
                <button onClick={() => setShowBiayaModal(true)} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
                  <Plus className="w-4 h-4 mr-2" /> Tambah Biaya
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {biayaList.map((biaya) => (
                  <div key={biaya.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900">{biaya.nama_biaya}</h4>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(biaya.jumlah)}</p>
                    <p className="text-sm text-gray-600">{biaya.tahun_ajaran}</p>
                    {biaya.keterangan && <p className="text-sm text-gray-500 mt-2">{biaya.keterangan}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rincian Bank</h3>
              <form onSubmit={handleUpdateBank} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Bank</label>
                  <input type="text" value={bankForm.nama_bank} onChange={(e) => setBankForm({ ...bankForm, nama_bank: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Rekening</label>
                  <input type="text" value={bankForm.nomor_rekening} onChange={(e) => setBankForm({ ...bankForm, nomor_rekening: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Atas Nama</label>
                  <input type="text" value={bankForm.atas_nama} onChange={(e) => setBankForm({ ...bankForm, atas_nama: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                  <textarea value={bankForm.deskripsi} onChange={(e) => setBankForm({ ...bankForm, deskripsi: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" rows={3} />
                </div>
                <button type="submit" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
                  <Save className="w-4 h-4 mr-2" /> Simpan Rincian Bank
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {showBiayaModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tambah Jenis Biaya</h3>
            <form onSubmit={handleCreateBiaya} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Biaya</label>
                <input type="text" value={newBiaya.nama_biaya} onChange={(e) => setNewBiaya({ ...newBiaya, nama_biaya: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah</label>
                <input type="number" value={newBiaya.jumlah} onChange={(e) => setNewBiaya({ ...newBiaya, jumlah: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tahun Ajaran</label>
                <input type="text" value={newBiaya.tahun_ajaran} onChange={(e) => setNewBiaya({ ...newBiaya, tahun_ajaran: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan</label>
                <textarea value={newBiaya.keterangan || ''} onChange={(e) => setNewBiaya({ ...newBiaya, keterangan: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" rows={3} />
              </div>
              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowBiayaModal(false)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">Tambah</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTagihanModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Buat Tagihan</h3>
            <form onSubmit={handleCreateTagihan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Santri</label>
                <input type="number" value={tagihanForm.id_santri} onChange={(e) => setTagihanForm({ ...tagihanForm, id_santri: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Biaya</label>
                <select
                  value={tagihanForm.id_biaya}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTagihanForm({ ...tagihanForm, id_biaya: value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  <option value="">Pilih Biaya</option>
                  {biayaList.map((b) => (
                    <option key={b.id} value={b.id}>{b.nama_biaya} - {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(b.jumlah)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Bank</label>
                <input type="number" value={tagihanForm.id_bank} onChange={(e) => setTagihanForm({ ...tagihanForm, id_bank: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={tagihanForm.status} onChange={(e) => setTagihanForm({ ...tagihanForm, status: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="BelumDibayar">Belum Dibayar</option>
                  <option value="MenungguVerifikasi">Menunggu Verifikasi</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowTagihanModal(false)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">Buat</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
