import { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Trash2,
  Filter,
  Search,
  AlertCircle,
  Calendar,
  Users
} from 'lucide-react';
import { usePaymentData, type Payment } from '../../../contexts/PaymentDataContext';
import { useAuth } from '../../../contexts/AuthContexts';

export function DashboardAdminPage() {
  // Test message to verify admin dashboard is rendering
  console.log('[DashboardAdminPage] Admin dashboard is rendering!');
  
  const { payments, validatePayment, deletePayment } = usePaymentData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<Payment['status'] | 'all'>('all');
  const [selectedPaymentType, setSelectedPaymentType] = useState<Payment['paymentType'] | 'all'>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Get unique classes and payment types
  const classes = [...new Set(payments.map(p => p.className))].sort();
  const paymentTypes = [...new Set(payments.map(p => p.paymentType))].sort();

  // Filter payments based on search and filters
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch = 
        payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.nisn.includes(searchTerm) ||
        payment.parentName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesClass = selectedClass === 'all' || payment.className === selectedClass;
      const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
      const matchesType = selectedPaymentType === 'all' || payment.paymentType === selectedPaymentType;
      
      return matchesSearch && matchesClass && matchesStatus && matchesType;
    });
  }, [payments, searchTerm, selectedClass, selectedStatus, selectedPaymentType]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPayments = payments.length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const confirmedPayments = payments.filter(p => p.status === 'confirmed').length;
    const totalAmount = payments
      .filter(p => p.status === 'confirmed' || p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    
    return {
      totalPayments,
      pendingPayments,
      confirmedPayments,
      totalAmount
    };
  }, [payments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-yellow-600" />;
      case 'confirmed': return <CheckCircle size={16} className="text-green-600" />;
      case 'rejected': return <XCircle size={16} className="text-red-600" />;
      case 'completed': return <CheckCircle size={16} className="text-blue-600" />;
      default: return <AlertCircle size={16} className="text-gray-600" />;
    }
  };

  const handleValidatePayment = (paymentId: string, status: 'confirmed' | 'rejected' | 'completed', notes?: string) => {
    validatePayment(paymentId, status, notes);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-4">
              <Calendar size={20} className="mr-2 text-emerald-200" />
              <span className="text-emerald-200 font-medium text-sm">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-bold mb-3">Dashboard Admin</h1>
            <p className="text-emerald-100 text-base xl:text-lg font-medium mb-6">Kelola dan validasi pembayaran siswa</p>
            <div className="flex items-center text-emerald-200">
              <DollarSign size={18} className="mr-2" />
              <span className="text-sm font-medium">Departemen: {user?.peran}</span>
            </div>
          </div>
          <div className="hidden lg:block ml-6">
            <div className="w-24 h-24 xl:w-32 xl:h-32 bg-white bg-opacity-15 rounded-3xl flex items-center justify-center backdrop-blur-sm">
              <DollarSign size={40} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-blue-100 hover:shadow-2xl transition-all duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Total Pembayaran</h3>
            <p className="text-3xl font-bold text-blue-600 mb-4">{stats.totalPayments}</p>
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg py-2 px-3">
              Semua Transaksi
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-yellow-100 hover:shadow-2xl transition-all duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Menunggu Validasi</h3>
            <p className="text-3xl font-bold text-yellow-600 mb-4">{stats.pendingPayments}</p>
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg py-2 px-3">
              Perlu Ditinjau
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-green-100 hover:shadow-2xl transition-all duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Tervalidasi</h3>
            <p className="text-3xl font-bold text-green-600 mb-4">{stats.confirmedPayments}</p>
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg py-2 px-3">
              Sudah Dikonfirmasi
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-emerald-100 hover:shadow-2xl transition-all duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Total Diterima</h3>
            <p className="text-2xl font-bold text-emerald-600 mb-4">{formatCurrency(stats.totalAmount)}</p>
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg py-2 px-3">
              Dana Terkonfirmasi
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {/* Live Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari siswa, kelas, NISN, atau wali..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Class Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
              aria-label="Filter berdasarkan kelas"
            >
              <option value="all">Semua Kelas</option>
              {classes.map(className => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as Payment['status'] | 'all')}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
              aria-label="Filter berdasarkan status"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Validasi</option>
              <option value="confirmed">Dikonfirmasi</option>
              <option value="rejected">Ditolak</option>
              <option value="completed">Selesai</option>
            </select>
          </div>

          {/* Payment Type Filter */}
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedPaymentType}
              onChange={(e) => setSelectedPaymentType(e.target.value as Payment['paymentType'] | 'all')}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
              aria-label="Filter berdasarkan jenis pembayaran"
            >
              <option value="all">Semua Jenis</option>
              {paymentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || selectedClass !== 'all' || selectedStatus !== 'all' || selectedPaymentType !== 'all') && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedClass('all');
                setSelectedStatus('all');
                setSelectedPaymentType('all');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Reset Semua Filter
            </button>
          </div>
        )}

        {/* Active Filters Info */}
        {(searchTerm || selectedClass !== 'all' || selectedStatus !== 'all' || selectedPaymentType !== 'all') && (
          <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Filter className="w-5 h-5 text-emerald-600 mr-2" />
                <span className="text-emerald-800 font-medium">
                  Filter aktif: {filteredPayments.length} pembayaran ditemukan
                </span>
              </div>
              <div className="text-sm text-emerald-600">
                {searchTerm && `"${searchTerm}"`}
                {selectedClass !== 'all' && ` • ${selectedClass}`}
                {selectedStatus !== 'all' && ` • ${selectedStatus}`}
                {selectedPaymentType !== 'all' && ` • ${selectedPaymentType}`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Siswa</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Pembayaran</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900">Jumlah</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Tanggal</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment, index) => (
                <tr key={payment.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center mr-3">
                        <span className="text-emerald-600 font-bold text-sm">
                          {payment.studentName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{payment.studentName}</p>
                        <p className="text-sm text-gray-600">{payment.className}</p>
                        <p className="text-xs text-gray-500">NISN: {payment.nisn}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-semibold text-gray-900">{payment.paymentType}</p>
                      <p className="text-sm text-gray-600">{payment.paymentMethod}</p>
                      <p className="text-xs text-gray-500">Wali: {payment.parentName}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="font-bold text-lg text-emerald-600">
                      {formatCurrency(payment.amount)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        <span className="ml-1">
                          {payment.status === 'pending' ? 'Menunggu' :
                           payment.status === 'confirmed' ? 'Dikonfirmasi' :
                           payment.status === 'rejected' ? 'Ditolak' : 'Selesai'}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-sm text-gray-900">
                        {new Date(payment.submittedAt).toLocaleDateString('id-ID')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Jatuh tempo: {new Date(payment.dueDate).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye size={16} />
                      </button>
                      {payment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleValidatePayment(payment.id, 'confirmed')}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                            title="Konfirmasi"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleValidatePayment(payment.id, 'rejected', 'Bukti pembayaran tidak valid')}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Tolak"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Hapus pembayaran ${payment.paymentType} dari ${payment.studentName}?`)) {
                            deletePayment(payment.id);
                          }
                        }}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm || selectedClass !== 'all' || selectedStatus !== 'all' || selectedPaymentType !== 'all'
                  ? 'Tidak ada pembayaran yang sesuai dengan filter'
                  : 'Belum ada data pembayaran'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mr-4">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Detail Pembayaran</h2>
                  <p className="text-gray-600">{selectedPayment.paymentType} - {selectedPayment.studentName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Siswa</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Nama Siswa</p>
                      <p className="font-semibold text-gray-900">{selectedPayment.studentName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Kelas</p>
                      <p className="font-semibold text-gray-900">{selectedPayment.className}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">NISN</p>
                      <p className="font-semibold text-gray-900">{selectedPayment.nisn}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Wali</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Nama Wali</p>
                      <p className="font-semibold text-gray-900">{selectedPayment.parentName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">{selectedPayment.parentEmail}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Pembayaran</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Jenis Pembayaran</p>
                      <p className="font-semibold text-gray-900">{selectedPayment.paymentType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Metode Pembayaran</p>
                      <p className="font-semibold text-gray-900">{selectedPayment.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Jumlah</p>
                      <p className="font-semibold text-emerald-600 text-xl">{formatCurrency(selectedPayment.amount)}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(selectedPayment.status)}`}>
                        {selectedPayment.status === 'pending' ? 'Menunggu Validasi' :
                         selectedPayment.status === 'confirmed' ? 'Dikonfirmasi' :
                         selectedPayment.status === 'rejected' ? 'Ditolak' : 'Selesai'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tanggal Submit</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedPayment.submittedAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Jatuh Tempo</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedPayment.dueDate).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedPayment.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Catatan</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{selectedPayment.notes}</p>
                </div>
              )}

              {/* Validation Info */}
              {selectedPayment.validatedAt && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Validasi</h3>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600">Divalidasi pada:</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedPayment.validatedAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedPayment.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      handleValidatePayment(selectedPayment.id, 'confirmed');
                      setSelectedPayment(null);
                    }}
                    className="flex-1 bg-green-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-green-700 flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Konfirmasi Pembayaran
                  </button>
                  <button
                    onClick={() => {
                      handleValidatePayment(selectedPayment.id, 'rejected', 'Bukti pembayaran tidak valid');
                      setSelectedPayment(null);
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-700 flex items-center justify-center"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Tolak Pembayaran
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
