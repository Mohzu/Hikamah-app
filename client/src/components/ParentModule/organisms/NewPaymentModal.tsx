import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { X, Loader2, Banknote, Upload, Send } from 'lucide-react';

interface NewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedBillIds: number[];
  unpaidBills: any[]; // Assuming this has id, nama_biaya, jumlah_tagihan
}

interface Tagihan {
  id: number;
  nama_biaya: string;
  jumlah_tagihan: string;
}

interface BankInfo {
  nama_bank: string;
  nomor_rekening: string;
  atas_nama: string;
}

export const NewPaymentModal: React.FC<NewPaymentModalProps> = ({ isOpen, onClose, onSuccess, selectedBillIds, unpaidBills }) => {
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBillsDetails = unpaidBills.filter(bill => selectedBillIds.includes(bill.id));
  const totalAmountToPay = selectedBillsDetails.reduce((total, bill) => total + parseFloat(bill.jumlah_tagihan), 0);

  const fetchBankInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const bankRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/account/santri/pembayaran/rincian-bank`, { withCredentials: true });
      if (bankRes.data.success) setBankInfo(bankRes.data.data);
    } catch (err) {
      setError('Gagal memuat informasi rekening bank.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchBankInfo();
      setError(null); // Clear previous errors
      setFile(null); // Clear previous file selection
    }
  }, [isOpen, fetchBankInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || selectedBillIds.length === 0) {
      setError('Harap unggah bukti transfer dan pastikan ada tagihan yang dipilih.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    // Send array of IDs
    selectedBillIds.forEach(id => formData.append('id_pembayaran[]', id.toString())); 
    formData.append('jumlah', totalAmountToPay.toString()); // Send total amount
    formData.append('bukti_transfer', file);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/account/santri/pembayaran/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });
      onSuccess(); // Refresh data on parent page and close modal
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal mengirim pembayaran.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg transform transition-all">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Formulir Pembayaran Massal</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={20} /></button>
        </div>

        {isLoading && !bankInfo ? (
          <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              {bankInfo && (
                <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg">
                  <h3 className="font-bold text-teal-800 flex items-center"><Banknote size={18} className="mr-2"/>Info Rekening Tujuan</h3>
                  <p className="text-sm text-gray-700 mt-1">Bank: <span className="font-semibold">{bankInfo.nama_bank}</span></p>
                  <p className="text-sm text-gray-700">No. Rekening: <span className="font-semibold">{bankInfo.nomor_rekening}</span></p>
                  <p className="text-sm text-gray-700">Atas Nama: <span className="font-semibold">{bankInfo.atas_nama}</span></p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tagihan yang Dipilih</label>
                <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto bg-gray-50">
                  {selectedBillsDetails.length > 0 ? (
                    selectedBillsDetails.map(bill => (
                      <p key={bill.id} className="text-sm text-gray-800">{bill.nama_biaya} - Rp{parseFloat(bill.jumlah_tagihan).toLocaleString('id-ID')}</p>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Tidak ada tagihan yang dipilih.</p>
                  )}
                </div>
                <p className="text-md font-semibold text-gray-800 mt-2">Total Pembayaran: Rp{totalAmountToPay.toLocaleString('id-ID')}</p>
              </div>

              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700">Bukti Transfer</label>
                <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500">
                        <span>Unggah file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} accept="image/*" />
                      </label>
                      <p className="pl-1">atau tarik dan lepas</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF hingga 2MB</p>
                    {file && <p className="text-sm text-green-600 mt-2">File dipilih: {file.name}</p>}
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
              <button type="submit" disabled={isLoading} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400">
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />} Kirim Pembayaran
              </button>
              <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
