// client/src/contexts/StudentDataContext.tsx

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContexts';

interface Grade {
  id_nilai: number;
  id_mapel: number;
  nama_mapel: string;
  nilai_akhir: number;
  // Tambahkan field lain yang relevan dari API nilai jika ada
}

interface HafalanProgress {
  // Tipe data untuk hafalan. Perlu endpoint API untuk ini.
  id_hafalan?: number; // Opsional karena masih mock
  surah: string;
  ayat_awal: number;
  ayat_akhir: number;
  status: string;
  tanggal_setor: string;
}

interface Payment {
  // Tipe data untuk pembayaran. Perlu endpoint API untuk ini.
  id_pembayaran?: number; // Opsional karena masih mock
  jenis_pembayaran: string;
  jumlah: number;
  status: 'Lunas' | 'Belum Lunas';
  tanggal_jatuh_tempo: string;
}

// Tipe untuk data santri lengkap yang akan digunakan di frontend
interface Student {
  id_santri: number;
  nama_lengkap: string;
  nisn: string;
  kelas_id: number;
  nama_kelas: string;
  tahun_ajaran: string; // Ini adalah mock atau perlu API baru
  rata_rata_nilai: number; // Dihitung di frontend atau perlu API baru
  total_hafalan_juz: number; // Ini adalah mock atau perlu API baru
  sisa_tagihan: number; // Ini adalah mock atau perlu API baru
  grades: Grade[];
  hafalanProgress: HafalanProgress[]; // Ini adalah mock atau perlu API baru
  payments: Payment[]; // Ini adalah mock atau perlu API baru
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
    setIsLoading(true);
    setError(null);

    // Hanya ambil data jika user login dan perannya Santri
    if (!isLoggedIn || user?.peran !== 'Santri') {
      setStudent(null);
      setIsLoading(false);
      return;
    }

    try {
      // Panggilan API ke backend mohzu
      const profileRes = await axios.get(`/api/account/santri/profile`);
      const gradesRes = await axios.get(`/api/account/santri/my-nilai`);

      // Anda akan menambahkan panggilan API untuk hafalan dan pembayaran di sini
      // const hafalanRes = await axios.get(`/api/account/santri/my-hafalan`); // Contoh
      // const paymentRes = await axios.get(`/api/account/santri/my-payments`); // Contoh

      if (profileRes.data.success && gradesRes.data.success) {
        const profileData = profileRes.data.data.santri;
        const gradesData = gradesRes.data.data.nilai;

        // --- Perhitungan dan Mock Data untuk Dashboard ---
        // Rata-rata Nilai: Dihitung dari gradesData
        const totalNilai = gradesData.reduce((sum: number, grade: Grade) => sum + grade.nilai_akhir, 0);
        const rataRata = gradesData.length > 0 ? (totalNilai / gradesData.length) : 0;

        // Mock Data: Ini perlu diganti dengan panggilan API aktual
        const sisaTagihan = 13300000; // Contoh: Dapatkan dari API pembayaran
        const totalHafalanJuz = 3; // Contoh: Dapatkan dari API hafalan
        const tahunAjaran = "2024/2025"; // Contoh: Dapatkan dari profil santri atau setting

        const mockHafalanProgress: HafalanProgress[] = [ // Contoh mock, ganti dengan API
          { surah: "Al-Fatihah", ayat_awal: 1, ayat_akhir: 7, status: "selesai", tanggal_setor: "2024-07-20" },
          { surah: "An-Nas", ayat_awal: 1, ayat_akhir: 6, status: "selesai", tanggal_setor: "2024-07-15" },
        ];
        const mockPayments: Payment[] = [ // Contoh mock, ganti dengan API
          { jenis_pembayaran: "SPP Juli", jumlah: 500000, status: "Belum Lunas", tanggal_jatuh_tempo: "2024-07-31" },
        ];
        // --- Akhir Mock Data ---

        const processedStudent: Student = {
          id_santri: profileData.id_santri,
          nama_lengkap: profileData.nama_lengkap,
          nisn: profileData.nisn,
          kelas_id: profileData.kelas_id,
          nama_kelas: profileData.nama_kelas,
          tahun_ajaran: tahunAjaran, // Saat ini mock
          rata_rata_nilai: parseFloat(rataRata.toFixed(1)), // Dihitung di frontend
          total_hafalan_juz: totalHafalanJuz, // Saat ini mock
          sisa_tagihan: sisaTagihan, // Saat ini mock
          grades: gradesData,
          hafalanProgress: mockHafalanProgress, // Saat ini mock
          payments: mockPayments, // Saat ini mock
        };

        setStudent(processedStudent);
      } else {
        setError("Gagal memuat sebagian data santri dari API.");
      }
    } catch (err: any) {
      console.error('Gagal mengambil data santri:', err);
      setError(err.response?.data?.error || 'Terjadi kesalahan saat mengambil data santri. Cek koneksi server atau CORS.');
      setStudent(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [isLoggedIn, user?.peran, user?.id_pengguna]); // Trigger ulang saat status login atau user berubah

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
