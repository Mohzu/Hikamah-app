import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SantriGrid } from '../organisms/SantriGrid';
import type { SantriItem } from '../organisms/SantriGrid';
import { TahunAjaranFilter } from '../molecules/TahunAjaranFilter';

type Item = SantriItem;

export function SantriListPage() {
  const [santri, setSantri] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return santri.filter(s =>
      (s.nama_lengkap ? s.nama_lengkap.toLowerCase().includes(q) : false) ||
      ((s.nisn ?? '').toString().includes(q))
    );
  }, [santri, search]);

  if (loading) return <div>Memuat...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-indigo-100 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#e0e7ff_0%,_#eef2ff_60%,_#ffffff_100%)]" />
        <div className="relative p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Daftar Santri</h2>
            <p className="text-sm text-gray-600">Kelola santri dan catatan perilaku</p>
          </div>
          <div className="flex items-center gap-3">
            <TahunAjaranFilter />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama atau NISN..."
              className="px-4 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      <SantriGrid items={filtered} />
    </div>
  );
}


