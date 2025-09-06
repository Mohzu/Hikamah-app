import React from 'react';
import type { Payment } from '../types';

interface PaymentHistoryTableProps {
  payments: Payment[];
}

const getStatusDisplayName = (status: string): string => {
  switch (status) {
    case 'BelumDibayar': return 'Belum Lunas';
    case 'MenungguVerifikasi': return 'Menunggu Konfirmasi';
    case 'Diverifikasi': return 'Lunas';
    default: return status;
  }
};

const statusColorMap: { [key: string]: string } = {
  'BelumDibayar': 'bg-red-100 text-red-800',
  'MenungguVerifikasi': 'bg-yellow-100 text-yellow-800',
  'Diverifikasi': 'bg-green-100 text-green-800',
};

export const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({ payments }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nama Pembayaran</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Jumlah</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{`Rp${payment.amount.toLocaleString('id-ID')}`}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[payment.status] || 'bg-gray-100 text-gray-800'}`}>
                    {getStatusDisplayName(payment.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
