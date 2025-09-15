import { useState, useEffect } from 'react';
import { DollarSign, Building2, User, Save, Plus } from 'lucide-react';
import type { Biaya, CreateBiayaData, UpdateProfileData, UpdateCredentialsData } from '../types';

export function PaymentSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'biaya' | 'bank'>('profile');
  const [biayaList, setBiayaList] = useState<Biaya[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBiayaModal, setShowBiayaModal] = useState(false);
  const [newBiaya, setNewBiaya] = useState<CreateBiayaData>({
    nama_biaya: '',
    jumlah: 0,
    keterangan: '',
    tahun_ajaran: new Date().getFullYear().toString()
  });

  // Profile form states
  const [profileForm, setProfileForm] = useState<UpdateProfileData>({
    nama: '',
    email: ''
  });

  const [credentialsForm, setCredentialsForm] = useState<UpdateCredentialsData>({
    username: '',
    currentPassword: '',
    newPassword: ''
  });

  // Bank form states
  const [bankForm, setBankForm] = useState({
    nama_bank: '',
    nomor_rekening: '',
    atas_nama: '',
    deskripsi: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchBiayaList()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };


  const fetchBiayaList = async () => {
    try {
      const response = await fetch('/api/bendahara/biaya', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setBiayaList(data.data);
      }
    } catch (error) {
      console.error('Error fetching biaya list:', error);
    }
  };


  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/bendahara/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileForm)
      });

      const data = await response.json();
      if (data) {
        alert('Profile berhasil diperbarui');
      } else {
        alert('Gagal memperbarui profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Terjadi kesalahan saat memperbarui profile');
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/bendahara/credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentialsForm)
      });

      const data = await response.json();
      if (data.message) {
        alert(data.message);
        if (data.message.includes('login kembali')) {
          // Redirect to login or handle logout
          window.location.href = '/login';
        }
      } else {
        alert('Gagal memperbarui kredensial');
      }
    } catch (error) {
      console.error('Error updating credentials:', error);
      alert('Terjadi kesalahan saat memperbarui kredensial');
    }
  };

  const handleCreateBiaya = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/bendahara/biaya', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newBiaya)
      });

      const data = await response.json();
      if (data.success) {
        setShowBiayaModal(false);
        setNewBiaya({
          nama_biaya: '',
          jumlah: 0,
          keterangan: '',
          tahun_ajaran: new Date().getFullYear().toString()
        });
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
        headers: {
          'Content-Type': 'application/json',
        },
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pengaturan</h1>
        <p className="text-gray-600">Kelola profile, jenis biaya, dan rincian bank</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'biaya', label: 'Jenis Biaya', icon: DollarSign },
              { id: 'bank', label: 'Rincian Bank', icon: Building2 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Profile</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                    <input
                      type="text"
                      value={profileForm.nama}
                      onChange={(e) => setProfileForm({ ...profileForm, nama: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Profile
                  </button>
                </form>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kredensial</h3>
                <form onSubmit={handleUpdateCredentials} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username Baru</label>
                    <input
                      type="text"
                      value={credentialsForm.username || ''}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password Saat Ini</label>
                    <input
                      type="password"
                      value={credentialsForm.currentPassword || ''}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
                    <input
                      type="password"
                      value={credentialsForm.newPassword || ''}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, newPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Kredensial
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Biaya Tab */}
          {activeTab === 'biaya' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Jenis Biaya</h3>
                <button
                  onClick={() => setShowBiayaModal(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Biaya
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {biayaList.map((biaya) => (
                  <div key={biaya.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900">{biaya.nama_biaya}</h4>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(biaya.jumlah)}</p>
                    <p className="text-sm text-gray-600">{biaya.tahun_ajaran}</p>
                    {biaya.keterangan && (
                      <p className="text-sm text-gray-500 mt-2">{biaya.keterangan}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bank Tab */}
          {activeTab === 'bank' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rincian Bank</h3>
              <form onSubmit={handleUpdateBank} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Bank</label>
                  <input
                    type="text"
                    value={bankForm.nama_bank}
                    onChange={(e) => setBankForm({ ...bankForm, nama_bank: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Rekening</label>
                  <input
                    type="text"
                    value={bankForm.nomor_rekening}
                    onChange={(e) => setBankForm({ ...bankForm, nomor_rekening: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Atas Nama</label>
                  <input
                    type="text"
                    value={bankForm.atas_nama}
                    onChange={(e) => setBankForm({ ...bankForm, atas_nama: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                  <textarea
                    value={bankForm.deskripsi}
                    onChange={(e) => setBankForm({ ...bankForm, deskripsi: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Rincian Bank
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Biaya Modal */}
      {showBiayaModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tambah Jenis Biaya</h3>
            <form onSubmit={handleCreateBiaya} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Biaya</label>
                <input
                  type="text"
                  value={newBiaya.nama_biaya}
                  onChange={(e) => setNewBiaya({ ...newBiaya, nama_biaya: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah</label>
                <input
                  type="number"
                  value={newBiaya.jumlah}
                  onChange={(e) => setNewBiaya({ ...newBiaya, jumlah: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tahun Ajaran</label>
                <input
                  type="text"
                  value={newBiaya.tahun_ajaran}
                  onChange={(e) => setNewBiaya({ ...newBiaya, tahun_ajaran: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan</label>
                <textarea
                  value={newBiaya.keterangan || ''}
                  onChange={(e) => setNewBiaya({ ...newBiaya, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBiayaModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Tambah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
