// client/src/components/ParentModule/pages/ProfilePage.tsx

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { User, Smartphone, Hash, MapPin, Briefcase, Camera, Upload, Edit, Save, Loader2, Calendar, UserCheck, Eye, EyeOff, Mail, Settings, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { ProfileItem } from '../molecules/ProfileItem';
import { ProfileSection } from '../organisms/ProfileSection';
import { toast } from 'react-toastify';
import { useAuth } from '../../../contexts/AuthContexts';

// Interfaces untuk mendefinisikan struktur data
interface SantriData {
  nama_lengkap: string;
  nomor_induk: string;
  nisn: string;
  jenis_kelamin: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  alamat: string;
  foto_profil: string;
  anak_ke: number;
  dari_bersaudara: number;
  agama: string;
}

interface ParentData {
  nama_lengkap?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  pekerjaan?: string;
  pendidikan_terakhir?: string;
  alamat?: string;
  nomor_hp?: string;
}

interface ProfileData {
  santri: SantriData;
  ayah: ParentData;
  ibu: ParentData;
}

export function ProfilePage() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State untuk form biodata yang bisa diedit
  const [editableBiodata, setEditableBiodata] = useState({
    nama_lengkap: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    alamat: '',
  });

  // State untuk form ganti akun
  const [accountForm, setAccountForm] = useState({
    newUsername: '',
  });

  // State untuk form ganti password
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isEditingBiodata, setIsEditingBiodata] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fungsi helper untuk memformat tanggal
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/account/santri/profile`, { withCredentials: true });
      if (response.data && response.data.success) {
        setProfileData(response.data.data);
        const { santri } = response.data.data;
        setEditableBiodata({
          nama_lengkap: santri.nama_lengkap,
          tanggal_lahir: santri.tanggal_lahir?.split('T')[0] || '',
          jenis_kelamin: santri.jenis_kelamin,
          alamat: santri.alamat,
        });
        setAccountForm({
          newUsername: user?.username || '',
        });
      } else {
        setError('Gagal mengambil data profil.');
        toast.error('Gagal mengambil data profil.');
      }
    } catch (err: any) {
      console.error("Kesalahan saat mengambil data profil:", err);
      setError(err.response?.data?.error || 'Gagal terhubung ke server.');
      toast.error(err.response?.data?.error || 'Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleUpdateBiodata = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/account/santri/update-biodata`,
        editableBiodata,
        { withCredentials: true }
      );
      if (response.data.success) {
        toast.success('Biodata berhasil diperbarui.');
        setIsEditingBiodata(false);
        fetchProfile();
      } else {
        toast.error(response.data.error || 'Gagal memperbarui biodata.');
      }
    } catch (err: any) {
      console.error('Error saat update biodata:', err);
      toast.error(err.response?.data?.error || 'Gagal memperbarui biodata.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/account/santri/change-username`,
        { newUsername: accountForm.newUsername },
        { withCredentials: true }
      );
      if (response.data.success) {
        toast.success(response.data.data.message);
        setShowAccountSettings(false);
        if (user) {
          user.username = accountForm.newUsername;
        }
      } else {
        toast.error(response.data.error || 'Gagal memperbarui akun.');
      }
    } catch (err: any) {
      console.error('Error saat update akun:', err);
      toast.error(err.response?.data?.error || 'Gagal memperbarui akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Password baru dan konfirmasi password tidak cocok');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/account/santri/change-password`,
        { oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword },
        { withCredentials: true }
      );
      if (response.data.success) {
        toast.success(response.data.data.message);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordChange(false);
      } else {
        toast.error(response.data.error || 'Gagal mengubah password.');
      }
    } catch (err: any) {
      console.error('Error saat ganti password:', err);
      toast.error(err.response?.data?.error || 'Gagal mengubah password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('profilePhoto', file);
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/account/santri/upload-photo`,
        formData,
        { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (response.data.success) {
        toast.success('Foto profil berhasil diunggah.');
        fetchProfile();
      } else {
        toast.error(response.data.error || 'Gagal mengunggah foto.');
      }
    } catch (err: any) {
      console.error('Error saat upload foto:', err);
      toast.error(err.response?.data?.error || 'Gagal mengunggah foto.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">Memuat data profil...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-red-600" />
          </div>
          <p className="text-lg font-medium text-red-600">{error || "Data profil tidak ditemukan."}</p>
        </div>
      </div>
    );
  }

  const { santri, ayah, ibu } = profileData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Profil Santri & Wali */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl p-8 text-white shadow-2xl flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold mb-2">Profil Santri & Wali</h1>
            <p className="text-teal-100">
              Kelola informasi profil dan data keluarga dengan mudah dan aman
            </p>
          </div>
          <div className="bg-teal-700/40 p-6 rounded-2xl">
            <User size={40} className="text-white" />
          </div>
        </div>
        
        {/* Profile Photo Section */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-8 shadow-lg border border-white/20 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Camera size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Foto Profil</h2>
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-40 h-40 rounded-2xl border-4 border-gradient-to-r from-blue-400 to-indigo-400 overflow-hidden shadow-xl bg-gradient-to-br from-gray-100 to-gray-200">
                {santri.foto_profil ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL}${santri.foto_profil}`}
                    alt="Foto Profil"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Camera size={48} />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/10 transition-all" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Perbarui Foto Profil</h3>
                <p className="text-gray-600 mb-4">Unggah foto baru untuk mengganti foto profil Anda. Pastikan foto yang diunggah jelas dan profesional.</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image"
                disabled={isSubmitting}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || isEditingBiodata}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <Loader2 size={20} className="animate-spin mr-2" />
                ) : (
                  <Upload size={20} className="mr-2" />
                )}
                {isSubmitting ? 'Mengunggah...' : 'Unggah Foto Baru'}
              </button>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-medium mb-1">Persyaratan File:</p>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• Format: JPG, PNG</li>
                  <li>• Ukuran maksimal: 2MB</li>
                  <li>• Resolusi optimal: 400x400px</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Account Settings Section */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg border border-white/20 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center text-white">
                <Settings size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Pengaturan Akun</h2>
                <p className="text-sm text-gray-600">Kelola username dan kata sandi</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Current Account Info Display */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Username Saat Ini</label>
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-500" />
                  <span className="text-gray-800 font-medium">{user?.username || 'Tidak tersedia'}</span>
                </div>
              </div>
            </div>

            {/* Username Settings Collapsible */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowAccountSettings(!showAccountSettings)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User size={20} className="text-gray-600" />
                  <span className="font-medium text-gray-800">Ubah Username</span>
                </div>
                {showAccountSettings ? (
                  <ChevronUp size={20} className="text-gray-500" />
                ) : (
                  <ChevronDown size={20} className="text-gray-500" />
                )}
              </button>
              
              {showAccountSettings && (
                <form onSubmit={handleUpdateAccount} className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
                  <div>
                    <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700 mb-2">Username Baru</label>
                    <input
                      type="text"
                      id="newUsername"
                      value={accountForm.newUsername}
                      onChange={(e) => setAccountForm({ ...accountForm, newUsername: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all shadow-sm bg-white"
                      placeholder="Masukkan username baru"
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      {isSubmitting ? (
                        <Loader2 size={18} className="animate-spin mr-2" />
                      ) : (
                        <Save size={18} className="mr-2" />
                      )}
                      {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAccountSettings(false)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Password Change Collapsible */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock size={20} className="text-gray-600" />
                  <span className="font-medium text-gray-800">Ubah Kata Sandi</span>
                </div>
                {showPasswordChange ? (
                  <ChevronUp size={20} className="text-gray-500" />
                ) : (
                  <ChevronDown size={20} className="text-gray-500" />
                )}
              </button>
              
              {showPasswordChange && (
                <form onSubmit={handlePasswordChange} className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
                  <div>
                    <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-2">Password Lama</label>
                    <input
                      type="password"
                      id="oldPassword"
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all shadow-sm bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all shadow-sm bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all shadow-sm bg-white"
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      {isSubmitting ? (
                        <Loader2 size={18} className="animate-spin mr-2" />
                      ) : (
                        <Lock size={18} className="mr-2" />
                      )}
                      {isSubmitting ? 'Mengubah...' : 'Ubah Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordChange(false);
                        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Student Data Section */}
        <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl p-8 shadow-lg border border-white/20 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Data Santri</h2>
                <p className="text-sm text-gray-600">Informasi pribadi dan akademik</p>
              </div>
            </div>
            {!isEditingBiodata && (
              <button
                onClick={() => setIsEditingBiodata(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Edit size={18} className="mr-2" />
                Edit Biodata
              </button>
            )}
          </div>
          
          {isEditingBiodata ? (
            <form onSubmit={handleUpdateBiodata} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editableBiodata.nama_lengkap}
                    onChange={(e) => setEditableBiodata({ ...editableBiodata, nama_lengkap: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={editableBiodata.tanggal_lahir}
                    onChange={(e) => setEditableBiodata({ ...editableBiodata, tanggal_lahir: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Jenis Kelamin</label>
                  <select
                    value={editableBiodata.jenis_kelamin}
                    onChange={(e) => setEditableBiodata({ ...editableBiodata, jenis_kelamin: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Nomor Induk</label>
                  <div className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 font-medium">
                    {santri.nomor_induk}
                  </div>
                  <p className="text-xs text-gray-500">Nomor induk tidak dapat diubah</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Alamat</label>
                <textarea
                  value={editableBiodata.alamat}
                  onChange={(e) => setEditableBiodata({ ...editableBiodata, alamat: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm resize-none"
                  placeholder="Masukkan alamat lengkap"
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-500">NISN</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600">
                    {santri.nisn || 'Tidak ada data'}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-500">Tempat Lahir</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600">
                    {santri.tempat_lahir || 'Tidak ada data'}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin mr-2" />
                  ) : (
                    <Save size={18} className="mr-2" />
                  )}
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBiodata(false)}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProfileItem icon={<User size={20} className="text-gray-600" />} label="Nama Lengkap" value={santri.nama_lengkap} />
              <ProfileItem icon={<Hash size={20} className="text-gray-600" />} label="Nomor Induk" value={santri.nomor_induk} />
              <ProfileItem icon={<Hash size={20} className="text-gray-600" />} label="NISN" value={santri.nisn || '-'} />
              <ProfileItem icon={<UserCheck size={20} className="text-gray-600" />} label="Jenis Kelamin" value={santri.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
              <ProfileItem icon={<MapPin size={20} className="text-gray-600" />} label="Tempat Lahir" value={santri.tempat_lahir} />
              <ProfileItem icon={<Calendar size={20} className="text-gray-600" />} label="Tanggal Lahir" value={formatDate(santri.tanggal_lahir)} />
              <div className="lg:col-span-2">
                <ProfileItem icon={<MapPin size={20} className="text-gray-600" />} label="Alamat" value={santri.alamat} />
              </div>
            </div>
          )}
        </div>

        {/* Parent Data Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {ayah && <ProfileSection title="Data Ayah" data={ayah} iconColor="bg-gradient-to-r from-blue-500 to-indigo-500" bgGradient="from-white to-blue-50" />}
          {ibu && <ProfileSection title="Data Ibu" data={ibu} iconColor="bg-gradient-to-r from-pink-500 to-rose-500" bgGradient="from-white to-pink-50" />}
        </div>
      </div>
    </div>
  );
}