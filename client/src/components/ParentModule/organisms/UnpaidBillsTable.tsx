import React, { useState } from 'react';

interface UnpaidBill {
  id: number;
  nama_biaya: string;
  jumlah_tagihan: string;
}

interface UnpaidBillsTableProps {
  bills: UnpaidBill[];
  onSelectionChange: (selectedIds: number[]) => void;
}

export const UnpaidBillsTable: React.FC<UnpaidBillsTableProps> = ({ bills, onSelectionChange }) => {
  const [selectedBills, setSelectedBills] = useState<number[]>([]);

  const handleCheckboxChange = (billId: number) => {
    setSelectedBills(prevSelected => {
      const newSelected = prevSelected.includes(billId)
        ? prevSelected.filter(id => id !== billId)
        : [...prevSelected, billId];
      onSelectionChange(newSelected);
      return newSelected;
    });
  };

  if (bills.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md text-center text-gray-500">
        <p>Tidak ada tagihan yang perlu dibayar saat ini.</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"></th> {/* Checkbox column */}
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nama Pembayaran</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Jumlah Tagihan</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bills.map((bill) => (
              <tr key={bill.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-4 w-4 text-teal-600 transition duration-150 ease-in-out" 
                    checked={selectedBills.includes(bill.id)}
                    onChange={() => handleCheckboxChange(bill.id)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bill.nama_biaya}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{`Rp${parseFloat(bill.jumlah_tagihan).toLocaleString('id-ID')}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
