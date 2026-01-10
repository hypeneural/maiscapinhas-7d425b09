/**
 * Dashboard Page
 * 
 * Renders the appropriate dashboard based on user's current role.
 * Super Admins always see the Admin dashboard.
 */

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { DashboardVendedor } from '@/components/dashboards/DashboardVendedor';
import { DashboardConferente } from '@/components/dashboards/DashboardConferente';
import { DashboardAdmin } from '@/components/dashboards/DashboardAdmin';
import { Loader2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { currentRole, isLoading, isSuperAdmin } = usePermissions();

  // Debug: log to see what values we're getting
  console.log('[Dashboard] isSuperAdmin:', isSuperAdmin, 'currentRole:', currentRole, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Super Admin always sees the Admin dashboard
  if (isSuperAdmin) {
    return <DashboardAdmin />;
  }

  switch (currentRole) {
    case 'vendedor':
      return <DashboardVendedor />;
    case 'conferente':
      return <DashboardConferente />;
    case 'gerente':
    case 'admin':
      return <DashboardAdmin />;
    default:
      // Fallback to vendedor dashboard
      return <DashboardVendedor />;
  }
};

export default Dashboard;
