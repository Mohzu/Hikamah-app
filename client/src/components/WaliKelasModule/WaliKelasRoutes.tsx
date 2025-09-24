import { Routes, Route, Navigate } from 'react-router-dom';
import { WaliKelasDashboardPage } from './pages/WaliKelasDashboardPage.tsx';
import { SantriListPage } from './pages/SantriListPage.tsx';
import { SantriDetailPage } from './pages/SantriDetailPage.tsx';
import { KehadiranPage } from './pages/KehadiranPage';

export function WaliKelasRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<WaliKelasDashboardPage />} />
      <Route path="santri" element={<SantriListPage />} />
      <Route path="santri/:id" element={<SantriDetailPage />} />
      <Route path="kehadiran" element={<KehadiranPage />} />
    </Routes>
  );
}


