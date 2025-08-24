import { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, CheckCircle } from 'lucide-react';

// Tambahkan interface untuk tipe data hafalan
interface HafalanItem {
  id: string; // Asumsi
  surat: string;
  ayat_awal: number;
  ayat_akhir: number;
  status: string; // Misal: "Lulus", "Belum Lulus"
}

export function HafalanPage() {
  // PERBAIKAN: Tentukan tipe data untuk state hafalanData
  const [hafalanData, setHafalanData] = useState<HafalanItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // PERBAIKAN: Tentukan tipe data untuk state error
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHafalan = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/account/santri/my-hafalan`, { withCredentials: true });
        if (response.data && response.data.success) {
          setHafalanData(response.data.data);
        } else {
          setError('Gagal mengambil data hafalan.');
        }
      } catch (err) {
        console.error("Kesalahan saat mengambil data hafalan:", err);
        setError('Gagal terhubung ke server.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHafalan();
  }, []);

  if (isLoading) {
    return (
        <div className="p-4 text-center">Memuat data hafalan...</div>
    );
  }

  if (error) {
    return (
        <div className="p-4 text-center text-red-500">{error}</div>
    );
  }

  // PERBAIKAN: Pengecekan data yang lebih aman
  if (!hafalanData || hafalanData.length === 0) {
    return (
        <div className="p-4 text-center text-red-500">Belum ada data hafalan tersedia.</div>
    );
  }

  return (
      <div className="p-4 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Progres Hafalan</h1>
        <div className="bg-white shadow-lg rounded-xl p-6">
          <ul className="space-y-4">
            {hafalanData.map(item => (
              <li key={item.id} className="flex items-center space-x-4 border-b border-gray-200 pb-4 last:border-b-0">
                <BookOpen size={24} className="text-teal-600" />
                <div className="flex-1">
                  <p className="font-semibold text-lg text-gray-700">{item.surat}</p>
                  <p className="text-sm text-gray-500">Ayat: {item.ayat_awal} - {item.ayat_akhir}</p>
                </div>
                {item.status === 'Lulus' && (
                  <CheckCircle size={24} className="text-green-500" />
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
  );
}