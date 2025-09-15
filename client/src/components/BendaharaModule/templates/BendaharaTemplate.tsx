import React, { useState } from 'react';
import { BendaharaSidebar } from '../components/BendaharaSidebar';
import { BendaharaHeader } from '../components/BendaharaHeader';
import { useAuth } from '../../../contexts/AuthContexts';
import type { BendaharaPage } from '../types';

interface BendaharaTemplateProps {
  children: React.ReactNode;
  currentPage: BendaharaPage;
  onPageChange: (page: BendaharaPage) => void;
}

export function BendaharaTemplate({ children, currentPage, onPageChange }: BendaharaTemplateProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <BendaharaSidebar
        currentPage={currentPage}
        onPageChange={onPageChange}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Header */}
        <BendaharaHeader
          userName={user?.nama_pengguna || user?.nama_santri || 'Bendahara'}
          onToggleSidebar={toggleSidebar}
        />

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
