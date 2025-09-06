import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Trash2, 
  Users,
  UserPlus,
  UserMinus,
  Building
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

// --- INTERFACES ---
interface ClassData {
  id_kelas: number;
  nama_kelas: string;
  nama_jenjang: string;
  id_guru: number | null;
  nama_wali_kelas: string | null;
}

interface Teacher {
  id_guru: number;
  nama_lengkap: string;
  username: string;
}

// Interface ini cukup untuk halaman ini
interface Student {
  id_santri: number;
  nama_santri: string;
  nomor_induk: string;
}

interface Jenjang {
  id: number;
  nama_jenjang: string;
}

export function ClassManagementPage() {
  // --- STATES ---
  const [classes, setClasses] = useState<Record<string, ClassData[]>>({});
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [jenjangList, setJenjangList] = useState<Jenjang[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignWaliModal, setShowAssignWaliModal] = useState(false);
  const [showAssignStudentModal, setShowAssignStudentModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);

  // --- FORM STATES ---
  const [formData, setFormData] = useState({
    nama_kelas: '',
    id_jenjang: ''
  });

  const [waliFormData, setWaliFormData] = useState({
    id_guru: ''
  });

  const [studentFormData, setStudentFormData] = useState({
    id_santri: '',
    tahun_ajaran: ''
  });

  // --- EFFECTS ---
  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchStudents();
    fetchJenjang();
  }, []);

  // --- API CALLS ---
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/manage/guru/wali-kelas`, {
        withCredentials: true
      });
      
      if (response.data) {
        setClasses(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast.error('Gagal mengambil data kelas');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/manage/guru/guru`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setTeachers(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
    }
  };

  // --- PERBAIKAN DI SINI ---
  const fetchStudents = async () => {
    try {
      const response = await axios.get<{ success: boolean; data: Student[] }>(
        `${import.meta.env.VITE_API_URL}/api/manage/santri/santri`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // Langsung gunakan data array dari API
        setStudents(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchJenjang = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/manage/akademik/jenjang`, {
        withCredentials: true
      });
      if (response.data.success) {
        setJenjangList(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching jenjang:', error);
      toast.error('Gagal mengambil data jenjang pendidikan');
    }
  };

  // --- HANDLERS ---
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/manage/kelas/kelas`, 
        {
          nama_kelas: formData.nama_kelas,
          id_jenjang: parseInt(formData.id_jenjang)
        }, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(response.data.data.message);
        setShowAddModal(false);
        setFormData({ nama_kelas: '', id_jenjang: '' });
        fetchClasses();
      }
    } catch (error: any) {
      console.error('Error adding class:', error);
      toast.error(error.response?.data?.error || 'Gagal menambah kelas');
    }
  };

  const handleAssignWaliKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/manage/kelas/kelas/${selectedClass.id_kelas}/assign-wali`, 
        { id_guru: parseInt(waliFormData.id_guru) }, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(response.data.data.message);
        setShowAssignWaliModal(false);
        setSelectedClass(null);
        setWaliFormData({ id_guru: '' });
        fetchClasses();
      }
    } catch (error: any) {
      console.error('Error assigning wali kelas:', error);
      toast.error(error.response?.data?.error || 'Gagal menetapkan wali kelas');
    }
  };

  const handleUnassignWaliKelas = async (classId: number) => {
    if (!confirm('Apakah Anda yakin ingin melepaskan jabatan wali kelas ini?')) return;

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/manage/kelas/kelas/${classId}/unassign-wali`, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(response.data.data.message);
        fetchClasses();
      }
    } catch (error: any) {
      console.error('Error unassigning wali kelas:', error);
      toast.error(error.response?.data?.error || 'Gagal melepaskan jabatan wali kelas');
    }
  };

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/manage/kelas/${selectedClass.id_kelas}/assign-santri`, 
        {
          id_santri: parseInt(studentFormData.id_santri),
          tahun_ajaran: studentFormData.tahun_ajaran
        }, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(response.data.data.message);
        setShowAssignStudentModal(false);
        setSelectedClass(null);
        setStudentFormData({ id_santri: '', tahun_ajaran: '' });
        fetchClasses();
        window.dispatchEvent(new Event('santri-assigned'));
      }
    } catch (error: any) {
      console.error('Error assigning student:', error);
      toast.error(error.response?.data?.error || 'Gagal menempatkan santri');
    }
  };

  const handleDeleteClass = async (classId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kelas ini?')) return;

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/manage/kelas/kelas/${classId}`, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(response.data.data.message);
        fetchClasses();
      }
    } catch (error: any) {
      console.error('Error deleting class:', error);
      toast.error(error.response?.data?.error || 'Gagal menghapus kelas');
    }
  };

  // --- RENDER LOGIC ---
  const allClasses = Object.values(classes).flat();

  const filteredClasses = allClasses.filter(classData =>
    classData.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (classData.nama_jenjang && classData.nama_jenjang.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (classData.nama_wali_kelas && classData.nama_wali_kelas.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openAssignWaliModal = (classData: ClassData) => {
    setSelectedClass(classData);
    setShowAssignWaliModal(true);
  };

  const openAssignStudentModal = (classData: ClassData) => {
    setSelectedClass(classData);
    setShowAssignStudentModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manajemen Kelas</h1>
              <p className="text-gray-600">Kelola kelas dan penempatan wali kelas</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} />
            <span>Tambah Kelas</span>
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
              placeholder="Cari kelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredClasses.length} dari {allClasses.length} kelas
          </div>
        </div>

        {/* Classes Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Memuat data...</p>
          </div>
        ) : allClasses.length === 0 ? (
          <div className="text-center py-8">
            <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Belum ada data kelas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Kelas</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Jenjang</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Wali Kelas</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((classData, index) => (
                  <tr key={classData.id_kelas} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mr-3">
                          <Building className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="font-semibold text-gray-900">{classData.nama_kelas}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-700">{classData.nama_jenjang}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{classData.nama_wali_kelas || '-'}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openAssignWaliModal(classData)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Tetapkan Wali Kelas"
                          >
                            <UserPlus size={16} />
                          </button>
                          {classData.nama_wali_kelas && (
                            <button
                              onClick={() => handleUnassignWaliKelas(classData.id_kelas)}
                              className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                              title="Lepas Jabatan"
                            >
                              <UserMinus size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openAssignStudentModal(classData)}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          title="Tempatkan Santri"
                        >
                          <Users size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(classData.id_kelas)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                  <Plus className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tambah Kelas Baru</h2>
                  <p className="text-gray-600">Buat kelas baru</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleAddClass} className="p-6 space-y-6">
              <div>
                <label htmlFor="nama-kelas" className="block text-sm font-medium text-gray-700 mb-2">Nama Kelas</label>
                <input
                  id="nama-kelas"
                  type="text"
                  required
                  value={formData.nama_kelas}
                  onChange={(e) => setFormData({...formData, nama_kelas: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="id-jenjang" className="block text-sm font-medium text-gray-700 mb-2">Jenjang Pendidikan</label>
                <select
                  id="id-jenjang"
                  required
                  value={formData.id_jenjang}
                  onChange={(e) => setFormData({...formData, id_jenjang: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Pilih Jenjang</option>
                  {jenjangList.map((jenjang) => (
                    <option key={jenjang.id} value={jenjang.id}>
                      {jenjang.nama_jenjang}
                    </option>
                  ))}
                </select>
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
                  className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                >
                  Tambah Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Wali Kelas Modal */}
      {showAssignWaliModal && selectedClass && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tetapkan Wali Kelas</h2>
                  <p className="text-gray-600">{selectedClass.nama_kelas}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignWaliModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleAssignWaliKelas} className="p-6 space-y-6">
              <div>
                <label htmlFor="id-guru" className="block text-sm font-medium text-gray-700 mb-2">Pilih Guru</label>
                <select
                  id="id-guru"
                  required
                  value={waliFormData.id_guru}
                  onChange={(e) => setWaliFormData({...waliFormData, id_guru: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Pilih Guru</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id_guru} value={teacher.id_guru}>
                      {teacher.nama_lengkap} (@{teacher.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignWaliModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Tetapkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Student Modal */}
      {showAssignStudentModal && selectedClass && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tempatkan Santri</h2>
                  <p className="text-gray-600">{selectedClass.nama_kelas}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignStudentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleAssignStudent} className="p-6 space-y-6">
              <div>
                <label htmlFor="id-santri" className="block text-sm font-medium text-gray-700 mb-2">Pilih Santri</label>
                <select
                  id="id-santri"
                  required
                  value={studentFormData.id_santri}
                  onChange={(e) => setStudentFormData({...studentFormData, id_santri: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Pilih Santri</option>
                  {students.map(student => (
                    <option key={student.id_santri} value={student.id_santri}>
                      {student.nama_santri} ({student.nomor_induk})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="tahun-ajaran" className="block text-sm font-medium text-gray-700 mb-2">Tahun Ajaran</label>
                <input
                  id="tahun-ajaran"
                  type="text"
                  required
                  placeholder="2024/2025"
                  value={studentFormData.tahun_ajaran}
                  onChange={(e) => setStudentFormData({...studentFormData, tahun_ajaran: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignStudentModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  Tempatkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}