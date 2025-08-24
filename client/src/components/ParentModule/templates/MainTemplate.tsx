import { useState } from 'react';
import { Sidebar } from '../../../components/layout/Sidebar';
import { Header } from '../../../components/layout/Header';
import { useAuth } from '../../../contexts/AuthContexts';

interface MainTemplateProps {
  children: React.ReactNode;
}

export const MainTemplate: React.FC<MainTemplateProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const { user } = useAuth();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        userRole={user?.peran}
      />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
