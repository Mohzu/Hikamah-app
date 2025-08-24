import React from 'react';
import { Clock, CheckCircle, Award, BookOpen, ArrowRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate untuk navigasi

interface DashboardSummaryProps {
  sisaTagihan: number;
  totalTerbayar: number;
  rataRataNilai: number;
  progressHafalan: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Helper function untuk menentukan grade berdasarkan nilai
const getGrade = (nilai: number): string => {
  if (nilai >= 90) return "A+ (Sangat Baik)";
  if (nilai >= 80) return "B+ (Baik)";
  if (nilai >= 70) return "C+ (Cukup)";
  return "D (Kurang)";
};

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  sisaTagihan,
  totalTerbayar,
  rataRataNilai,
  progressHafalan,
}) => {
  const navigate = useNavigate(); // Inisialisasi hook useNavigate

  const onNavigateToPayment = () => {
    navigate('/parent/payment'); // Arahkan ke halaman pembayaran
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {/* Sisa Tagihan Card */}
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-orange-100 hover:shadow-2xl transition-all duration-300">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <Clock className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Sisa Tagihan</h3>
            <p className="text-3xl font-bold text-orange-600 mb-4">
              {formatCurrency(sisaTagihan)}
            </p>
            <button
              onClick={onNavigateToPayment}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
            >
              Bayar Sekarang
              <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </div>

        {/* Total Terbayar Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-teal-100 hover:shadow-2xl transition-all duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Terbayar</h3>
            <p className="text-3xl font-bold text-teal-600 mb-4">
              {formatCurrency(totalTerbayar)}
            </p>
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg py-2 px-3">
              Status: Cicilan Berlangsung
            </div>
          </div>
        </div>

        {/* Rata-rata Nilai Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-blue-100 hover:shadow-2xl transition-all duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Rata-rata Nilai</h3>
            <p className="text-3xl font-bold text-blue-600 mb-4">{rataRataNilai.toFixed(1)}</p>
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg py-2 px-3">
              Grade: {getGrade(rataRataNilai)}
            </div>
          </div>
        </div>

        {/* Hafalan Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-green-100 hover:shadow-2xl transition-all duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hafalan</h3>
            <p className="text-3xl font-bold text-green-600 mb-4">{progressHafalan} Juz</p>
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg py-2 px-3">
              Progress: {Math.round((progressHafalan / 30) * 100)}% dari 30 Juz
            </div>
          </div>
        </div>
      </div>
  );
};
