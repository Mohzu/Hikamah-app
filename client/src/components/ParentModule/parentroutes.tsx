import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { GradesPage } from './pages/GradesPage';
import { HafalanPage } from './pages/HafalanPage';
import { ProfilePage } from './pages/ProfilePage';
import PaymentPage from './pages/PaymentPage';

export function ParentRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="grades" element={<GradesPage />} />
      <Route path="hafalan" element={<HafalanPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="payment" element={<PaymentPage />} />
    </Routes>
  );
}
