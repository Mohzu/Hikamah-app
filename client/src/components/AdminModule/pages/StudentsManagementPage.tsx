import { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Search, 
  Edit, 
  Trash2, 
  UserX, 
  CheckCircle 
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Student {
  id_santri: number;
  nomor_induk: string;
  nama_santri: string;
  nisn: string;
  foto_profil: string | null;
  nama_wali: string | null;
  nama_kelas: string | null;
  nama_jenjang: string | null;
}

interface UnverifiedRegistration {
  id: number;
  nama_santri: string;
  nama_wali: string;
  email_wali: string;
  tanggal_daftar: string;
}

export function StudentsManagementPage() {
  const [students, setStudents] = useState<Record<string, Record<string, Student[]>>>({});
  const [unverifiedRegistrations, setUnverifiedRegistrations] = useState<UnverifiedRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<UnverifiedRegistration | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showViewStudentModal, setShowViewStudentModal] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchUnverifiedRegistrations();
  }, []);

  // Listen for cross-page events (e.g., assigning a student to a class) to refresh table
  useEffect(() => {
    const onSantriAssigned = () => {
      fetchStudents();
    };
    window.addEventListener('santri-assigned', onSantriAssigned);
    return () => {
      window.removeEventListener('santri-assigned', onSantriAssigned);
    };
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/manage/santri/santri`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast.error('Gagal mengambil data santri');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnverifiedRegistrations = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/manage/santri/pendaftaran`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setUnverifiedRegistrations(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching unverified registrations:', error);
      toast.error('Gagal mengambil data pendaftaran');
    }
  };

  const handleVerifyRegistration = async (registrationId: number) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/manage/santri/verifikasi/${registrationId}`, 
        {}, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(`Pendaftaran berhasil diverifikasi. Username: ${response.data.data.username}, Password: ${response.data.data.password}`);
        setShowVerifyModal(false);
        setSelectedRegistration(null);
        fetchUnverifiedRegistrations();
        fetchStudents();
      }
    } catch (error: any) {
      console.error('Error verifying registration:', error);
      toast.error(error.response?.data?.error || 'Gagal memverifikasi pendaftaran');
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus santri ini? Semua data terkait akan dihapus.')) return;

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/manage/santri/santri/${studentId}`, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(response.data.data.message);
        fetchStudents();
      }
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast.error(error.response?.data?.error || 'Gagal menghapus santri');
    }
  };

  const handleUpdateNisn = async (studentId: number, newNisn: string) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/manage/santri/santri/${studentId}/nisn`, 
        { nisn: newNisn }, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(response.data.data.message);
        fetchStudents();
      }
    } catch (error: any) {
      console.error('Error updating NISN:', error);
      toast.error(error.response?.data?.error || 'Gagal mengupdate NISN');
    }
  };

  // Flatten students for search
  const allStudents = Object.values(students).flatMap(jenjang => 
    Object.values(jenjang).flat()
  );

  const filteredStudents = allStudents.filter(student =>
    student.nama_santri.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nisn.includes(searchTerm) ||
    student.nomor_induk.includes(searchTerm) ||
    (student.nama_wali && student.nama_wali.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.nama_kelas && student.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openVerificationModal = (registration: UnverifiedRegistration) => {
    setSelectedRegistration(registration);
    setShowVerifyModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manajemen Santri</h1>
              <p className="text-gray-600">Kelola data santri dan verifikasi pendaftaran</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              {unverifiedRegistrations.length} Pendaftaran Menunggu
            </span>
          </div>
        </div>
      </div>

      {/* Unverified Registrations */}
      {unverifiedRegistrations.length > 0 && (
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-yellow-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <UserX className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Pendaftaran Menunggu Verifikasi</h2>
                <p className="text-sm text-gray-600">Verifikasi pendaftaran santri baru</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Santri</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Wali</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Tanggal Daftar</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {unverifiedRegistrations.map((registration, index) => (
                  <tr key={registration.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center mr-3">
                          <span className="text-yellow-600 font-bold text-sm">
                            {registration.nama_santri.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{registration.nama_santri}</p>
                          <p className="text-sm text-gray-600">ID: {registration.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-semibold text-gray-900">{registration.nama_wali}</p>
                        <p className="text-sm text-gray-600">{registration.email_wali}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-gray-900">
                        {new Date(registration.tanggal_daftar).toLocaleDateString('id-ID')}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openVerificationModal(registration)}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          title="Verifikasi"
                        >
                          <CheckCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Search and Stats */}
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari santri..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredStudents.length} dari {allStudents.length} santri
          </div>
        </div>

        {/* Students Table (aligned to Teachers table style) */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Memuat data...</p>
          </div>
        ) : allStudents.length === 0 ? (
          <div className="text-center py-8">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Belum ada data santri</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Santri</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Kelas/Jenjang</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Wali</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student.id_santri} onClick={() => { setSelectedStudent(student); setShowViewStudentModal(true); }} className={`cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mr-3">
                          {student.foto_profil ? (
                            <img src={student.foto_profil} alt={student.nama_santri} className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <span className="text-green-600 font-bold text-sm">{student.nama_santri.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{student.nama_santri}</p>
                          <p className="text-sm text-gray-600">NISN: {student.nisn || 'Belum diisi'} • No. Induk: {student.nomor_induk}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-700">{student.nama_kelas || '-'} ({student.nama_jenjang || '-'})</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-700">{student.nama_wali || '-'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            const newNisn = prompt('Masukkan NISN baru:', student.nisn || '');
                            if (newNisn && newNisn !== student.nisn) {
                              handleUpdateNisn(student.id_santri, newNisn);
                            }
                          }}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Update NISN"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id_santri)}
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

      {/* Verification Modal */}
      {showVerifyModal && selectedRegistration && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Verifikasi Pendaftaran</h2>
                  <p className="text-gray-600">Konfirmasi pendaftaran santri</p>
                </div>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">Nama Santri</p>
                <p className="font-semibold text-gray-900">{selectedRegistration.nama_santri}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nama Wali</p>
                <p className="font-semibold text-gray-900">{selectedRegistration.nama_wali}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email Wali</p>
                <p className="font-semibold text-gray-900">{selectedRegistration.email_wali}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tanggal Daftar</p>
                <p className="font-semibold text-gray-900">
                  {new Date(selectedRegistration.tanggal_daftar).toLocaleDateString('id-ID')}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Perhatian:</strong> Setelah diverifikasi, akun untuk santri dan wali akan dibuat secara otomatis.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowVerifyModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleVerifyRegistration(selectedRegistration.id)}
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  Verifikasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {showViewStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <GraduationCap className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Detail Santri</h2>
                  <p className="text-gray-600">Informasi lengkap santri</p>
                </div>
              </div>
              <button
                onClick={() => setShowViewStudentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nama Santri</p>
                  <p className="font-semibold text-gray-900">{selectedStudent.nama_santri}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nomor Induk</p>
                  <p className="font-semibold text-gray-900">{selectedStudent.nomor_induk}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">NISN</p>
                  <p className="font-semibold text-gray-900">{selectedStudent.nisn || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kelas/Jenjang</p>
                  <p className="font-semibold text-gray-900">{selectedStudent.nama_kelas || '-'} ({selectedStudent.nama_jenjang || '-'})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nama Wali</p>
                  <p className="font-semibold text-gray-900">{selectedStudent.nama_wali || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
