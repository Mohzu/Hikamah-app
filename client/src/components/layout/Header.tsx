// client/src/components/layout/Header.tsx
import { Bell, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContexts';
import { useStudentData } from '../../contexts/StudentDataContext';

export function Header() {
  const { user } = useAuth();
  const { student, isLoading } = useStudentData();

  let studentName = user?.nama_pengguna || user?.username || "Pengguna";
  let className = "Data Tidak Tersedia";
  let photoUrl = null;

  if (!isLoading && student) {
    studentName = student.nama_lengkap;
    className = student.nama_kelas || "Tanpa Kelas";
    photoUrl = student.foto_profil;
  }

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center space-x-4">
        {photoUrl ? (
          <img
            src={`${import.meta.env.VITE_API_URL}${photoUrl}`}
            alt="Foto Profil Santri"
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <UserCircle className="w-10 h-10 text-gray-500" />
        )}
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{studentName}</h2>
          <p className="text-sm text-gray-500">{className}</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Bell className="text-gray-500 hover:text-gray-700 cursor-pointer" />
      </div>
    </header>
  );
}