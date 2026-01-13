/**
 * Capas Navigation Tabs
 * 
 * Top navigation tabs for Capas Personalizadas section.
 * Consolidates Lista, Carrinho de Produção, Pedidos de Produção, and Portal Fábrica.
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    Palette,
    ShoppingCart,
    PackageCheck,
    Factory,
    Sparkles,
    Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCarrinho } from '@/hooks/api/use-producao';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavTab {
    label: string;
    shortLabel?: string;
    path: string;
    icon: React.ElementType;
    tooltip: string;
    adminOnly?: boolean;
    fabricaOnly?: boolean;
    badge?: number;
}

export function CapasNavTabs() {
    const location = useLocation();
    const { user } = useAuth();
    // Use new permission fields from /me endpoint
    const isAdmin = user?.is_global_admin ?? false;
    const isFabrica = user?.has_fabrica_access ?? false;

    // Get cart count for badge
    const { data: carrinho } = useCarrinho();
    const cartCount = carrinho?.total_itens || 0;

    const tabs: NavTab[] = [
        {
            label: 'Lista de Capas',
            shortLabel: 'Lista',
            path: '/capas',
            icon: Palette,
            tooltip: 'Gerenciar capas personalizadas e encomendas',
        },
        {
            label: 'Carrinho',
            path: '/capas/carrinho',
            icon: ShoppingCart,
            tooltip: 'Carrinho de produção - Agrupar capas para enviar à fábrica',
            adminOnly: true,
            badge: cartCount,
        },
        {
            label: 'Pedidos',
            path: '/capas/pedidos',
            icon: PackageCheck,
            tooltip: 'Pedidos enviados para produção - Acompanhar status',
            adminOnly: true,
        },
        {
            label: 'Portal Fábrica',
            shortLabel: 'Fábrica',
            path: '/fabrica/pedidos',
            icon: Factory,
            tooltip: 'Portal da fábrica - Aceitar e despachar pedidos',
            adminOnly: true,
        },
    ];

    // Filter tabs based on role
    const visibleTabs = tabs.filter((tab) => {
        if (tab.adminOnly && !isAdmin) return false;
        if (tab.fabricaOnly && !isFabrica && !isAdmin) return false;
        return true;
    });

    const isActive = (path: string) => {
        if (path === '/capas') {
            return location.pathname === '/capas' ||
                location.pathname === '/capas/novo' ||
                location.pathname.match(/^\/capas\/\d+/);
        }
        if (path === '/fabrica/pedidos') {
            return location.pathname.startsWith('/fabrica');
        }
        return location.pathname.startsWith(path);
    };

    return (
        <TooltipProvider>
            <div className="border-b mb-6 bg-gradient-to-r from-muted/30 to-transparent rounded-t-lg">
                <nav className="flex gap-0.5 -mb-px overflow-x-auto px-1">
                    {visibleTabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = isActive(tab.path);

                        return (
                            <Tooltip key={tab.path}>
                                <TooltipTrigger asChild>
                                    <NavLink
                                        to={tab.path}
                                        className={cn(
                                            'relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap',
                                            'border-b-2 transition-all duration-200 rounded-t-md',
                                            'hover:bg-muted/50',
                                            active
                                                ? 'text-primary border-primary bg-background shadow-sm'
                                                : 'text-muted-foreground border-transparent hover:text-foreground'
                                        )}
                                    >
                                        <Icon className={cn(
                                            'h-4 w-4 transition-transform',
                                            active && 'text-primary scale-110'
                                        )} />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                        <span className="sm:hidden">{tab.shortLabel || tab.label}</span>
                                        {tab.badge !== undefined && tab.badge > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    'ml-1 h-5 min-w-5 px-1.5 text-xs font-bold animate-pulse',
                                                    active
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-orange-500 text-white'
                                                )}
                                            >
                                                {tab.badge}
                                            </Badge>
                                        )}
                                        {active && (
                                            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-primary animate-pulse" />
                                        )}
                                    </NavLink>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs">
                                    <div className="flex items-start gap-2">
                                        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                        <span>{tab.tooltip}</span>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </nav>
            </div>
        </TooltipProvider>
    );
}

export default CapasNavTabs;
