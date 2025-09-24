// Import tipe 'SessionData' asli dari express-session agar kita bisa menggabungkannya
import { SessionData } from 'express-session';

interface UserSessionData {
    id_guru: any;
    jabatan: string;
    id_pengguna: number;
    username: string;
    peran: 'Admin' | 'Guru' | 'Wali Kelas' | 'Santri' | 'Wali Santri' | 'Bendahara';
    nama_pengguna?: string;
    nama_santri?: string;
    id_santri?: number;
    nama_kelas?: string | null;
    nama_jenjang?: string | null;
}

declare global {
  namespace Express {
    export interface Request {
      session: SessionData & {
        user?: UserSessionData;
      };
    }
  }
}
declare module 'express-session' {
  interface SessionData {
    user?: UserSessionData;
  }
}