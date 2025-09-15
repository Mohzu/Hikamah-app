import { useState } from 'react';
import { BendaharaTemplate } from './templates/BendaharaTemplate';
import { DashboardBendaharaPage } from './pages/DashboardBendaharaPage';
import { PaymentManagementPage } from './pages/PaymentManagementPage';
import { PaymentReportsPage } from './pages/PaymentReportsPage';
import { PaymentVerificationPage } from './pages/PaymentVerificationPage';
import type { BendaharaPage } from './types';

export function BendaharaRoutes() {
  const [currentPage, setCurrentPage] = useState<BendaharaPage>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardBendaharaPage />;
      case 'payment-management':
        return <PaymentManagementPage />;
      case 'payment-verification':
        return <PaymentVerificationPage />;
      case 'payment-reports':
        return <PaymentReportsPage />;
      default:
        return <DashboardBendaharaPage />;
    }
  };

  return (
    <BendaharaTemplate
      currentPage={currentPage}
      onPageChange={setCurrentPage}
    >
      {renderPage()}
    </BendaharaTemplate>
  );
}
