import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronDown, Download, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

// --- Interface yang disesuaikan dengan struktur data rapor ---
interface SubjectGrade {
    mata_pelajaran: string;
    nilai_akhir: string;
    predikat: string;
    deskripsi: string;
}

interface Rekapitulasi {
    jumlah_nilai: number;
    rata_rata: number;
    predikat: string;
    status_kenaikan: string;
}

interface Absensi {
    Hadir?: number;
    Sakit?: number;
    Izin?: number;
    Alfa?: number;
}

interface DetailNilai {
    [kategori: string]: SubjectGrade[];
}

interface CatatanPerilaku {
    kategori: string;
    deskripsi: string;
    tanggal_catatan: string;
}

interface RaporData {
    rekapitulasi: Rekapitulasi;
    detail_nilai: DetailNilai;
    rekap_non_akademik: {
        absensi: Absensi;
        catatan_perilaku: CatatanPerilaku[];
    };
}

// Interface baru untuk daftar periode yang tersedia
interface AvailablePeriod {
    tahun_ajaran: string;
    semester: 'Ganjil' | 'Genap';
}

export function GradesPage() {
    const [raporData, setRaporData] = useState<RaporData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [availablePeriods, setAvailablePeriods] = useState<AvailablePeriod[]>([]);
    const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<string>('');

    // --- Efek untuk mengambil daftar periode yang tersedia dan data rapor awal ---
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Perbaikan: Panggilan API baru untuk mendapatkan daftar periode yang tersedia
                const periodsResponse = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/account/santri/available-rapor-periods`, // Endpoint baru
                    { withCredentials: true }
                );

                if (periodsResponse.data.success && periodsResponse.data.data.length > 0) {
                    const periods = periodsResponse.data.data;
                    setAvailablePeriods(periods);
                    
                    // Atur periode default ke yang paling baru
                    const latestPeriod = periods[0];
                    setSelectedTahunAjaran(latestPeriod.tahun_ajaran);
                    setSelectedSemester(latestPeriod.semester);

                    // Panggil API rapor dengan periode yang baru saja diatur
                    const raporResponse = await axios.get(
                        `${import.meta.env.VITE_API_URL}/api/account/santri/rapor?tahun_ajaran=${latestPeriod.tahun_ajaran}&semester=${latestPeriod.semester}`,
                        { withCredentials: true }
                    );

                    if (raporResponse.data.success && raporResponse.data.data) {
                        setRaporData(raporResponse.data.data);
                    } else {
                        setError('Data rapor untuk periode ini tidak tersedia.');
                        toast.error('Data rapor untuk periode ini tidak tersedia.');
                    }
                } else {
                    setError('Tidak ada data periode rapor yang tersedia.');
                    toast.error('Tidak ada data periode rapor yang tersedia.');
                }
            } catch (err: any) {
                console.error("Kesalahan saat mengambil data:", err);
                setError(err.response?.data?.error || 'Gagal terhubung ke server atau terjadi kesalahan.');
                toast.error(err.response?.data?.error || 'Gagal memuat data.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // --- Efek terpisah untuk memuat rapor saat periode berubah ---
    useEffect(() => {
        if (selectedTahunAjaran && selectedSemester) {
            const fetchRapor = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const response = await axios.get(
                        `${import.meta.env.VITE_API_URL}/api/account/santri/rapor?tahun_ajaran=${selectedTahunAjaran}&semester=${selectedSemester}`,
                        { withCredentials: true }
                    );
                    if (response.data.success && response.data.data) {
                        setRaporData(response.data.data);
                    } else {
                        setRaporData(null);
                        setError('Data rapor untuk periode ini tidak tersedia.');
                    }
                } catch (err: any) {
                    console.error("Kesalahan saat mengambil data rapor:", err);
                    setRaporData(null);
                    setError(err.response?.data?.error || 'Gagal terhubung ke server.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchRapor();
        }
    }, [selectedTahunAjaran, selectedSemester]);

    const availableTahunAjaran = Array.from(new Set(availablePeriods.map(p => p.tahun_ajaran)));
    const availableSemesters = Array.from(new Set(availablePeriods.filter(p => p.tahun_ajaran === selectedTahunAjaran).map(p => p.semester)));

    if (isLoading) {
        return <div className="p-4 text-center">Memuat data rapor...</div>;
    }
    if (error) {
        return <div className="p-4 text-center text-red-500">{error}</div>;
    }
    if (!raporData) {
        return <div className="p-4 text-center text-gray-500">Data rapor belum tersedia.</div>;
    }

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Rapor Santri</h1>
            
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <div className="flex space-x-4">
                    <div className="relative">
                        <select value={selectedTahunAjaran} onChange={(e) => setSelectedTahunAjaran(e.target.value)} className="block appearance-none w-full bg-white border border-gray-300 rounded-md py-2 px-4 pr-8 leading-tight focus:outline-none focus:bg-white focus:border-teal-500">
                            {availableTahunAjaran.map((ta) => <option key={ta} value={ta}>{ta}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"><ChevronDown size={16} /></div>
                    </div>
                    <div className="relative">
                        <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className="block appearance-none w-full bg-white border border-gray-300 rounded-md py-2 px-4 pr-8 leading-tight focus:outline-none focus:bg-white focus:border-teal-500">
                            {availableSemesters.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"><ChevronDown size={16} /></div>
                    </div>
                </div>
                <button onClick={() => { /* Unduh Rapor */ }} className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">
                    <Download size={20} />
                    <span>Unduh Rapor</span>
                </button>
            </div>

            {/* Rekapitulasi Umum */}
            <div className="bg-white shadow-lg rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Ringkasan Nilai</h2>
                <div className="grid grid-cols-2 gap-4">
                    <p><strong>Rata-rata Nilai:</strong> {raporData.rekapitulasi.rata_rata}</p>
                    <p><strong>Predikat:</strong> {raporData.rekapitulasi.predikat}</p>
                    <p className="col-span-2"><strong>Status Kenaikan:</strong> {raporData.rekapitulasi.status_kenaikan}</p>
                </div>
            </div>

            {/* Detail Nilai per Kategori */}
            {Object.keys(raporData.detail_nilai).map((kategori: string) => (
                <div key={kategori} className="bg-white shadow-lg rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4 border-b pb-2">{kategori}</h2>
                    {raporData.detail_nilai[kategori].map((grade: SubjectGrade, index: number) => (
                        <div key={index} className="border-b border-gray-200 py-4 last:border-b-0">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-lg font-medium text-gray-700">{grade.mata_pelajaran}</span>
                                <div className="flex space-x-2 items-center">
                                    <span className="text-2xl font-bold text-teal-600">{grade.nilai_akhir}</span>
                                    <span className="text-sm font-semibold text-gray-500">({grade.predikat})</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">{grade.deskripsi}</p>
                        </div>
                    ))}
                </div>
            ))}
            
            {/* Rekapitulasi Non-Akademik */}
            <div className="bg-white shadow-lg rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Rekapitulasi Non-Akademik</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Hadir</p>
                        <p className="text-2xl font-bold text-teal-600">{raporData.rekap_non_akademik.absensi.Hadir || 0}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Sakit</p>
                        <p className="text-2xl font-bold text-yellow-500">{raporData.rekap_non_akademik.absensi.Sakit || 0}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Izin</p>
                        <p className="text-2xl font-bold text-blue-500">{raporData.rekap_non_akademik.absensi.Izin || 0}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Alfa</p>
                        <p className="text-2xl font-bold text-red-500">{raporData.rekap_non_akademik.absensi.Alfa || 0}</p>
                    </div>
                </div>

                <h3 className="text-lg font-bold mt-6 mb-2">Catatan Perilaku</h3>
                {raporData.rekap_non_akademik.catatan_perilaku.length > 0 ? (
                    raporData.rekap_non_akademik.catatan_perilaku.map((catatan, index) => (
                        <div key={index} className="flex items-start space-x-2 py-2 border-b border-gray-200 last:border-b-0">
                            {catatan.kategori === 'Positif' ? (
                                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-700">{catatan.deskripsi}</p>
                                <p className="text-xs text-gray-500 italic">({new Date(catatan.tanggal_catatan).toLocaleDateString('id-ID')})</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500">Tidak ada catatan perilaku.</p>
                )}
            </div>
        </div>
    );
}