import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { PaymentSummary } from '../organisms/PaymentSummary';
import { PaymentHistoryTable } from '../organisms/PaymentHistoryTable';
import { UnpaidBillsTable } from '../organisms/UnpaidBillsTable';
import { NewPaymentModal } from '../organisms/NewPaymentModal';
import type { Payment } from '../types';
import { PlusCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContexts';

const PaymentPage: React.FC = () => {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState({ totalUnpaid: 0, totalPaid: 0 });
  const [unpaidBills, setUnpaidBills] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBillIds, setSelectedBillIds] = useState<number[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setError(null);

    try {
      const [tagihanRes, historyRes] = await axios.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/account/santri/pembayaran/tagihan`, { withCredentials: true }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/account/santri/pembayaran`, { withCredentials: true })
      ]);

      let totalUnpaid = 0;
      if (tagihanRes.data.success) {
        setUnpaidBills(tagihanRes.data.data);
        totalUnpaid = tagihanRes.data.data.reduce((acc: number, item: any) => acc + parseFloat(item.jumlah_tagihan), 0);
      }

      let totalPaid = 0;
      if (historyRes.data.success) {
        const allPayments = historyRes.data.data.map((item: any) => ({
          id: item.id,
          description: item.nama_biaya || item.keterangan || 'Pembayaran', 
          amount: parseFloat(item.jumlah_pembayaran || item.jumlah_tagihan || 0),
          status: item.status,
        }));

        const history = allPayments.filter((p: Payment) => p.status !== 'BelumDibayar');
        setPaymentHistory(history);

        const validatedPayments = history.filter((item: any) => item.status === 'Diverifikasi');
        if (validatedPayments.length > 0) {
          totalPaid = validatedPayments.reduce((acc: number, item: any) => acc + item.amount, 0);
        }
      }

      setSummaryData({ totalUnpaid, totalPaid });

    } catch (err: any) {
      console.error("[PaymentPage] Gagal mengambil data pembayaran:", err);
      setError(err.response?.data?.error || 'Gagal terhubung ke server. Silakan coba lagi nanti.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePaymentSuccess = () => {
    setIsModalOpen(false);
    setSelectedBillIds([]); // Clear selection after successful payment
    fetchData();
  };

  const handleUnpaidSelectionChange = (ids: number[]) => {
    setSelectedBillIds(ids);
  };

  const totalSelectedAmount = selectedBillIds.reduce((total, id) => {
    const bill = unpaidBills.find(b => b.id === id);
    return total + (bill ? parseFloat(bill.jumlah_tagihan) : 0);
  }, 0);

  const handleOpenModal = () => {
    if (selectedBillIds.length === 0) {
      setError('Pilih setidaknya satu tagihan untuk dibayar.');
      return;
    }
    setError(null);
    setIsModalOpen(true);
  };

  if (isLoading && paymentHistory.length === 0 && unpaidBills.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={48} className="animate-spin text-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center">
        <AlertTriangle size={24} className="mr-3" />
        <div>
          <p className="font-bold">Terjadi Kesalahan</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 p-6 bg-white rounded-xl shadow-lg">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2">Manajemen Pembayaran</h1>
          <p className="text-md md:text-lg text-gray-600">Kelola tagihan dan riwayat pembayaran Anda dengan mudah.</p>
        </div>
        <button 
          onClick={handleOpenModal} 
          className="mt-4 md:mt-0 flex items-center px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-lg shadow-md hover:from-teal-600 hover:to-teal-700 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          disabled={selectedBillIds.length === 0}
        >
          <PlusCircle size={20} className="mr-3" />
          {totalSelectedAmount > 0 ? `Bayar Rp${totalSelectedAmount.toLocaleString('id-ID')}` : 'Lakukan Pembayaran Baru'}
        </button>
      </div>
      
      <PaymentSummary totalUnpaid={summaryData.totalUnpaid} totalPaid={summaryData.totalPaid} />
      
      <div className="space-y-8 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Daftar Tagihan</h2>
          <UnpaidBillsTable bills={unpaidBills} onSelectionChange={handleUnpaidSelectionChange} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Riwayat Pembayaran</h2>
          <PaymentHistoryTable payments={paymentHistory} />
        </div>
      </div>

      <NewPaymentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handlePaymentSuccess}
        selectedBillIds={selectedBillIds}
        unpaidBills={unpaidBills}
      />
    </div>
  );
};

export default PaymentPage;
