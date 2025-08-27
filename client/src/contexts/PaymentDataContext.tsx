import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export interface Payment {
  id: string;
  studentName: string;
  studentId: string;
  className: string;
  nisn: string;
  parentName: string;
  parentEmail: string;
  paymentType: string;
  paymentMethod: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed';
  date: string;
  submittedAt: string;
  dueDate: string;
  notes?: string;
  validatorId?: string;
  validatedAt?: string;
}

interface PaymentDataContextType {
  payments: Payment[];
  validatePayment: (paymentId: string, status: 'confirmed' | 'rejected' | 'completed', notes?: string) => void;
  deletePayment: (paymentId: string) => void;
  loading: boolean;
  refreshPayments: () => void;
}

const PaymentDataContext = createContext<PaymentDataContextType | undefined>(undefined);

export const PaymentDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Placeholder data - akan diganti dengan API call
  const fetchPayments = async () => {
    try {
      setLoading(true);
      // Simulasi API call
      const mockPayments: Payment[] = [
        {
          id: '1',
          studentName: 'Ahmad Fadillah',
          studentId: '1234567890',
          className: 'Kelas 1A',
          nisn: '1234567890',
          parentName: 'Bapak Fadillah',
          parentEmail: 'fadillah@email.com',
          paymentType: 'SPP Bulanan',
          paymentMethod: 'Transfer Bank',
          amount: 500000,
          status: 'pending',
          date: '2024-01-15T10:30:00Z',
          submittedAt: '2024-01-15T10:30:00Z',
          dueDate: '2024-01-31T23:59:59Z',
          notes: 'Bukti transfer terlampir'
        },
        {
          id: '2',
          studentName: 'Siti Nurhaliza',
          studentId: '0987654321',
          className: 'Kelas 2B',
          nisn: '0987654321',
          parentName: 'Ibu Nurhaliza',
          parentEmail: 'nurhaliza@email.com',
          paymentType: 'Uang Makan',
          paymentMethod: 'Cash',
          amount: 300000,
          status: 'confirmed',
          date: '2024-01-14T14:20:00Z',
          submittedAt: '2024-01-14T14:20:00Z',
          dueDate: '2024-01-31T23:59:59Z',
          validatorId: 'validator123',
          validatedAt: '2024-01-15T09:00:00Z'
        },
        {
          id: '3',
          studentName: 'Muhammad Rizki',
          studentId: '1122334455',
          className: 'Kelas 3A',
          nisn: '1122334455',
          parentName: 'Bapak Rizki',
          parentEmail: 'rizki@email.com',
          paymentType: 'SPP Bulanan',
          paymentMethod: 'Transfer Bank',
          amount: 500000,
          status: 'completed',
          date: '2024-01-10T08:15:00Z',
          submittedAt: '2024-01-10T08:15:00Z',
          dueDate: '2024-01-31T23:59:59Z',
          validatorId: 'validator456',
          validatedAt: '2024-01-11T10:30:00Z'
        },
        {
          id: '4',
          studentName: 'Fatimah Azzahra',
          studentId: '5566778899',
          className: 'Kelas 1B',
          nisn: '5566778899',
          parentName: 'Ibu Fatimah',
          parentEmail: 'fatimah@email.com',
          paymentType: 'Uang Makan',
          paymentMethod: 'Cash',
          amount: 300000,
          status: 'rejected',
          date: '2024-01-12T16:45:00Z',
          submittedAt: '2024-01-12T16:45:00Z',
          dueDate: '2024-01-31T23:59:59Z',
          validatorId: 'validator789',
          validatedAt: '2024-01-13T11:20:00Z',
          notes: 'Bukti pembayaran tidak jelas'
        }
      ];

      // Simulasi delay loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPayments(mockPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Gagal mengambil data pembayaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const validatePayment = (paymentId: string, status: 'confirmed' | 'rejected' | 'completed', notes?: string) => {
    setPayments(prev => prev.map(payment => 
      payment.id === paymentId 
        ? { 
            ...payment, 
            status, 
            notes: notes || payment.notes,
            validatorId: new Date().toISOString() // Assuming validatorId is set by the user
          }
        : payment
    ));

    const statusText = status === 'confirmed' ? 'dikonfirmasi' : 'ditolak';
    toast.success(`Pembayaran berhasil ${statusText}`);
  };

  const deletePayment = (paymentId: string) => {
    setPayments(prev => prev.filter(payment => payment.id !== paymentId));
    toast.success('Pembayaran berhasil dihapus');
  };

  const refreshPayments = () => {
    fetchPayments();
  };

  return (
    <PaymentDataContext.Provider value={{ 
      payments, 
      validatePayment, 
      deletePayment, 
      loading, 
      refreshPayments 
    }}>
      {children}
    </PaymentDataContext.Provider>
  );
};

export const usePaymentData = () => {
  const context = useContext(PaymentDataContext);
  if (context === undefined) {
    throw new Error('usePaymentData must be used within a PaymentDataProvider');
  }
  return context;
};
