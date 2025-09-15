import { Home, DollarSign, BarChart3, LogOut, X, User, CheckCircle2 as CheckIcon } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContexts';
import type { BendaharaPage } from '../types';

interface BendaharaSidebarProps {
  currentPage: BendaharaPage;
  onPageChange: (page: BendaharaPage) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { id: 'dashboard' as BendaharaPage, label: 'Dashboard', icon: Home },
  { id: 'payment-management' as BendaharaPage, label: 'Kelola Pembayaran', icon: DollarSign },
  { id: 'payment-verification' as BendaharaPage, label: 'Verifikasi Pembayaran', icon: CheckIcon },
  { id: 'payment-reports' as BendaharaPage, label: 'Laporan Keuangan', icon: BarChart3 },
];

export function BendaharaSidebar({ currentPage, onPageChange, isOpen, onToggle }: BendaharaSidebarProps) {
  const { logout, user } = useAuth();
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-2xl border-r border-gray-100 transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:shadow-none lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100 bg-gradient-to-r from-emerald-600 to-emerald-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <DollarSign className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Portal Bendahara</h1>
                <p className="text-xs text-emerald-100 font-medium">Sistem Keuangan</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg text-white hover:bg-emerald-800 transition-colors lg:hidden"
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-8 px-4">
            <ul className="space-y-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onPageChange(item.id);
                        if (window.innerWidth < 1024) onToggle();
                      }}
                      className={`group w-full flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-50 to-emerald-50 text-emerald-700 border-r-4 border-emerald-600 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 hover:shadow-sm'
                      }`}
                    >
                      <Icon 
                        size={20} 
                        className={`mr-4 flex-shrink-0 transition-colors ${
                          isActive ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'
                        }`} 
                      />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info & Logout - Right after navigation */}
          <div className="border-t border-gray-100 p-4 mt-8">
            {user && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                    <User size={18} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.nama_pengguna || user.nama_santri || 'Bendahara'}</p>
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
