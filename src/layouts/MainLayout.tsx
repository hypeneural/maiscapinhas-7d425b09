/**
 * Main Layout Component
 * 
 * Responsive layout with:
 * - Desktop: Fixed sidebar with toggle
 * - Mobile: Sheet drawer with hamburger menu
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { StoreSwitcher } from '@/components/StoreSwitcher';
import { CelebrationProvider } from '@/components/CelebrationModal';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';

export const MainLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Mobile Layout
  if (isMobile) {
    return (
      <CelebrationProvider
        userName={user?.name || ''}
        birthDate={user?.birth_date}
        hireDate={user?.hire_date}
      >
        <div className="min-h-screen bg-background">
          {/* Mobile Header */}
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Abrir menu"
                className="h-10 w-10"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <StoreSwitcher />
            </div>
          </header>

          {/* Mobile Content */}
          <main className="p-4 pb-20">
            <Outlet />
          </main>

          {/* Mobile Drawer */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent side="left" className="w-[280px] p-0">
              <VisuallyHidden>
                <SheetTitle>Menu de navegação</SheetTitle>
              </VisuallyHidden>
              <MobileSidebar onNavigate={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </CelebrationProvider>
    );
  }

  // Desktop Layout
  return (
    <CelebrationProvider
      userName={user?.name || ''}
      birthDate={user?.birth_date}
      hireDate={user?.hire_date}
    >
      <div className="min-h-screen bg-background">
        {/* Skip link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
        >
          Pular para o conteúdo principal
        </a>

        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main
          id="main-content"
          tabIndex={-1}
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

export default MainLayout;
