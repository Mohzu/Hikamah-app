import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronDown, Download } from 'lucide-react'; // Menghapus FileText

// Menambahkan interface untuk tipe data nilai
interface Grade {
    id: string; // Asumsi
    mata_pelajaran: string;
    nilai: number;
    nama_guru: string;
}

// Menambahkan interface untuk tipe data gradesData
interface GradesData {
    [semester: string]: Grade[];
}

export function GradesPage() {
    const [gradesData, setGradesData] = useState<GradesData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // PERBAIKAN: Set tipe data sebagai string atau null
    const [selectedSemester, setSelectedSemester] = useState('Ganjil');

    useEffect(() => {
        const fetchGrades = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/account/santri/my-nilai`, { withCredentials: true });
                if (response.data && response.data.success) {
                    setGradesData(response.data.data);
                } else {
                    setError('Gagal mengambil data nilai.');
                }
            } catch (err) {
                console.error("Kesalahan saat mengambil data nilai:", err);
                setError('Gagal terhubung ke server.'); // PERBAIKAN: Sekarang bisa menerima string
            } finally {
                setIsLoading(false);
            }
        };
        fetchGrades();
    }, []);

    if (isLoading) {
        return (
                <div className="p-4 text-center">Memuat data nilai...</div>
        );
    }
    
    if (error) {
        return (
                <div className="p-4 text-center text-red-500">{error}</div>
        );
    }
    
    if (!gradesData || Object.keys(gradesData).length === 0) {
        return (
                <div className="p-4 text-center text-red-500">Belum ada data nilai tersedia.</div>
        );
    }

    const semesters = Object.keys(gradesData);
    const filteredGrades = gradesData[selectedSemester] || [];

    return (
            <div className="p-4 space-y-6">
                <h1 className="text-3xl font-bold text-gray-800">Nilai Siswa</h1>
                
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                    <div className="relative">
                        <select
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                            className="block appearance-none w-full bg-white border border-gray-300 rounded-md py-2 px-4 pr-8 leading-tight focus:outline-none focus:bg-white focus:border-teal-500"
                        >
                            {semesters.map((semester) => (
                                <option key={semester} value={semester}>
                                    Semester {semester}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <ChevronDown size={16} />
                        </div>
                    </div>
                    <button
                        onClick={() => { /* Implementasi unduh rapor */ }}
                        className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                    >
                        <Download size={20} />
                        <span>Unduh Rapor</span>
                    </button>
                </div>

                <div className="bg-white shadow-lg rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Ringkasan Nilai</h2>
                    {filteredGrades.length > 0 ? (
                        filteredGrades.map((grade, index) => (
                            <div key={index} className="border-b border-gray-200 py-4 last:border-b-0">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-medium text-gray-700">{grade.mata_pelajaran}</span>
                                    <span className="text-2xl font-bold text-teal-600">{grade.nilai}</span>
                                </div>
                                <p className="text-sm text-gray-500">Guru: {grade.nama_guru}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500">Tidak ada data nilai untuk semester ini.</p>
                    )}
                </div>
            </div>
    );
}