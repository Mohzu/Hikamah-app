// client/src/components/ParentModule/pages/HafalanPage.tsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, CheckCircle, RefreshCw, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContexts';

// Fungsi helper untuk memformat tanggal
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
};

interface HafalanItem {
    tanggal: string;
    juz_surah: string;
    ayat: string;
    status: 'Lulus' | 'Ulangi' | 'Belum Sempurna';
    catatan: string | null;
    guru: string;
}

export function HafalanPage() {
    const { user } = useAuth();
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
            } catch (err: any) {
                console.error("Kesalahan saat mengambil data hafalan:", err);
                setError(err.response?.data?.error || 'Gagal terhubung ke server.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchHafalan();
    }, []);

    return (
        <div className="space-y-8">
            {/* Header Progres Hafalan */}
            <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl p-8 text-white shadow-2xl flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold mb-2">Progres Hafalan</h1>
                    <p className="text-teal-100 mb-2">
                        Pantau setoran dan evaluasi hafalan Al-Qur'an santri
                    </p>
                </div>
                <div className="bg-teal-700/40 p-6 rounded-2xl">
                    <BookOpen className="w-10 h-10" />
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <Loader2 size={48} className="animate-spin text-teal-600 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600">Memuat data hafalan...</p>
                </div>
            ) : error ? (
                <div className="p-4 text-center text-red-500">{error}</div>
            ) : !hafalanData || hafalanData.length === 0 ? (
                <div className="p-4 text-center text-gray-500">Belum ada data hafalan tersedia.</div>
            ) : (
                <div className="bg-white shadow-lg rounded-xl p-6">
                    <ul className="space-y-4">
                        {hafalanData.map((item, index) => (
                            <li key={index} className="flex items-start space-x-4 border-b border-gray-200 pb-4 last:border-b-0">
                                {item.status === 'Lulus' ? (
                                    <CheckCircle size={24} className="text-green-500 flex-shrink-0 mt-1" />
                                ) : (
                                    <RefreshCw size={24} className="text-yellow-500 flex-shrink-0 mt-1" />
                                )}
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
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${item.status === 'Lulus' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                        {item.status}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}