import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Mail 
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Teacher {
  id_guru: number;
  id_pengguna: number;
  nama_lengkap: string;
  username: string;
  email: string;
  jabatan: string;
}

export function TeachersManagementPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    username: '',
    email: '',
    tanggal_lahir: '',
    tempat_lahir: '',
    alamat: '',
    tahun_mengajar: '',
    pendidikan_tertinggi: '',
    jabatan: ''
  });

  const buildTeacherPayload = (raw: typeof formData) => {
    const trimmed = {
      nama_lengkap: raw.nama_lengkap.trim(),
      username: raw.username.trim(),
      email: raw.email.trim(),
      tanggal_lahir: raw.tanggal_lahir.trim(),
      jabatan: raw.jabatan.trim(),
      tempat_lahir: raw.tempat_lahir?.trim() || undefined,
      alamat: raw.alamat?.trim() || undefined,
      pendidikan_tertinggi: raw.pendidikan_tertinggi?.trim() || undefined,
      tahun_mengajar: raw.tahun_mengajar?.trim() || undefined,
    } as const;

    // Client-side validation to match server Zod schema
    const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(trimmed.tanggal_lahir);
    if (!trimmed.nama_lengkap || trimmed.nama_lengkap.length < 3) {
      throw new Error('Nama lengkap minimal 3 karakter');
    }
    if (!trimmed.username || trimmed.username.length < 3) {
      throw new Error('Username minimal 3 karakter');
    }
    if (!trimmed.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.email)) {
      throw new Error('Format email tidak valid');
    }
    if (!dateOk) {
      throw new Error('Format tanggal lahir harus YYYY-MM-DD');
    }
    if (!trimmed.jabatan) {
      throw new Error('Jabatan harus diisi');
    }

    const tahunMengajarNumber = trimmed.tahun_mengajar
      ? parseInt(trimmed.tahun_mengajar, 10)
      : undefined;
    if (Number.isNaN(tahunMengajarNumber)) {
      throw new Error('Tahun mengajar harus angka');
    }
    if (tahunMengajarNumber !== undefined && tahunMengajarNumber <= 0) {
      throw new Error('Tahun mengajar harus lebih dari 0');
    }

    return {
      nama_lengkap: trimmed.nama_lengkap,
      username: trimmed.username,
      email: trimmed.email,
      tanggal_lahir: trimmed.tanggal_lahir,
      jabatan: trimmed.jabatan,
      tempat_lahir: trimmed.tempat_lahir ?? null,
      alamat: trimmed.alamat ?? null,
      pendidikan_tertinggi: trimmed.pendidikan_tertinggi ?? null,
      tahun_mengajar: tahunMengajarNumber ?? null,
    };
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/manage/guru/guru`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setTeachers(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
      toast.error('Gagal mengambil data guru');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = buildTeacherPayload(formData);
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/manage/guru/guru`, payload, {
        withCredentials: true
      });
      
      if (response.data.success) {
        toast.success(response.data.data.message);
        setShowAddModal(false);
        setFormData({
          nama_lengkap: '',
          username: '',
          email: '',
          tanggal_lahir: '',
          tempat_lahir: '',
          alamat: '',
          tahun_mengajar: '',
          pendidikan_tertinggi: '',
          jabatan: ''
        });
        fetchTeachers();
      }
    } catch (error: any) {
      console.error('Error adding teacher:', error);
      const details = error.response?.data?.details as Record<string, string[]> | undefined;
      const firstDetail = details ? (Object.values(details)[0]?.[0] as string | undefined) : undefined;
      toast.error(firstDetail || error.response?.data?.error || error.message || 'Gagal menambah guru');
    }
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    try {
      const payload = buildTeacherPayload(formData);
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/manage/guru/guru/${selectedTeacher.id_guru}`, 
        payload, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(response.data.data.message);
        setShowEditModal(false);
        setSelectedTeacher(null);
        setFormData({
          nama_lengkap: '',
          username: '',
          email: '',
          tanggal_lahir: '',
          tempat_lahir: '',
          alamat: '',
          tahun_mengajar: '',
          pendidikan_tertinggi: '',
          jabatan: ''
        });
        fetchTeachers();
      }
    } catch (error: any) {
      console.error('Error updating teacher:', error);
      const details = error.response?.data?.details as Record<string, string[]> | undefined;
      const firstDetail = details ? (Object.values(details)[0]?.[0] as string | undefined) : undefined;
      toast.error(firstDetail || error.response?.data?.error || error.message || 'Gagal mengupdate guru');
    }
  };

  const handleDeleteTeacher = async (teacherId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus guru ini?')) return;

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/manage/guru/guru/${teacherId}`, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(response.data.data.message);
        fetchTeachers();
      }
    } catch (error: any) {
      console.error('Error deleting teacher:', error);
      toast.error(error.response?.data?.error || 'Gagal menghapus guru');
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.jabatan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      nama_lengkap: teacher.nama_lengkap,
      username: teacher.username,
      email: teacher.email,
      tanggal_lahir: '',
      tempat_lahir: '',
      alamat: '',
      tahun_mengajar: '',
      pendidikan_tertinggi: '',
      jabatan: teacher.jabatan
    });
    setShowEditModal(true);
  };

  const openViewModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowViewModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manajemen Guru</h1>
              <p className="text-gray-600">Kelola data guru dan akun pengguna</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Tambah Guru</span>
          </button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari guru..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredTeachers.length} dari {teachers.length} guru
          </div>
        </div>

        {/* Teachers Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Guru</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Kontak</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Jabatan</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Memuat data...</p>
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">
                      {searchTerm ? 'Tidak ada guru yang sesuai dengan pencarian' : 'Belum ada data guru'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher, index) => (
                  <tr key={teacher.id_guru} onClick={() => openViewModal(teacher)} className={`cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-bold text-sm">
                            {teacher.nama_lengkap.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{teacher.nama_lengkap}</p>
                          <p className="text-sm text-gray-600">@{teacher.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600">{teacher.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {teacher.jabatan}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(teacher)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher.id_guru)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Tambah Guru Baru</h2>
                  <p className="text-gray-600">Buat akun guru baru</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formData.nama_lengkap}
                    onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Lahir</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal_lahir}
                    onChange={(e) => setFormData({...formData, tanggal_lahir: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jabatan</label>
                  <select
                    required
                    value={formData.jabatan}
                    onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Pilih Jabatan</option>
                    <option value="Guru Mapel">Guru Mapel</option>
                    <option value="Wali Kelas">Wali Kelas</option>
                    <option value="Kepala Sekolah">Kepala Sekolah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tempat Lahir (Opsional)</label>
                  <input
                    type="text"
                    value={formData.tempat_lahir}
                    onChange={(e) => setFormData({...formData, tempat_lahir: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tahun Mengajar (Opsional)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.tahun_mengajar}
                    onChange={(e) => setFormData({...formData, tahun_mengajar: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alamat (Opsional)</label>
                  <textarea
                    rows={3}
                    value={formData.alamat}
                    onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pendidikan Tertinggi (Opsional)</label>
                  <input
                    type="text"
                    value={formData.pendidikan_tertinggi}
                    onChange={(e) => setFormData({...formData, pendidikan_tertinggi: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Tambah Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && selectedTeacher && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <Edit className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Guru</h2>
                  <p className="text-gray-600">Update data guru</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleEditTeacher} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formData.nama_lengkap}
                    onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jabatan</label>
                  <select
                    required
                    value={formData.jabatan}
                    onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Pilih Jabatan</option>
                    <option value="Guru Mapel">Guru Mapel</option>
                    <option value="Wali Kelas">Wali Kelas</option>
                    <option value="Kepala Sekolah">Kepala Sekolah</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Update Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Teacher Modal */}
      {showViewModal && selectedTeacher && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Detail Guru</h2>
                  <p className="text-gray-600">Informasi lengkap guru</p>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nama Lengkap</p>
                  <p className="font-semibold text-gray-900">{selectedTeacher.nama_lengkap}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Username</p>
                  <p className="font-semibold text-gray-900">@{selectedTeacher.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{selectedTeacher.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Jabatan</p>
                  <p className="font-semibold text-gray-900">{selectedTeacher.jabatan}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
