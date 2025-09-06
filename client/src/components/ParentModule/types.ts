export type Payment = {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'BelumDibayar' | 'MenungguVerifikasi' | 'Diverifikasi';
};
