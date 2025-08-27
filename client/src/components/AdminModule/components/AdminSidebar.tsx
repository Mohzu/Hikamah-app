import {
  Users,
  GraduationCap,
  UserCheck,
  Settings,
  BookOpen,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContexts';
import { useNavigate, useLocation } from 'react-router-dom';

export type AdminPage = 'teachers' | 'students' | 'homeroom' | 'academic' | 'settings';

interface AdminSidebarProps {
  onToggle: () => void;
}

export function AdminSidebar({ onToggle }: AdminSidebarProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get current page from URL path
  const currentPage = location.pathname.split('/').pop() as AdminPage || 'dashboard';

  const menuItems = [
    { id: 'teachers' as AdminPage, label: 'Manajemen Guru', icon: Users },
    { id: 'students' as AdminPage, label: 'Manajemen Santri', icon: GraduationCap },
    { id: 'homeroom' as AdminPage, label: 'Manajemen Kelas', icon: UserCheck },
    { id: 'academic' as AdminPage, label: 'Manajemen Akademik', icon: BookOpen },
    { id: 'settings' as AdminPage, label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div className="w-full h-full bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
              <p className="text-sm text-gray-500">{user?.nama_pengguna || user?.username}</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      navigate(`/admin/${item.id}`);
                      if (window.innerWidth < 1024) {
                        onToggle();
                      }
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                      ${isActive
                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </div>
  );
}
