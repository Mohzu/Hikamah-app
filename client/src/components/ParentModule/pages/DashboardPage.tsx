// client/src/components/ParentModule/pages/DashboardPage.tsx

import { useState, useEffect } from "react";
import axios from "axios";
import { DashboardSummary } from "../organisms/DashboardSummary";
import { Calendar, BookOpen, Loader2, ChevronDown } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContexts";
import { toast } from 'react-toastify';
import { ScheduleTable } from "../organisms/ScheduleTable";

// Interface untuk data yang diterima dari API dashboard
interface FetchedDashboardData {
  sisa_tagihan: number;
  total_terbayar: number;
  rata_rata_nilai: number;
  progress_hafalan: number;
}

// Interface untuk data jadwal
interface JadwalPelajaran {
  [hari: string]: {
    mata_pelajaran: string;
    nama_guru: string;
    waktu: string;
  }[];
}

export function DashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<FetchedDashboardData | null>(null);
  const [scheduleData, setScheduleData] = useState<JadwalPelajaran | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user || (user.peran !== 'Santri' && user.peran !== 'Wali Santri')) {
        setError('Akses ditolak. Anda harus login sebagai Santri atau Wali Santri.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const [dashboardResponse, yearsResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/account/santri/dashboard-summary`, { withCredentials: true }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/account/santri/available-academic-years`, { withCredentials: true }),
        ]);

        if (dashboardResponse.data.success) {
          setDashboardData(dashboardResponse.data.data);
        } else {
          toast.error(dashboardResponse.data.error || 'Gagal memuat data dasbor.');
        }

        if (yearsResponse.data.success && yearsResponse.data.data.length > 0) {
          const periods = yearsResponse.data.data;
          // Extract unique years from periods
          const years = Array.from(new Set(periods.map((p: any) => p.tahun_ajaran))) as string[];
          setAvailableYears(years);
          setSelectedYear(years[0]);
        }
      } catch (err: any) {
        console.error("[DashboardPage] Gagal mengambil data:", err);
        setError(err.response?.data?.error || 'Gagal terhubung ke server atau terjadi kesalahan.');
        toast.error(err.response?.data?.error || 'Gagal memuat data.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  useEffect(() => {
    if (selectedYear) {
      const fetchSchedule = async () => {
        try {
          const scheduleResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/account/santri/jadwal?tahun_ajaran=${selectedYear}`, { withCredentials: true });
          if (scheduleResponse.data.success) {
            setScheduleData(scheduleResponse.data.data.jadwal);
          } else {
            setScheduleData({});
            toast.info(scheduleResponse.data.error || 'Jadwal tidak tersedia untuk tahun ajaran ini.');
          }
        } catch (err: any) {
          setScheduleData({});
          console.error("[DashboardPage] Gagal mengambil jadwal:", err);
          toast.error(err.response?.data?.error || 'Gagal memuat jadwal.');
        }
      };
      fetchSchedule();
    }
  }, [selectedYear]);

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
          <h1 className="text-3xl font-extrabold mb-2">Selamat Datang, {user?.nama_santri || user?.username}!</h1>
          <p className="text-teal-100 mb-2">
            Portal informasi lengkap untuk memantau perkembangan santri
          </p>
          {availableYears.length > 0 && (
            <div className="flex items-center text-sm text-teal-100 space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Tahun Ajaran:</span>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent border border-teal-300 rounded-lg pl-2 pr-6 py-1 text-teal-100 font-semibold cursor-pointer appearance-none"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year} className="bg-teal-700">{year}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="bg-teal-700/40 p-6 rounded-2xl">
          <BookOpen className="w-10 h-10" />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 size={48} className="animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">Memuat data...</p>
        </div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : (
        <>
          {dashboardData ? (
            <DashboardSummary
              sisaTagihan={dashboardData.sisa_tagihan}
              totalTerbayar={dashboardData.total_terbayar}
              rataRataNilai={dashboardData.rata_rata_nilai}
              progressHafalan={dashboardData.progress_hafalan}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <p className="text-center text-gray-500">Data dashboard tidak tersedia</p>
            </div>
          )}

          {scheduleData && Object.keys(scheduleData).length > 0 ? (
            <ScheduleTable
              jadwal={scheduleData}
              tahunAjaran={selectedYear}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <p className="text-center text-gray-500">Jadwal tidak tersedia untuk tahun ajaran {selectedYear}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}