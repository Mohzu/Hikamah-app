import { useNavigate } from 'react-router-dom';
import { WKButton } from '../../WaliKelasModule/atoms/Button';
import { useAuth } from '../../../contexts/AuthContexts';
import { GraduationCap, BookOpen } from 'lucide-react';

export function RoleChooserPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-teal-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Banner */}
        <div className="rounded-2xl overflow-hidden shadow-sm border border-indigo-100 mb-6">
          <div className="bg-[radial-gradient(circle_at_top_left,_#1e3a8a_0%,_#1e40af_60%,_#1e3a8a_100%)] text-white px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/90 flex items-center justify-center shadow">
                <GraduationCap className="w-8 h-8 text-indigo-700" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide opacity-90">Portal Hikamah</p>
                <h2 className="text-xl font-extrabold">Pilih Modul Akses</h2>
              </div>
            </div>
            <WKButton variant="secondary" onClick={logout}>Keluar</WKButton>
          </div>
          <div className="bg-white px-6 py-6">
            <h3 className="text-lg font-bold text-gray-800">Daftar Modul</h3>
            <p className="text-sm text-gray-500">Silakan pilih modul yang ingin Anda buka</p>
          </div>
        </div>

        {/* Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 place-items-center">
          <button onClick={() => navigate('/guru/dashboard')} className="w-full sm:w-80 group rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-center hover:shadow-md transition">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 transition flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-indigo-700" />
            </div>
            <p className="mt-4 font-semibold text-gray-900">Modul Wali Kelas</p>
            <p className="text-sm text-gray-500 mt-1">Kelola santri, perilaku, kenaikan, dan nilai</p>
          </button>

          <button onClick={() => navigate('/guru/dashboard')} className="w-full sm:w-80 group rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-center hover:shadow-md transition">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-50 group-hover:bg-teal-100 transition flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-teal-700" />
            </div>
            <p className="mt-4 font-semibold text-gray-900">Modul Guru</p>
            <p className="text-sm text-gray-500 mt-1">Input nilai, hafalan, dan materi</p>
          </button>
        </div>
      </div>
    </div>
  );
}


