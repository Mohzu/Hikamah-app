import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthRoutes } from './components/auth/AuthRoutes';
import { ParentRoutes } from './components/ParentModule/parentroutes';
import { MainTemplate } from './components/ParentModule/templates/MainTemplate';
import { useAuth } from './contexts/AuthContexts';
import { DashboardPage } from '../src/components/ParentModule/pages/DashboardPage';
import { AdminRoutes } from './components/AdminModule/AdminRoutes';

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
      {/* Default redirect ke login */}
      <Route path="/" element={<Navigate to="/auth/login" replace />} />

      {/* Auth */}
      <Route path="/auth/*" element={<AuthRoutes />} />

      {/* Admin */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute isAllowed={isLoggedIn && user?.peran === "Admin"}>
            <AdminRoutes />
          </ProtectedRoute>
        }
      />

      {/* Guru */}
      <Route
        path="/guru/*"
        element={
          <ProtectedRoute isAllowed={isLoggedIn && user?.peran === "Guru"}>
            <MainTemplate>
              <div>Halaman Guru (nanti buat GuruRoutes)</div>
            </MainTemplate>
          </ProtectedRoute>
        }
      />

      {/* Santri / Parent */}
      <Route
        path="/parent/*"
        element={
          <ProtectedRoute isAllowed={isLoggedIn && user?.peran === "Santri"}>
            <MainTemplate>
              <Routes>
                <Route path="dashboard" element={<DashboardPage />} />
                {/* Rute lain untuk parent */}
                <Route path="*" element={<ParentRoutes />} />
              </Routes>
            </MainTemplate>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}

export default App;
