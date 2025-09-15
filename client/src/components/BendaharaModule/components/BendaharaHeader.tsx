import { Menu, Bell, User, DollarSign, Calendar } from 'lucide-react';

interface BendaharaHeaderProps {
  userName: string;
  onToggleSidebar: () => void;
}

export function BendaharaHeader({ userName, onToggleSidebar }: BendaharaHeaderProps) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 z-30 flex-shrink-0">
      <div className="flex items-center justify-between px-6 py-4 lg:px-10">
        <div className="flex items-center flex-1">
          <button
            onClick={onToggleSidebar}
            className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors lg:hidden"
          >
            <Menu size={22} />
          </button>
          
          <div className="ml-4 lg:ml-0 flex items-center flex-1">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
              <DollarSign size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 mb-1">{userName || 'Bendahara'}</h1>
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-600 flex items-center">
                  <DollarSign size={16} className="mr-1.5 text-emerald-600" />
                  <span className="font-medium">Portal Bendahara</span>
                </p>
                <p className="text-sm text-gray-500 flex items-center">
                  <Calendar size={14} className="mr-1.5" />
                  <span>{currentDate}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            className="relative p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
            <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              3
            </span>
          </button>
          
          <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl px-4 py-2.5 border border-gray-200 shadow-sm">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center mr-3">
              <User size={16} className="text-emerald-600" />
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-semibold text-gray-800">Bendahara</span>
              <p className="text-xs text-gray-500">Portal Keuangan</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
