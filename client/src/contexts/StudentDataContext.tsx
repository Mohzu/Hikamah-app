// client/src/contexts/StudentDataContext.tsx

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContexts';
import { toast } from 'react-toastify';

interface Grade {
  id_nilai: number;
  id_mapel: number;
  nama_mapel: string;
  nilai_akhir: number;
}

interface HafalanProgress {
  id_hafalan?: number;
  surah: string;
  ayat_awal: number;
  ayat_akhir: number;
  status: string;
  tanggal_setor: string;
}

interface Payment {
  id_pembayaran?: number;
  jenis_pembayaran: string;
  jumlah: number;
  status: 'Lunas' | 'Belum Lunas';
  tanggal_jatuh_tempo: string;
}

interface Student {
  id_santri: number;
  nama_lengkap: string;
  nisn: string;
  kelas_id?: number;
  nama_kelas?: string;
  tahun_ajaran: string;
  rata_rata_nilai: number;
  total_hafalan_juz: number;
  sisa_tagihan: number;
  grades: Grade[];
  hafalanProgress: HafalanProgress[];
  payments: Payment[];
  foto_profil?: string; // Perbaikan: Menambahkan properti foto_profil
}

interface StudentDataContextType {
  student: Student | null;
  isLoading: boolean;
  error: string | null;
  refetchStudentData: () => void;
}

const StudentDataContext = createContext<StudentDataContextType | undefined>(undefined);

export const StudentDataProvider = ({ children }: { children: ReactNode }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggedIn } = useAuth();

  const fetchStudentData = async () => {
    console.log('[StudentDataContext] Memulai fetch data santri...');
    setIsLoading(true);
    setError(null);

    if (!isLoggedIn || (user?.peran !== 'Santri' && user?.peran !== 'Wali Santri')) {
      console.log('[StudentDataContext] Pengguna bukan Santri/Wali. Membatalkan fetch.');
      setStudent(null);
      setIsLoading(false);
      return;
    }

    try {
      const profileRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/account/santri/profile`, { withCredentials: true });
      console.log('[StudentDataContext] Respon dari API /profile:', profileRes.data);

      if (profileRes.data.success && profileRes.data.data) {
        const { santri } = profileRes.data.data;

        const gradesRes = await axios.get(`/api/account/santri/my-nilai`);
        const hafalanRes = await axios.get(`/api/account/santri/hafalan`);

        const gradesData = gradesRes.data.data;
        const totalNilai = Object.values(gradesData).flatMap((g: any) => g).reduce((sum: number, grade: any) => sum + (grade.nilai_akhir || 0), 0);
        const allGrades = Object.values(gradesData).flatMap((g: any) => g);
        const rataRata = allGrades.length > 0 ? (totalNilai / allGrades.length) : 0;
        
        const sisaTagihan = 13300000;
        const totalTerbayar = 2000000;
        const progressHafalan = hafalanRes.data.success && hafalanRes.data.data ? hafalanRes.data.data.length : 0;
        const tahunAjaran = "2024/2025";
        
        const processedStudent: Student = {
          id_santri: santri.id_santri,
          nama_lengkap: santri.nama_lengkap,
          nisn: santri.nisn,
          kelas_id: santri.id_kelas,
          nama_kelas: santri.nama_kelas,
          tahun_ajaran: tahunAjaran,
          rata_rata_nilai: parseFloat(rataRata.toFixed(1)),
          total_hafalan_juz: progressHafalan,
          sisa_tagihan: sisaTagihan,
          grades: allGrades,
          hafalanProgress: hafalanRes.data.success ? hafalanRes.data.data : [],
          payments: [],
          foto_profil: santri.foto_profil, // Perbaikan: Mengambil foto_profil dari respons API
        };
        
        console.log('[StudentDataContext] Data santri yang diproses:', processedStudent);
        setStudent(processedStudent);
      } else {
        setError("Gagal memuat sebagian data santri dari API.");
        toast.error("Gagal memuat data santri.");
      }
    } catch (err: any) {
      console.error('[StudentDataContext] Gagal mengambil data santri:', err);
      setError(err.response?.data?.error || 'Terjadi kesalahan saat mengambil data santri. Cek koneksi server.');
      setStudent(null);
      toast.error(err.response?.data?.error || 'Gagal memuat data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [isLoggedIn, user?.peran, user?.id_pengguna]);

  const refetchStudentData = () => {
    fetchStudentData();
  };

  const value = { student, isLoading, error, refetchStudentData };

  return <StudentDataContext.Provider value={value}>{children}</StudentDataContext.Provider>;
};

export const useStudentData = () => {
  const context = useContext(StudentDataContext);
  if (context === undefined) {
    throw new Error('useStudentData harus digunakan di dalam StudentDataProvider');
  }
  return context;
};