import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CreditCard, BookOpen, GraduationCap, User, LogOut, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContexts';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  userRole?: string;
}
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/parent/dashboard' },
  { id: 'payment', label: 'Pembayaran', icon: CreditCard, path: '/parent/payment' },
  { id: 'hafalan', label: 'Hafalan', icon: BookOpen, path: '/parent/hafalan' },
  { id: 'grades', label: 'Nilai', icon: GraduationCap, path: '/parent/grades' },
  { id: 'profile', label: 'Profil', icon: User, path: '/parent/profile' },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { logout, user } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && !isOpen) onToggle();
      if (window.innerWidth < 1024 && isOpen) onToggle();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onToggle]);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-30 lg:hidden" onClick={onToggle} />}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-2xl border-r border-gray-100 transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* HEADER */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100 bg-gradient-to-r from-teal-600 to-teal-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <BookOpen className="w-7 h-7 text-teal-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Wali Santri</h1>
                <p className="text-xs text-teal-100 font-medium">Portal Monitoring</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg text-white hover:bg-teal-800 transition-colors lg:hidden"
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* NAVIGATION */}
          <nav className="mt-8 px-4">
            <ul className="space-y-3">
              {menuItems.map((item) => {
                const IconComponent = item.icon;

                return (
                  <li key={item.id}>
                    <NavLink
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) onToggle();
                      }}
                      className={({ isActive }) =>
                        `group w-full flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-teal-50 to-teal-50 text-teal-700 border-r-4 border-teal-600 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 hover:shadow-sm'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <IconComponent
                            size={20}
                            className={`mr-4 flex-shrink-0 transition-colors ${
                              isActive ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'
                            }`}
                          />
                          <span className="font-medium">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* USER & LOGOUT */}
          <div className="border-t border-gray-100 p-4 mt-auto">
            {user && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                    <User size={18} className="text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.nama_pengguna || user.username}</p>
                    <p className="text-xs text-gray-500">{user.peran}</p>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={logout}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 border border-gray-200 hover:border-red-200 group"
            >
              <LogOut size={20} className="mr-4 flex-shrink-0 text-gray-400 group-hover:text-red-500" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
