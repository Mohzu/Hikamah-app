export interface UserProfile {
  id_pengguna: number;
  nama_lengkap: string;
  username: string;
  email: string;
  jabatan?: string; // Opsional
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}