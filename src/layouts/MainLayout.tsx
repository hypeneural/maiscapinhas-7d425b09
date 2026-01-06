import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { cn } from '@/lib/utils';

export const MainLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
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
            <RoleSwitcher />
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
