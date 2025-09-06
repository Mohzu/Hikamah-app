import { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Search, 
  Edit, 
  Trash2, 
  UserX, 
  CheckCircle, 
  User, 
  Mail, 
  Phone, 
  Home, 
  Briefcase, 
  Info 
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

// --- INTERFACES ---
// Diperbarui untuk mencakup semua data yang dikirim oleh API baru
interface Student {
  id_santri: number;
  nama_santri: string;
  nomor_induk: string;
  nisn: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string; // ISO string date
  jenis_kelamin: 'L' | 'P';
  alamat: string | null;
  foto_profil: string | null;
  anak_ke: number | null;
  dari_bersaudara: number | null;
  agama: string | null;
  
  // Info Wali
  nama_wali: string | null;
  email_wali: string | null;

  // Info Kelas (terbaru)
  nama_kelas: string | null;
  nama_jenjang: string | null;

  // Info Orang Tua
  nama_ayah: string | null;
  pekerjaan_ayah: string | null;
  nomor_hp_ayah: string | null;
  nama_ibu: string | null;
  pekerjaan_ibu: string | null;
  nomor_hp_ibu: string | null;
}

interface UnverifiedRegistration {
  id: number;
  nama_santri: string;
  nama_wali: string;
  email_wali: string;
  tanggal_daftar: string;
}

// --- COMPONENT ---
export function StudentsManagementPage() {
  // State diubah menjadi array biasa, bukan lagi object bertingkat
  const [students, setStudents] = useState<Student[]>([]);
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

    const onSantriAssigned = () => fetchStudents();
    window.addEventListener('santri-assigned', onSantriAssigned);
    return () => window.removeEventListener('santri-assigned', onSantriAssigned);
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/manage/santri/santri`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        // Langsung set array dari API
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

  const handleDeleteStudent = async (e: React.MouseEvent, studentId: number) => {
    e.stopPropagation(); // Mencegah modal detail terbuka saat klik hapus
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

  const handleUpdateNisn = async (e: React.MouseEvent, student: Student) => {
    e.stopPropagation(); // Mencegah modal detail terbuka
    const newNisn = prompt('Masukkan NISN baru:', student.nisn || '');
    if (newNisn && newNisn !== student.nisn) {
        try {
          const response = await axios.put(
            `${import.meta.env.VITE_API_URL}/api/manage/santri/santri/${student.id_santri}/nisn`, 
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
    }
  };

  const filteredStudents = students.filter(student =>
    student.nama_santri.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.nisn && student.nisn.includes(searchTerm)) ||
    student.nomor_induk.includes(searchTerm) ||
    (student.nama_wali && student.nama_wali.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.nama_kelas && student.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openVerificationModal = (registration: UnverifiedRegistration) => {
    setSelectedRegistration(registration);
    setShowVerifyModal(true);
  };

  const renderDetailRow = (icon: React.ReactNode, label: string, value: any) => (
    <div className="py-3 border-b border-gray-100">
      <p className="text-sm text-gray-500 flex items-center">{icon}<span className="ml-2">{label}</span></p>
      <p className="font-semibold text-gray-800 mt-1">{value || '-'}</p>
    </div>
  );

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
            <h2 className="text-lg font-bold text-gray-900 mb-4">Pendaftaran Menunggu Verifikasi</h2>
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
                    {unverifiedRegistrations.map((reg, i) => (
                    <tr key={reg.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="py-4 px-6 font-semibold text-gray-900">{reg.nama_santri}</td>
                        <td className="py-4 px-6">{reg.nama_wali} ({reg.email_wali})</td>
                        <td className="py-4 px-6">{new Date(reg.tanggal_daftar).toLocaleDateString('id-ID')}</td>
                        <td className="py-4 px-6 text-center">
                        <button onClick={() => openVerificationModal(reg)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><CheckCircle size={16} /></button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Daftar Santri Terverifikasi</h2>
            <div className="relative flex-1 max-w-md ml-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" placeholder="Cari santri..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
        </div>
        {loading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div><p className="text-gray-500 mt-2">Memuat data...</p></div>
        ) : students.length === 0 ? (
          <div className="text-center py-8"><GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" /><p className="text-gray-500">Belum ada data santri terverifikasi.</p></div>
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
                        <img src={`${import.meta.env.VITE_API_URL}${student.foto_profil}` || 'https://via.placeholder.com/40'} alt={student.nama_santri} className="w-10 h-10 rounded-xl object-cover mr-3" />
                        <div>
                          <p className="font-semibold text-gray-900">{student.nama_santri}</p>
                          <p className="text-sm text-gray-600">NISN: {student.nisn || '-'} • No. Induk: {student.nomor_induk}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-700">{student.nama_kelas ? `${student.nama_kelas} (${student.nama_jenjang})` : 'Belum ditempatkan'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-700">{student.nama_wali || '-'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={(e) => handleUpdateNisn(e, student)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Update NISN"><Edit size={16} /></button>
                        <button onClick={(e) => handleDeleteStudent(e, student.id_santri)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Hapus"><Trash2 size={16} /></button>
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
            {/* ... Konten Modal Verifikasi ... */}
        </div>
      )}

      {/* View Student Modal */}
      {showViewStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowViewStudentModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
                <div className="flex items-start space-x-6">
                    <img src={`${import.meta.env.VITE_API_URL}${selectedStudent.foto_profil}` || 'https://via.placeholder.com/150'} alt={selectedStudent.nama_santri} className="w-40 h-40 rounded-2xl object-cover border-4 border-white shadow-lg" />
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold text-gray-900">{selectedStudent.nama_santri}</h2>
                        <p className="text-lg text-gray-600">{selectedStudent.nomor_induk}</p>
                        <div className="mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium inline-block">
                            {selectedStudent.nama_kelas ? `${selectedStudent.nama_kelas} (${selectedStudent.nama_jenjang})` : 'Belum Ditempatkan'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                {/* --- Biodata Santri --- */}
                <div className="lg:col-span-3 font-bold text-lg text-gray-800 border-b-2 border-gray-200 pb-2 mb-2">Biodata Santri</div>
                {renderDetailRow(<Info size={16}/>, "NISN", selectedStudent.nisn)}
                {renderDetailRow(<Info size={16}/>, "Jenis Kelamin", selectedStudent.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan')}
                {renderDetailRow(<Info size={16}/>, "TTL", `${selectedStudent.tempat_lahir}, ${new Date(selectedStudent.tanggal_lahir).toLocaleDateString('id-ID')}`)}
                {renderDetailRow(<Info size={16}/>, "Anak Ke", `${selectedStudent.anak_ke} dari ${selectedStudent.dari_bersaudara} bersaudara`)}
                {renderDetailRow(<Info size={16}/>, "Agama", selectedStudent.agama)}
                {renderDetailRow(<Home size={16}/>, "Alamat", selectedStudent.alamat)}

                {/* --- Informasi Wali --- */}
                <div className="lg:col-span-3 font-bold text-lg text-gray-800 border-b-2 border-gray-200 pb-2 mb-2 mt-4">Informasi Wali</div>
                {renderDetailRow(<User size={16}/>, "Nama Wali", selectedStudent.nama_wali)}
                {renderDetailRow(<Mail size={16}/>, "Email Wali", selectedStudent.email_wali)}

                {/* --- Informasi Ayah --- */}
                <div className="lg:col-span-3 font-bold text-lg text-gray-800 border-b-2 border-gray-200 pb-2 mb-2 mt-4">Informasi Ayah</div>
                {renderDetailRow(<User size={16}/>, "Nama Ayah", selectedStudent.nama_ayah)}
                {renderDetailRow(<Briefcase size={16}/>, "Pekerjaan Ayah", selectedStudent.pekerjaan_ayah)}
                {renderDetailRow(<Phone size={16}/>, "No. HP Ayah", selectedStudent.nomor_hp_ayah)}

                {/* --- Informasi Ibu --- */}
                <div className="lg:col-span-3 font-bold text-lg text-gray-800 border-b-2 border-gray-200 pb-2 mb-2 mt-4">Informasi Ibu</div>
                {renderDetailRow(<User size={16}/>, "Nama Ibu", selectedStudent.nama_ibu)}
                {renderDetailRow(<Briefcase size={16}/>, "Pekerjaan Ibu", selectedStudent.pekerjaan_ibu)}
                {renderDetailRow(<Phone size={16}/>, "No. HP Ibu", selectedStudent.nomor_hp_ibu)}
            </div>
            <div className="p-6 bg-gray-50 rounded-b-3xl text-right">
                <button onClick={() => setShowViewStudentModal(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-xl font-semibold hover:bg-gray-300 transition-colors">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}