import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardVendedor } from '@/components/dashboards/DashboardVendedor';
import { DashboardConferente } from '@/components/dashboards/DashboardConferente';
import { DashboardAdmin } from '@/components/dashboards/DashboardAdmin';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  switch (user.role) {
    case 'vendedor':
      return <DashboardVendedor />;
    case 'conferente':
      return <DashboardConferente />;
    case 'gerente':
    case 'admin':
      return <DashboardAdmin />;
    default:
      return <DashboardVendedor />;
  }
};

export default Dashboard;
