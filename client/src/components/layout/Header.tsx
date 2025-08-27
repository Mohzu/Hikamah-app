import { Bell, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContexts'; // Import hook useAuth

export function Header() {
  // Ambil data pengguna dari AuthContext
  const { user } = useAuth();
  
  // Tentukan nama dan kelas berdasarkan data pengguna
  const studentName = user?.nama_santri || user?.nama_pengguna || user?.username || "Pengguna";
  const className = "Kelas 3 Aliyah"; // Ambil data dari database setelah login

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <UserCircle className="w-10 h-10 text-gray-500" />
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