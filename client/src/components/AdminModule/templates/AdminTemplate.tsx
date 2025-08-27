import React, { useState } from 'react';
import { AdminSidebar, type AdminPage } from '../components/AdminSidebar';
import { AdminHeader } from '../components/AdminHeader';

interface AdminTemplateProps {
  children: React.ReactNode;
}

export function AdminTemplate({ children }: AdminTemplateProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => { setSidebarOpen(!sidebarOpen); };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Fixed width, always visible on desktop */}
      <div className="hidden lg:block w-64 bg-white shadow-xl">
        <AdminSidebar
          onToggle={toggleSidebar}
        />
      </div>
      
      {/* Mobile Sidebar - Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={toggleSidebar} />
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl">
            <AdminSidebar
              onToggle={toggleSidebar}
            />
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <AdminHeader onToggleSidebar={toggleSidebar} />
        
        {/* Main Content (Pages) */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export type { AdminPage };
