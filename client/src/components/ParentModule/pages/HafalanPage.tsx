import { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, CheckCircle, RefreshCw } from 'lucide-react';

// Fungsi helper untuk memformat tanggal
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Membuat objek Date dari string ISO 8601
    const date = new Date(dateString);
    // Menggunakan Intl.DateTimeFormat untuk format yang lebih baik
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
};

// --- Perbaikan: Interface untuk tipe data yang sesuai dengan API Backend ---
interface HafalanItem {
  tanggal: string;
  juz_surah: string;
  ayat: string;
  status: 'Lulus' | 'Ulangi' | 'Belum Sempurna';
  catatan: string | null;
  guru: string;
}

export function HafalanPage() {
  const [hafalanData, setHafalanData] = useState<HafalanItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHafalan = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/account/santri/hafalan`, { withCredentials: true });
        if (response.data && response.data.success) {
          setHafalanData(response.data.data);
        } else {
          setError(response.data.error || 'Gagal mengambil data hafalan.');
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
      <div className="flex items-center justify-center h-40">
        <span className="animate-spin h-8 w-8 border-4 border-teal-500 rounded-full border-t-transparent"></span>
        <span className="ml-4 text-gray-700">Memuat data hafalan...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">{error}</div>
    );
  }
  
  if (!hafalanData || hafalanData.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">Belum ada data hafalan tersedia.</div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Progres Hafalan</h1>
      <div className="bg-white shadow-lg rounded-xl p-6">
        <ul className="space-y-4">
          {hafalanData.map((item, index) => (
            <li key={index} className="flex items-start space-x-4 border-b border-gray-200 pb-4 last:border-b-0">
              <BookOpen size={24} className="text-teal-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="font-semibold text-lg text-gray-700">{item.juz_surah}</p>
                <p className="text-sm text-gray-500">
                  Ayat: {item.ayat} | Tanggal: {formatDate(item.tanggal)}
                </p>
                {item.catatan && (
                  <p className="text-sm text-gray-600 mt-1 italic">Catatan Guru: "{item.catatan}"</p>
                )}
                <p className="text-sm text-gray-500 mt-1">Pembimbing: {item.guru}</p>
              </div>
              <div className="flex-shrink-0">
                {item.status === 'Lulus' ? (
                  <CheckCircle size={24} className="text-green-500" />
                ) : item.status === 'Ulangi' ? (
                  <RefreshCw size={24} className="text-yellow-500" />
                ) : (
                  <span className="text-gray-400 text-xs font-medium">Menunggu</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}