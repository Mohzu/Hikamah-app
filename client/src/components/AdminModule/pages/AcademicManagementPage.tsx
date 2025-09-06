import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Trash2, 
  Clock, 
  Calendar 
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Subject {
  id_mapel: number;
  nama_mapel: string;
  deskripsi: string;
  kategori: string;
}

interface Schedule {
  id_jadwal: number;
  nama_mapel: string;
  nama_guru: string;
  nama_kelas: string;
  hari: string;
  waktu_mulai: string;
  waktu_selesai: string;
  tahun_ajaran: string;
}

interface Teacher {
  id_guru: number;
  nama_lengkap: string;
  username: string;
}

interface Class {
  id_kelas: number;
  nama_kelas: string;
  nama_jenjang: string;
}

export function AcademicManagementPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedules, setSchedules] = useState<Record<string, Record<string, Schedule[]>>>({});
  const [schedulesError, setSchedulesError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'subjects' | 'schedules'>('subjects');
  const [hasTriedLoadSchedules, setHasTriedLoadSchedules] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showAddToCurriculumModal, setShowAddToCurriculumModal] = useState(false);

  // Form states
  const [subjectFormData, setSubjectFormData] = useState({
    nama_mapel: '',
    deskripsi: '',
    kategori: ''
  });

  const [scheduleFormData, setScheduleFormData] = useState({
    id_guru: '',
    id_mapel: '',
    id_kelas: '',
    tahun_ajaran: '',
    hari: '',
    waktu_mulai: '',
    waktu_selesai: ''
  });

  const [addToCurrFormData, setAddToCurrFormData] = useState({
    id_jenjang: '',
    id_mapel: ''
  });

  useEffect(() => {
    // Initial loads that are safe
    fetchSubjects();
    fetchTeachers();
    fetchClasses();
  }, []);

  useEffect(() => {
    // Load schedules only when user opens the tab and we haven't tried yet
    if (activeTab === 'schedules' && !hasTriedLoadSchedules) {
      setHasTriedLoadSchedules(true);
      fetchSchedules();
    }
  }, [activeTab, hasTriedLoadSchedules]);

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/manage/akademik/mapel`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        const raw = response.data.data as any[];
        const normalized: Subject[] = (raw || []).map((item: any) => ({
          id_mapel: item.id_mapel ?? item.id,
          nama_mapel: item.nama_mapel,
          deskripsi: item.deskripsi ?? '',
          kategori: item.kategori
        }));
        setSubjects(normalized);
      }
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/manage/akademik/jadwal`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setSchedules(response.data.data || {});
        setSchedulesError(null);
      }
    } catch (error: any) {
      // Swallow to avoid noisy console when backend not ready
      // Gracefully degrade if server returns 500 or invalid shape
      setSchedules({});
      setSchedulesError(error.response?.data?.error || 'Gagal memuat jadwal.');
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

  const fetchClasses = async () => {
    try {
      const response = await axios.get<{ [jenjang: string]: Class[] }>(
        `${import.meta.env.VITE_API_URL}/api/manage/guru/wali-kelas`,
        { withCredentials: true }
      );
      
      if (response.data) {
        // Flatten classes from nested structure with proper typing
        const allClasses: Class[] = Object.values(response.data).flat();
        setClasses(allClasses);
      }
    } catch (error: any) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/manage/akademik/mapel`, 
        subjectFormData, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(response.data.data.message);
        setShowAddSubjectModal(false);
        setSubjectFormData({ nama_mapel: '', deskripsi: '', kategori: '' });
        fetchSubjects();
      }
    } catch (error: any) {
      console.error('Error adding subject:', error);
      toast.error(error.response?.data?.error || 'Gagal menambah mata pelajaran');
    }
  };

  const handleAddMapelToJenjang = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!addToCurrFormData.id_jenjang || Number.isNaN(Number(addToCurrFormData.id_jenjang))) {
        toast.error('Jenjang tidak valid');
        return;
      }
      if (!addToCurrFormData.id_mapel || Number.isNaN(Number(addToCurrFormData.id_mapel))) {
        toast.error('Mata pelajaran tidak valid');
        return;
      }
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/manage/akademik/jenjang/${Number(addToCurrFormData.id_jenjang)}/mapel`,
        { id_mapel: Number(addToCurrFormData.id_mapel) },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(response.data.data.message);
        setShowAddToCurriculumModal(false);
        setAddToCurrFormData({ id_jenjang: '', id_mapel: '' });
      }
    } catch (error: any) {
      console.error('Error adding mapel to jenjang:', error);
      const detailsAny = error.response?.data?.details as Record<string, string[]> | undefined;
      const firstDetailAny = detailsAny ? (Object.values(detailsAny)[0]?.[0] as string | undefined) : undefined;
      toast.error(firstDetailAny || error.response?.data?.error || 'Gagal menambahkan mapel ke kurikulum');
    }
  };

  const handleDeleteSubject = async (subjectId: number | undefined | null) => {
    if (subjectId === undefined || subjectId === null || Number.isNaN(Number(subjectId))) {
      toast.error('ID mata pelajaran tidak valid.');
      return;
    }
    if (!confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) return;

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/manage/akademik/mapel/${Number(subjectId)}`, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(response.data.data.message);
        fetchSubjects();
        // Keep schedules view stable; no server fetch here
      }
    } catch (error: any) {
      console.error('Error deleting subject:', error);
      toast.error(error.response?.data?.error || 'Gagal menghapus mata pelajaran');
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate required ids are numeric
      if (!scheduleFormData.id_kelas || Number.isNaN(Number(scheduleFormData.id_kelas))) {
        toast.error('Kelas tidak valid.');
        return;
      }
      if (!scheduleFormData.id_mapel || Number.isNaN(Number(scheduleFormData.id_mapel))) {
        toast.error('Mata pelajaran tidak valid.');
        return;
      }
      if (!scheduleFormData.id_guru || Number.isNaN(Number(scheduleFormData.id_guru))) {
        toast.error('Guru tidak valid.');
        return;
      }
      if (!/^\d{4}\/\d{4}$/.test(scheduleFormData.tahun_ajaran)) {
        toast.error('Format tahun ajaran harus YYYY/YYYY');
        return;
      }
      if (!scheduleFormData.hari) {
        toast.error('Hari harus dipilih.');
        return;
      }
      if (!/^\d{2}:\d{2}$/.test(scheduleFormData.waktu_mulai) || !/^\d{2}:\d{2}$/.test(scheduleFormData.waktu_selesai)) {
        toast.error('Format waktu harus HH:MM');
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/manage/akademik/kelas/${Number(scheduleFormData.id_kelas)}/mapel/${Number(scheduleFormData.id_mapel)}/assign-guru`, 
        {
          id_guru: parseInt(scheduleFormData.id_guru),
          tahun_ajaran: scheduleFormData.tahun_ajaran,
          hari: scheduleFormData.hari,
          waktu_mulai: scheduleFormData.waktu_mulai,
          waktu_selesai: scheduleFormData.waktu_selesai
        }, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(response.data.data.message);
        setShowAddScheduleModal(false);
        setScheduleFormData({
          id_guru: '',
          id_mapel: '',
          id_kelas: '',
          tahun_ajaran: '',
          hari: '',
          waktu_mulai: '',
          waktu_selesai: ''
        });
        fetchSchedules();
        // --- KIRIM SINYAL --- 
        window.dispatchEvent(new Event('schedule-updated'));
      }
    } catch (error: any) {
      console.error('Error adding schedule:', error);
      toast.error(error.response?.data?.error || 'Gagal menambah jadwal');
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/manage/akademik/jadwal/${scheduleId}`, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success(response.data.data.message);
        fetchSchedules();
        // --- KIRIM SINYAL --- 
        window.dispatchEvent(new Event('schedule-updated'));
      }
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      toast.error(error.response?.data?.error || 'Gagal menghapus jadwal');
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.nama_mapel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (subject.deskripsi && subject.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Flatten schedules for search
  const allSchedules = Object.values(schedules).flatMap(classSchedules => 
    Object.values(classSchedules).flat()
  );

  const filteredSchedules = allSchedules.filter(schedule =>
    schedule.nama_mapel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.nama_guru.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.hari.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDayColor = (day: string) => {
    const colors = {
      'Senin': 'bg-blue-100 text-blue-800',
      'Selasa': 'bg-green-100 text-green-800',
      'Rabu': 'bg-yellow-100 text-yellow-800',
      'Kamis': 'bg-purple-100 text-purple-800',
      'Jumat': 'bg-red-100 text-red-800',
      'Sabtu': 'bg-indigo-100 text-indigo-800',
      'Minggu': 'bg-gray-100 text-gray-800'
    };
    return colors[day as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manajemen Akademik</h1>
              <p className="text-gray-600">Kelola mata pelajaran dan jadwal mengajar</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {activeTab === 'subjects' && (
              <button
                onClick={() => setShowAddSubjectModal(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-orange-700 transition-colors"
              >
                <Plus size={20} />
                <span>Tambah Mapel</span>
              </button>
            )}
            {activeTab === 'subjects' && (
              <button
                onClick={() => setShowAddToCurriculumModal(true)}
                className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-orange-200 transition-colors"
              >
                <Plus size={20} />
                <span>Tambah ke Kurikulum</span>
              </button>
            )}
            {activeTab === 'schedules' && (
              <button
                onClick={() => setShowAddScheduleModal(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-orange-700 transition-colors"
              >
                <Plus size={20} />
                <span>Tambah Jadwal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'subjects'
                ? 'bg-orange-100 text-orange-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Mata Pelajaran
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'schedules'
                ? 'bg-orange-100 text-orange-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Jadwal Mengajar
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={activeTab === 'subjects' ? 'Cari mata pelajaran...' : 'Cari jadwal...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-500">
            {activeTab === 'subjects' 
              ? `${filteredSubjects.length} dari ${subjects.length} mata pelajaran`
              : `${filteredSchedules.length} dari ${allSchedules.length} jadwal`
            }
          </div>
        </div>

        {/* Content */}
        {activeTab === 'subjects' ? (
          /* Subjects Tab */
          <div className="space-y-4">
            {filteredSubjects.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'Tidak ada mata pelajaran yang sesuai dengan pencarian' : 'Belum ada data mata pelajaran'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubjects.map(subject => (
                  <div key={subject.id_mapel} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center mr-3">
                          <BookOpen className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{subject.nama_mapel}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            subject.kategori === 'Umum' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {subject.kategori}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSubject(subject.id_mapel)}
                        className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {subject.deskripsi && (
                      <p className="text-sm text-gray-600">{subject.deskripsi}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Schedules Tab */
          <div className="space-y-6">
            {schedulesError ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">{schedulesError}</p>
              </div>
            ) : Object.keys(schedules).length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Belum ada data jadwal</p>
              </div>
            ) : (
              Object.entries(schedules).map(([className, daySchedules]) => (
                <div key={className} className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{className}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(daySchedules)
                      .filter(([day, schedules]) => 
                        schedules.some(schedule =>
                          schedule.nama_mapel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          schedule.nama_guru.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          day.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                      )
                      .map(([day, dayScheduleList]) => (
                        <div key={day} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDayColor(day)}`}>
                              {day}
                            </span>
                            <span className="text-xs text-gray-500">{dayScheduleList.length} jadwal</span>
                          </div>
                          <div className="space-y-2">
                            {dayScheduleList
                              .filter(schedule =>
                                schedule.nama_mapel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                schedule.nama_guru.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                day.toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map(schedule => (
                                <div key={schedule.id_jadwal} className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold text-sm text-gray-900">{schedule.nama_mapel}</p>
                                    <button
                                      onClick={() => handleDeleteSchedule(schedule.id_jadwal)}
                                      className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                                      title="Hapus"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-600 mb-1">{schedule.nama_guru}</p>
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Clock size={12} className="mr-1" />
                                    <span>{schedule.waktu_mulai} - {schedule.waktu_selesai}</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                  <Plus className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tambah Mata Pelajaran</h2>
                  <p className="text-gray-600">Buat mata pelajaran baru</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={subjectFormData.nama_mapel}
                  onChange={(e) => setSubjectFormData({...subjectFormData, nama_mapel: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                <select
                  required
                  value={subjectFormData.kategori}
                  onChange={(e) => setSubjectFormData({...subjectFormData, kategori: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Pilih Kategori</option>
                  <option value="Umum">Umum</option>
                  <option value="Diniyah">Diniyah</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi (Opsional)</label>
                <textarea
                  value={subjectFormData.deskripsi}
                  onChange={(e) => setSubjectFormData({...subjectFormData, deskripsi: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors"
                >
                  Tambah Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Schedule Modal */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tambah Jadwal</h2>
                  <p className="text-gray-600">Buat jadwal mengajar baru</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddScheduleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
                <select
                  required
                  value={scheduleFormData.id_kelas}
                  onChange={(e) => setScheduleFormData({...scheduleFormData, id_kelas: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Pilih Kelas</option>
                  {classes.map(classItem => (
                    <option key={classItem.id_kelas} value={classItem.id_kelas}>
                      {classItem.nama_kelas} ({classItem.nama_jenjang})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mata Pelajaran</label>
                <select
                  required
                  value={scheduleFormData.id_mapel}
                  onChange={(e) => setScheduleFormData({...scheduleFormData, id_mapel: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {subjects.map(subject => (
                    <option key={subject.id_mapel} value={subject.id_mapel}>
                      {subject.nama_mapel} ({subject.kategori})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Guru</label>
                <select
                  required
                  value={scheduleFormData.id_guru}
                  onChange={(e) => setScheduleFormData({...scheduleFormData, id_guru: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Pilih Guru</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id_guru} value={teacher.id_guru}>
                      {teacher.nama_lengkap} (@{teacher.username})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hari</label>
                  <select
                    required
                    value={scheduleFormData.hari}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, hari: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Pilih Hari</option>
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                    <option value="Minggu">Minggu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tahun Ajaran</label>
                  <input
                    type="text"
                    required
                    placeholder="2024/2025"
                    value={scheduleFormData.tahun_ajaran}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, tahun_ajaran: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Waktu Mulai</label>
                  <input
                    type="time"
                    required
                    value={scheduleFormData.waktu_mulai}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, waktu_mulai: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Waktu Selesai</label>
                  <input
                    type="time"
                    required
                    value={scheduleFormData.waktu_selesai}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, waktu_selesai: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddScheduleModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors"
                >
                  Tambah Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Mapel To Curriculum Modal */}
      {showAddToCurriculumModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                  <BookOpen className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tambah Mapel ke Kurikulum</h2>
                  <p className="text-gray-600">Pilih jenjang dan mata pelajaran</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddToCurriculumModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleAddMapelToJenjang} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenjang Pendidikan</label>
                <select
                  required
                  value={addToCurrFormData.id_jenjang}
                  onChange={(e) => setAddToCurrFormData({ ...addToCurrFormData, id_jenjang: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Pilih Jenjang</option>
                  <option value="1">SD/MI</option>
                  <option value="2">SMP/MTs</option>
                  <option value="3">SMA/MA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mata Pelajaran</label>
                <select
                  required
                  value={addToCurrFormData.id_mapel}
                  onChange={(e) => setAddToCurrFormData({ ...addToCurrFormData, id_mapel: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {subjects.map(subject => (
                    <option key={subject.id_mapel} value={subject.id_mapel}>
                      {subject.nama_mapel} ({subject.kategori})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddToCurriculumModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors"
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