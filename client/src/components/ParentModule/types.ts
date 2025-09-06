export type Payment = {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'Lunas' | 'Menunggu Konfirmasi' | 'Belum Lunas';
};
