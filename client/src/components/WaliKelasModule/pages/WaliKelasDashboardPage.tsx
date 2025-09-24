import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { WKInfoCard } from '../molecules/InfoCard';
import { TahunAjaranFilter } from '../molecules/TahunAjaranFilter';

type SantriItem = {
  id: number;
  nama_lengkap: string;
  nisn: string;
  foto_profil?: string | null;
  nama_jenjang: string;
  nama_kelas: string;
};

export function WaliKelasDashboardPage() {
  const [santri, setSantri] = useState<SantriItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams(location.search);
        let tahun_ajaran = params.get('tahun_ajaran');
        if (!tahun_ajaran) {
          const now = new Date();
          const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
          tahun_ajaran = `${startYear}/${startYear + 1}`;
          const next = new URLSearchParams(location.search);
          next.set('tahun_ajaran', tahun_ajaran);
          navigate({ pathname: location.pathname, search: next.toString() }, { replace: true });
          return;
        }
        const url = new URL(`${import.meta.env.VITE_API_URL}/api/account/wali-kelas/santri`);
        url.searchParams.set('tahun_ajaran', tahun_ajaran);
        const res = await axios.get(url.toString(), { withCredentials: true });
        if (res.data.success) setSantri(res.data.data);
        else setError(res.data.error || 'Gagal memuat data');
      } catch (e: any) {
        setError(e.response?.data?.error || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location.search]);

  const totalSantri = santri.length;
  const jenjang = santri[0]?.nama_jenjang || '-';
  const kelas = santri[0]?.nama_kelas || '-';

  const initials = useMemo(() => (kelas && kelas !== '-' ? kelas.split(' ').map(w => w[0]).join('').slice(0,3).toUpperCase() : 'WLK'), [kelas]);

  if (loading) return <div>Memuat...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-100 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#e0e7ff_0%,_#eef2ff_60%,_#ffffff_100%)]" />
        <div className="relative p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center shadow-inner">
              {initials}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard Wali Kelas</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TahunAjaranFilter />
            <Link to="/guru/santri" className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition">Kelola Santri</Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <WKInfoCard label="Total Santri" value={totalSantri} sublabel="Jumlah santri aktif di kelas" />
        <WKInfoCard label="Jenjang" value={jenjang} sublabel="Tingkat pendidikan" />
        <WKInfoCard label="Kelas" value={kelas} sublabel="Nama kelas yang diampu" />
      </div>

      {/* Preview list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Santri Terdaftar</h3>
          <p className="text-sm text-gray-500">Menampilkan {Math.min(6,totalSantri)} dari {totalSantri} santri</p>
        </div>
        <div className="divide-y">
          {santri.slice(0,6).map(s => (
            <Link key={s.id} to={`/guru/santri/${s.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
              <div className="flex items-center gap-4 min-w-0">
                <img src={s.foto_profil || '/placeholder.png'} className="w-10 h-10 rounded-lg object-cover ring-2 ring-indigo-50" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{s.nama_lengkap}</p>
                  <p className="text-xs text-gray-500">NISN {s.nisn}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{s.nama_jenjang} • {s.nama_kelas}</span>
            </Link>
          ))}
        </div>
        <div className="px-6 py-4 border-t bg-gray-50 text-right">
          <Link to="/guru/santri" className="text-indigo-700 text-sm font-medium hover:underline">Lihat semua santri →</Link>
        </div>
      </div>
    </div>
  );
}


