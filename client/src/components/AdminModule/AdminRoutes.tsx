import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminTemplate } from './templates/AdminTemplate';
import { DashboardAdminPage } from './pages/DashboardAdminPage';
import { TeachersManagementPage } from './pages/TeachersManagementPage';
import { StudentsManagementPage } from './pages/StudentsManagementPage';
import { ClassManagementPage } from './pages/ClassManagementPage';
import { AcademicManagementPage } from './pages/AcademicManagementPage';
import { SettingsPage } from './pages/SettingsPage';

export function AdminRoutes() {
  return (
    <AdminTemplate>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardAdminPage />} />
        <Route path="/teachers" element={<TeachersManagementPage />} />
        <Route path="/students" element={<StudentsManagementPage />} />
        <Route path="/homeroom" element={<ClassManagementPage />} />
        <Route path="/academic" element={<AcademicManagementPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminTemplate>
  );
}
