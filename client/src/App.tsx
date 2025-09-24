// client/src/App.tsx

import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthRoutes } from './components/auth/AuthRoutes';
import { ParentRoutes } from './components/ParentModule/parentroutes';
import { MainTemplate } from './components/ParentModule/templates/MainTemplate';
import { useAuth } from './contexts/AuthContexts';
import { DashboardPage } from './components/ParentModule/pages/DashboardPage';
import { WaliKelasRoutes } from './components/WaliKelasModule/WaliKelasRoutes';
import { RoleChooserPage } from './components/WaliKelasModule/pages/RoleChooserPage';
import { AdminRoutes } from './components/AdminModule/AdminRoutes';
import { BendaharaRoutes } from './components/BendaharaModule/BendaharaRoutes';
import { StudentDataProvider } from './contexts/StudentDataContext';

interface ProtectedRouteProps {
  isAllowed: boolean;
  redirectPath?: string;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAllowed,
  redirectPath = "/auth/login",
  children,
}) => {
  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }
  return <>{children}</>;
};

function App() {
  const { isLoggedIn, user, isLoading } = useAuth();

  useEffect(() => {
    console.log("[App] isLoggedIn:", isLoggedIn);
    console.log("[App] user:", user);
    if (user?.peran === 'Admin') {
      console.log("[App] Admin user detected, should be able to access /admin/* routes");
    }
  }, [isLoggedIn, user]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/login" replace />} />
      <Route path="/auth/*" element={<AuthRoutes />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute isAllowed={isLoggedIn && user?.peran === "Admin"}>
            <AdminRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bendahara/*"
        element={
          <ProtectedRoute isAllowed={isLoggedIn && user?.peran === "Bendahara"}>
            <BendaharaRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guru/*"
        element={
          <ProtectedRoute isAllowed={isLoggedIn && (user?.peran === "Guru" || user?.peran === "Wali Kelas") }>
            <StudentDataProvider>
              <MainTemplate>
                <WaliKelasRoutes />
              </MainTemplate>
            </StudentDataProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/choose-role"
        element={
          <ProtectedRoute isAllowed={isLoggedIn && user?.peran === 'Wali Kelas'}>
            {/* Tanpa Sidebar/Header agar mirip login */}
            <RoleChooserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/*"
        element={
          <ProtectedRoute isAllowed={isLoggedIn && (user?.peran === "Santri" || user?.peran === "Wali Santri")}>
            {/* Perbaikan: StudentDataProvider membungkus MainTemplate */}
            <StudentDataProvider>
              <MainTemplate>
                <Routes>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="*" element={<ParentRoutes />} />
                </Routes>
              </MainTemplate>
            </StudentDataProvider>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}

export default App;