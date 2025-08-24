import { useState, useEffect } from "react";
import axios from "axios";
import { DashboardSummary } from "../organisms/DashboardSummary";
import { Calendar, BookOpen } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContexts"; // Pastikan path benar
import { toast } from 'react-toastify'; // Import toast untuk feedback error

// Interface untuk data yang diterima dari API (snake_case)
interface FetchedDashboardData {
  sisa_tagihan: number;
  total_terbayar: number;
  rata_rata_nilai: number;
  progress_hafalan: number;
}

export function DashboardPage() {
  const { user } = useAuth(); // Ambil user dari AuthContext
  const [dashboardData, setDashboardData] = useState<FetchedDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // State untuk menangani error

  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.peran !== 'Santri') { // Hanya fetch jika user adalah Santri
        setError('Akses ditolak. Anda harus login sebagai Santri.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null); // Reset error setiap kali fetch
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/account/santri/dashboard-summary`, // Endpoint yang sudah diperbarui
          { withCredentials: true }
        );
        if (response.data && response.data.success) {
          setDashboardData(response.data.data);
        } else {
          setError(response.data.error || 'Gagal mengambil data dashboard.');
          toast.error(response.data.error || 'Gagal memuat data dashboard.');
        }
      } catch (err: any) {
        console.error("[DashboardPage] Gagal mengambil data dashboard:", err);
        setError(err.response?.data?.error || 'Gagal terhubung ke server atau terjadi kesalahan.');
        toast.error(err.response?.data?.error || 'Gagal memuat data dashboard.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]); // Dependensi user agar fetch ulang jika user berubah

  return (
    <div className="space-y-8">
      {/* Header Selamat Datang */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl p-8 text-white shadow-2xl flex justify-between items-center">
        <div>
          <div className="flex items-center text-sm mb-2 text-teal-100">
            <Calendar className="w-4 h-4 mr-2" />
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Selamat Datang, {user?.nama_santri || user?.username}!</h1> {/* Tampilkan nama santri */}
          <p className="text-teal-100 mb-2">
            Portal informasi lengkap untuk memantau perkembangan santri
          </p>
          <div className="flex items-center text-sm text-teal-100">
            <BookOpen className="w-4 h-4 mr-2" />
            Tahun Ajaran 2024/2025
          </div>
        </div>
        <div className="bg-teal-700/40 p-6 rounded-2xl">
          <BookOpen className="w-10 h-10" />
        </div>
      </div>

      {/* Konten setelah header */}
      {isLoading ? (
        <div className="p-4 text-center">Memuat data...</div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : !dashboardData ? (
        <div className="p-4 text-center">Data tidak ditemukan.</div>
      ) : (
        <DashboardSummary
          sisaTagihan={dashboardData.sisa_tagihan}
          totalTerbayar={dashboardData.total_terbayar}
          rataRataNilai={dashboardData.rata_rata_nilai}
          progressHafalan={dashboardData.progress_hafalan}
        />
      )}
    </div>
  );
}
