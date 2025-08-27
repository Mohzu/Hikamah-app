import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Lock, 
  Mail, 
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../../contexts/AuthContexts';

export function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [loading, setLoading] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/account/admin/change-username`, 
        { newUsername: profileForm.username }, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(response.data.data.message);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.error || 'Gagal mengupdate profil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Password baru dan konfirmasi password tidak cocok');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/account/admin/change-password`, 
        {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        }, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(response.data.data.message);
        setPasswordForm({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.error || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
            <p className="text-gray-600">Kelola profil dan keamanan akun</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-gray-100 text-gray-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profil
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'password'
                ? 'bg-gray-100 text-gray-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            Password
          </button>
        </div>

        {/* Content */}
        {activeTab === 'profile' ? (
          /* Profile Tab */
          <div className="max-w-2xl">
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user?.nama_pengguna || user?.username}</h3>
                  <p className="text-gray-600">{user?.peran}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Username</p>
                  <p className="font-medium text-gray-900">@{user?.username}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{user?.email || 'Tidak tersedia'}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username Baru</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    required
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Masukkan username baru"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Username minimal 3 karakter</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email (Opsional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Masukkan email baru"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Update Profil
              </button>
            </form>
          </div>
        ) : (
          /* Password Tab */
          <div className="max-w-2xl">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
              <div className="flex items-center space-x-3">
                <Lock className="w-6 h-6 text-yellow-600" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">Keamanan Password</h3>
                  <p className="text-yellow-700 text-sm">Pastikan password Anda kuat dan tidak mudah ditebak</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password Lama</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPasswords.old ? 'text' : 'password'}
                    required
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Masukkan password lama"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('old')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.old ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Masukkan password baru"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Password minimal 6 karakter</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Konfirmasi password baru"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordForm.newPassword && passwordForm.confirmPassword && (
                  <p className={`text-xs mt-1 ${
                    passwordForm.newPassword === passwordForm.confirmPassword 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {passwordForm.newPassword === passwordForm.confirmPassword 
                      ? '✓ Password cocok' 
                      : '✗ Password tidak cocok'
                    }
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || passwordForm.newPassword !== passwordForm.confirmPassword}
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Lock className="w-5 h-5 mr-2" />
                )}
                Ubah Password
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
