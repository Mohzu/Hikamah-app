export type BendaharaPage = 
  | 'dashboard' 
  | 'payment-management' 
  | 'payment-verification'
  | 'payment-reports';

export interface Pembayaran {
  id: number;
  nama_santri: string;
  jumlah_pembayaran: number;
  bukti_pembayaran: string;
  status: 'MenungguVerifikasi' | 'Diverifikasi' | 'Ditolak';
  dibuat_pada: string;
}

export interface Biaya {
  id: number;
  nama_biaya: string;
  jumlah: number;
  keterangan?: string;
  tahun_ajaran: string;
  tanggal_dibuat: string;
}

export interface RincianBank {
  id: number;
  nama_bank: string;
  nomor_rekening: string;
  atas_nama: string;
  deskripsi?: string;
}

export interface BendaharaProfile {
  id: number;
  nama_lengkap: string;
  email: string;
  peran: string;
}

export interface CreateBiayaData {
  nama_biaya: string;
  jumlah: number;
  keterangan?: string;
  tahun_ajaran: string;
}

export interface CreateTagihanData {
  id_santri: number;
  id_biaya: number;
  id_bank: number;
  jumlah: number;
  status?: 'BelumDibayar' | 'MenungguVerifikasi';
}

export interface VerifikasiPembayaranData {
  status: 'Diverifikasi' | 'Ditolak';
  alasan_penolakan?: string;
}

export interface UpdateProfileData {
  nama: string;
  email: string;
}

export interface UpdateCredentialsData {
  username?: string;
  currentPassword?: string;
  newPassword?: string;
}

