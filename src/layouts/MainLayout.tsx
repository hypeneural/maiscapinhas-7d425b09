import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { StoreSwitcher } from '@/components/StoreSwitcher';
import { CelebrationProvider } from '@/components/CelebrationModal';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export const MainLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <CelebrationProvider
      userName={user?.name || ''}
      birthDate={user?.birth_date}
      hireDate={user?.hire_date}
    >
      <div className="min-h-screen bg-background">
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main
          className={cn(
            'transition-all duration-300 min-h-screen',
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          )}
        >
          {/* Top Bar */}
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-3">
            <div className="flex items-center justify-between">
              <div />
              <StoreSwitcher />
            </div>
          </header>

          {/* Content */}
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </CelebrationProvider>
  );
};

