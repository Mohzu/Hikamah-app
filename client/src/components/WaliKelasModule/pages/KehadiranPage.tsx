import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TahunAjaranFilter } from '../molecules/TahunAjaranFilter';

type KehadiranRow = {
  id_santri: number;
  nama_lengkap: string;
  nisn: string;
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
};

export function KehadiranPage() {
  const [rows, setRows] = useState<KehadiranRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const tahun_ajaran = params.get('tahun_ajaran');
        if (!tahun_ajaran) {
          const now = new Date();
          const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
          const defaultTA = `${startYear}/${startYear + 1}`;
          const next = new URLSearchParams(location.search);
          next.set('tahun_ajaran', defaultTA);
          navigate({ pathname: location.pathname, search: next.toString() }, { replace: true });
          return;
        }
        const url = new URL(`${import.meta.env.VITE_API_URL}/api/account/wali-kelas/absensi`);
        if (tahun_ajaran) url.searchParams.set('tahun_ajaran', tahun_ajaran);
        const res = await axios.get(url.toString(), { withCredentials: true });
        if (res.data.success) setRows(res.data.data);
        else setError(res.data.error || 'Gagal memuat data');
      } catch (e: any) {
        setError(e.response?.data?.error || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location.search]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(r => r.nama_lengkap.toLowerCase().includes(q) || (r.nisn ?? '').toString().includes(q));
  }, [rows, search]);

  if (loading) return <div>Memuat...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-indigo-100 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#e0e7ff_0%,_#eef2ff_60%,_#ffffff_100%)]" />
        <div className="relative p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Kehadiran Santri</h2>
            <p className="text-sm text-gray-600">Rekap kehadiran per santri</p>
          </div>
          <div className="flex items-center gap-3">
            <TahunAjaranFilter />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama/NISN..." className="px-4 py-2 border rounded-lg" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="px-5 py-3">Nama</th>
              <th className="px-5 py-3">NISN</th>
              <th className="px-5 py-3">Hadir</th>
              <th className="px-5 py-3">Sakit</th>
              <th className="px-5 py-3">Izin</th>
              <th className="px-5 py-3">Alfa</th>
              <th className="px-5 py-3">Kehadiran</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const total = (r.hadir || 0) + (r.sakit || 0) + (r.izin || 0) + (r.alfa || 0);
              const pct = total > 0 ? Math.round(((r.hadir || 0) / total) * 100) : 0;
              return (
                <tr key={r.id_santri} className="border-b last:border-0 hover:bg-gray-50 transition">
                  <td className="px-5 py-3 text-gray-900 font-medium">{r.nama_lengkap}</td>
                  <td className="px-5 py-3">{r.nisn}</td>
                  <td className="px-5 py-3"><span className="px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">{r.hadir}</span></td>
                  <td className="px-5 py-3"><span className="px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-semibold">{r.sakit}</span></td>
                  <td className="px-5 py-3"><span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{r.izin}</span></td>
                  <td className="px-5 py-3"><span className="px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold">{r.alfa}</span></td>
                  <td className="px-5 py-3 w-64">
                    <div className="w-full bg-gray-100 rounded-full h-2" aria-label={`Kehadiran ${pct}%`}>
                      <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1 font-medium">{pct}% hadir</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


