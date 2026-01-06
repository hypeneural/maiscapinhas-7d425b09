import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import {
  LayoutDashboard,
  Wallet,
  FileCheck,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Store,
  AlertTriangle,
  History,
  Trophy,
  TrendingUp,
  AlertCircle,
  Target,
  Gift,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles?: ('admin' | 'gerente' | 'conferente' | 'vendedor')[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    label: 'Meu Faturamento',
    icon: Wallet,
    path: '/faturamento',
    roles: ['vendedor'],
    children: [
      { label: 'Extrato de Vendas', icon: History, path: '/faturamento/extrato' },
      { label: 'Meus Bônus', icon: Gift, path: '/faturamento/bonus' },
      { label: 'Minhas Comissões', icon: TrendingUp, path: '/faturamento/comissoes' },
    ],
  },
  {
    label: 'Conferência',
    icon: FileCheck,
    path: '/conferencia',
    roles: ['conferente', 'admin', 'gerente'],
    children: [
      { label: 'Lançar Turno', icon: FileCheck, path: '/conferencia/lancar' },
      { label: 'Divergências', icon: AlertTriangle, path: '/conferencia/divergencias' },
      { label: 'Histórico', icon: History, path: '/conferencia/historico' },
    ],
  },
  {
    label: 'Gestão',
    icon: BarChart3,
    path: '/gestao',
    roles: ['gerente', 'admin'],
    children: [
      { label: 'Ranking Vendas', icon: Trophy, path: '/gestao/ranking' },
      { label: 'Desempenho Lojas', icon: Store, path: '/gestao/lojas' },
      { label: 'Quebra de Caixa', icon: AlertCircle, path: '/gestao/quebra' },
    ],
  },
  {
    label: 'Configurações',
    icon: Settings,
    path: '/config',
    roles: ['admin'],
    children: [
      { label: 'Metas Mensais', icon: Target, path: '/config/metas' },
      { label: 'Tabela de Bônus', icon: Gift, path: '/config/bonus' },
      { label: 'Usuários & Lojas', icon: Users, path: '/config/usuarios' },
    ],
  },
];

const NavItemComponent: React.FC<{
  item: NavItem;
  collapsed: boolean;
  depth?: number;
}> = ({ item, collapsed, depth = 0 }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
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
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const toggleExpanded = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const hasAccess = !item.roles || (user && item.roles.includes(user.role));
          if (!hasAccess) return null;

          const isExpanded = expandedItems.includes(item.path);

          return (
            <div key={item.path}>
              {item.children && !collapsed ? (
                <>
                  <button
                    onClick={() => toggleExpanded(item.path)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    <ChevronRight
                      className={cn(
                        'w-4 h-4 transition-transform',
                        isExpanded && 'rotate-90'
                      )}
                    />
                  </button>
                  {isExpanded && (
                    <div className="mt-1 space-y-1">
                      {item.children.map((child) => (
                        <NavItemComponent
                          key={child.path}
                          item={child}
                          collapsed={collapsed}
                          depth={1}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavItemComponent item={item} collapsed={collapsed} />
              )}
            </div>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User info */}
      <div className="p-3">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-medium">
              {user.nome.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.nome}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">
                {user.role}
              </p>
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
