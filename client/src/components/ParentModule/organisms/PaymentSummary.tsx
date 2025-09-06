import React from 'react';
import { DollarSign, CheckCircle } from 'lucide-react';

interface SummaryProps {
  totalUnpaid: number;
  totalPaid: number;
}

const InfoCard: React.FC<{ icon: React.ElementType; title: string; value: string; color: string }> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-md flex items-center transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-105">
    <div className={`p-3 rounded-full mr-4 ${color}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

export const PaymentSummary: React.FC<SummaryProps> = ({ totalUnpaid = 0, totalPaid = 0 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <InfoCard 
        icon={DollarSign} 
        title="Total Tagihan Belum Dibayar" 
        value={`Rp${totalUnpaid.toLocaleString('id-ID')}`} 
        color="bg-red-500"
      />
      <InfoCard 
        icon={CheckCircle} 
        title="Total Terbayar"
        value={`Rp${totalPaid.toLocaleString('id-ID')}`} 
        color="bg-green-500"
      />
    </div>
  );
};
