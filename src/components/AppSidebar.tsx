/**
 * AppSidebar Component
 * 
 * Main sidebar navigation with role-based menu filtering.
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useFilteredMenu } from '@/hooks/useFilteredMenu';
import { usePermissions } from '@/hooks/usePermissions';
import { ROLE_LABELS } from '@/lib/permissions';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Store,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { MenuItem } from '@/lib/config/menuConfig';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const NavItemComponent: React.FC<{
  item: MenuItem;
  collapsed: boolean;
  depth?: number;
}> = ({ item, collapsed, depth = 0 }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path ||
    (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
  const Icon = item.icon;

  const content = (
    <NavLink
      to={item.path}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
        depth > 0 ? 'ml-4 text-sm' : '',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
      )}
    >
      <Icon
        className={cn(
          'w-5 h-5 shrink-0 transition-transform',
          isActive && 'text-accent',
          !collapsed && 'group-hover:scale-110'
        )}
      />
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
      {isActive && !collapsed && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
      )}
    </NavLink>
  );

  if (collapsed && depth === 0) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

export const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const { menu, isLoading } = useFilteredMenu();
  const { currentStore, currentRole } = usePermissions();
  const [expandedSections, setExpandedSections] = React.useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Auto-expand sections that contain the current path
  const location = useLocation();
  React.useEffect(() => {
    const currentSection = menu.find((section) =>
      section.items.some(
        (item) =>
          location.pathname === item.path ||
          location.pathname.startsWith(item.path + '/')
      )
    );
    if (currentSection && !expandedSections.includes(currentSection.id)) {
      setExpandedSections((prev) => [...prev, currentSection.id]);
    }
  }, [location.pathname, menu]);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Store className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-display font-bold text-sidebar-foreground">
              Mais Capinhas
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center mx-auto">
            <Store className="w-5 h-5 text-accent-foreground" />
          </div>
        )}
      </div>

      {/* Current Store Info */}
      {!collapsed && currentStore && (
        <div className="px-4 py-2 border-b border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/60">Loja atual</p>
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {currentStore.name}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          menu.map((section) => {
            const isExpanded = expandedSections.includes(section.id);
            const hasMultipleItems = section.items.length > 1;

            // For sections with single item, render directly
            if (!hasMultipleItems || collapsed) {
              return (
                <div key={section.id} className="space-y-1">
                  {section.items.map((item) => (
                    <NavItemComponent
                      key={item.id}
                      item={item}
                      collapsed={collapsed}
                    />
                  ))}
                </div>
              );
            }

            // For sections with multiple items, render collapsible
            return (
              <div key={section.id} className="space-y-1">
                <button
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 flex-1 text-left">
                    {section.title}
                  </span>
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 transition-transform',
                      isExpanded && 'rotate-90'
                    )}
                  />
                </button>
                {isExpanded && (
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <NavItemComponent
                        key={item.id}
                        item={item}
                        collapsed={collapsed}
                        depth={1}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User info */}
      <div className="p-3">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-medium">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name || 'Usuário'}
              </p>
              {currentRole && (
                <Badge variant="outline" className="text-[10px] h-4 px-1">
                  {ROLE_LABELS[currentRole]}
                </Badge>
              )}
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          onClick={logout}
          className={cn(
            'w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
            collapsed && 'h-10 w-10'
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </div>

      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar shadow-md hover:bg-sidebar-accent"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </Button>
    </aside>
  );
};
