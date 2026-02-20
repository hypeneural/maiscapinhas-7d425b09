/**
 * Menu Configuration
 * 
 * Complete menu structure with role and permission requirements.
 */

import {
    LayoutDashboard,
    Wallet,
    FileCheck,
    BarChart3,
    Settings,
    Store,
    AlertTriangle,
    History,
    Trophy,
    TrendingUp,
    AlertCircle,
    Target,
    Gift,
    Users,
    ScrollText,
    Palette,
    Smartphone,
    Megaphone,
    MessageSquare,
    Factory,
    ShoppingCart,
    Shield,
    Key,
    Package,
    Network,
    Tv,
    Award,
    Activity,
    Plug,
    type LucideIcon,
} from 'lucide-react';
import type { Role, Permission } from '@/lib/permissions';

export interface MenuItem {
    id: string;
    label: string;
    icon: LucideIcon;
    path: string;
    /** 
     * Legacy permissions (e.g. 'dashboard:view')
     * @deprecated Use apiPermission instead
     */
    permissions?: Permission[];
    /**
     * API permission string from backend (e.g. 'screen.dashboard')
     * Takes priority over permissions[] when checking access
     */
    apiPermission?: string;
    roles?: Role[];
    excludeRoles?: Role[];
    minRole?: Role;
    children?: MenuItem[];
    /**
     * Descriptive tooltip text shown on hover (optional)
     * If not provided, uses label as tooltip when sidebar is collapsed
     */
    tooltip?: string;
}

export interface MenuSection {
    id: string;
    title: string;
    items: MenuItem[];
    permissions?: Permission[];
    /** API permission for the entire section */
    apiPermission?: string;
    roles?: Role[];
    excludeRoles?: Role[];
    minRole?: Role;
}

/**
 * Complete menu configuration
 * 
 * Permission mapping (legacy -> new):
 * - dashboard:view -> screen.dashboard
 * - sales:view -> pedidos.view
 * - capas.view -> screen.capas.list
 * - users:manage -> admin.users.manage
 */
export const menuSections: MenuSection[] = [
    // Dashboard - Everyone except fabrica
    {
        id: 'principal',
        title: 'Principal',
        excludeRoles: ['fabrica'],
        items: [
            {
                id: 'dashboard',
                label: 'Dashboard',
                icon: LayoutDashboard,
                path: '/',
                apiPermission: 'screen.dashboard',
                permissions: ['dashboard:view'], // Legacy fallback
            },
            {
                id: 'comunicados',
                label: 'Comunicados',
                icon: MessageSquare,
                path: '/comunicados',
                apiPermission: 'screen.comunicados',
            },
            {
                id: 'comemoracoes',
                label: 'Comemorações',
                icon: Gift,
                path: '/comemoracoes',
                apiPermission: 'celebrations.view',
            },
        ],
    },

    // Clientes, Pedidos, Capas - Everyone except fabrica
    {
        id: 'vendas',
        title: 'Vendas',
        excludeRoles: ['fabrica'],
        items: [
            {
                id: 'clientes',
                label: 'Clientes',
                icon: Users,
                path: '/clientes',
                apiPermission: 'screen.clientes.list',
            },
            {
                id: 'pedidos',
                label: 'Pedidos',
                icon: FileCheck,
                path: '/pedidos',
                apiPermission: 'screen.pedidos.list',
            },
            {
                id: 'capas-personalizadas',
                label: 'Capas Personalizadas',
                icon: Palette,
                path: '/capas',
                apiPermission: 'screen.capas.list',
            },
        ],
    },


    // Faturamento - Vendedor
    {
        id: 'faturamento',
        title: 'Meu Faturamento',
        roles: ['vendedor'],
        items: [
            {
                id: 'extrato-vendas',
                label: 'Extrato de Vendas',
                icon: History,
                path: '/faturamento/extrato',
                permissions: ['sales:view'],
            },
            {
                id: 'meus-bonus',
                label: 'Meus Bônus',
                icon: Gift,
                path: '/faturamento/bonus',
                permissions: ['bonus:view_own'],
            },
            {
                id: 'minhas-comissoes',
                label: 'Minhas Comissões',
                icon: TrendingUp,
                path: '/faturamento/comissoes',
                permissions: ['commission:view_own'],
            },
        ],
    },

    // Conferência - Conferente, Gerente, Admin
    {
        id: 'conferencia',
        title: 'Conferência',
        roles: ['conferente', 'gerente', 'admin'],
        items: [
            {
                id: 'lancar-turno',
                label: 'Lançar Turno',
                icon: FileCheck,
                path: '/conferencia/lancar',
                permissions: ['shift:create', 'closing:submit'],
            },
            {
                id: 'divergencias',
                label: 'Divergências',
                icon: AlertTriangle,
                path: '/conferencia/divergencias',
                permissions: ['divergence:view'],
            },
            {
                id: 'historico-envelopes',
                label: 'Histórico',
                icon: History,
                path: '/conferencia/historico',
                permissions: ['shift:view'],
            },
        ],
    },

    // Gestão - Gerente, Admin
    {
        id: 'gestao',
        title: 'Gestão',
        minRole: 'gerente',
        items: [
            {
                id: 'ranking-vendas',
                label: 'Ranking Vendas',
                icon: Trophy,
                path: '/gestao/ranking',
                permissions: ['ranking:view'],
            },
            {
                id: 'desempenho-lojas',
                label: 'Desempenho Lojas',
                icon: Store,
                path: '/gestao/lojas',
                permissions: ['reports:store_performance'],
            },
            {
                id: 'quebra-caixa',
                label: 'Quebra de Caixa',
                icon: AlertCircle,
                path: '/gestao/quebra',
                permissions: ['reports:cash_integrity'],
            },
            {
                id: 'kpis-colaboradores',
                label: 'KPIs de Colaboradores',
                icon: Users,
                path: '/gestao/kpis-colaboradores',
                permissions: ['reports:user_kpis'],
            },
            {
                id: 'historico-vendas',
                label: 'Histórico de Vendas',
                icon: FileCheck, // Using FileCheck (scroll text/history like) or History
                path: '/gestao/historico-vendas',
                roles: ['admin'],
            },
            {
                id: 'historico-operacoes',
                label: 'Operações PDV',
                icon: BarChart3,
                path: '/gestao/historico-operacoes',
                roles: ['admin'],
                tooltip: 'Histórico unificado de vendas e fechamentos de caixa do PDV',
            },
            {
                id: 'monitoramento-pdv',
                label: 'Monitoramento PDV',
                icon: Activity,
                path: '/gestao/monitoramento-pdv',
                roles: ['admin'],
            },
            {
                id: 'pdv-mapping',
                label: 'Mapeamento PDV',
                icon: Users,
                path: '/admin/pdv/mapping',
                roles: ['admin'],
            },
            {
                id: 'validacao-vendas',
                label: 'Validações PDV',
                icon: FileCheck,
                path: '/gestao/validacao-vendas',
                roles: ['admin'],
            },
        ],
    },


    // Config - Gerente, Admin (but some items admin-only)
    {
        id: 'configuracoes',
        title: 'Configurações',
        minRole: 'gerente',
        items: [
            {
                id: 'metas-mensais',
                label: 'Metas Mensais',
                icon: Target,
                path: '/config/metas',
                permissions: ['goals:manage'],
            },
            {
                id: 'tabela-bonus',
                label: 'Tabela de Bônus',
                icon: Gift,
                path: '/config/bonus',
                permissions: ['rules:manage'],
            },
            {
                id: 'regras-comissao',
                label: 'Regras de Comissão',
                icon: TrendingUp,
                path: '/config/comissoes',
                permissions: ['rules:manage'],
            },
            {
                id: 'usuarios-lojas',
                label: 'Usuários & Lojas',
                icon: Users,
                path: '/config/usuarios',
                roles: ['admin'],
                permissions: ['users:manage', 'stores:manage'],
            },
            {
                id: 'gerenciar-comunicados',
                label: 'Gerenciar Comunicados',
                icon: Megaphone,
                path: '/config/comunicados',
            },
            {
                id: 'hiper-erp',
                label: 'Conexão ERP Hiper',
                icon: Plug,
                path: '/admin/hiper/conexao',
                roles: ['admin'],
                tooltip: 'Gerenciar conexões, endpoints e executar requests no Hiper ERP',
            },
        ],
    },

    // Admin - Only Admin
    {
        id: 'admin',
        title: 'Administração',
        roles: ['admin'],
        items: [
            {
                id: 'modules',
                label: 'Módulos',
                icon: Package,
                path: '/config/modules',
                permissions: ['users:manage'],
            },
            {
                id: 'roles',
                label: 'Roles',
                icon: Shield,
                path: '/config/roles',
                permissions: ['users:manage'],
            },
            {
                id: 'permissions',
                label: 'Permissões',
                icon: Key,
                path: '/config/permissoes',
                permissions: ['users:manage'],
            },
            {
                id: 'permission-graph',
                label: 'Grafo de Permissões',
                icon: Network,
                path: '/config/permission-graph',
                permissions: ['users:manage'],
            },
            {
                id: 'audit-logs',
                label: 'Logs de Auditoria',
                icon: ScrollText,
                path: '/config/auditoria',
                permissions: ['audit:view'],
            },
            {
                id: 'phone-catalog',
                label: 'Catálogo de Aparelhos',
                icon: Smartphone,
                path: '/config/catalogo',
            },
            {
                id: 'whatsapp-instances',
                label: 'Instâncias WhatsApp',
                icon: MessageSquare,
                path: '/config/whatsapp',
            },
        ],
    },

    // Fábrica - Factory role + Admin
    {
        id: 'fabrica',
        title: 'Portal Fábrica',
        roles: ['fabrica', 'admin'],
        items: [
            {
                id: 'fabrica-pedidos',
                label: 'Pedidos da Fábrica',
                icon: Factory,
                path: '/fabrica/pedidos',
            },
        ],
    },

    // Wheel Module - Super Admin Only
    {
        id: 'wheel',
        title: 'Roleta nas TVs',
        roles: ['admin'],
        items: [
            {
                id: 'wheel-dashboard',
                label: 'Visão Geral',
                tooltip: 'Painel com resumo de TVs, campanhas e giros',
                icon: Target,
                path: '/admin/wheel',
                apiPermission: 'wheel.admin',
            },
            {
                id: 'wheel-screens',
                label: 'TVs e Totens',
                tooltip: 'Gerenciar dispositivos que exibem a roleta',
                icon: Tv,
                path: '/admin/wheel/screens',
                apiPermission: 'wheel.admin',
            },
            {
                id: 'wheel-campaigns',
                label: 'Campanhas',
                tooltip: 'Criar e gerenciar promoções da roleta',
                icon: Gift,
                path: '/admin/wheel/campaigns',
                apiPermission: 'wheel.admin',
            },
            {
                id: 'wheel-prizes',
                label: 'Prêmios',
                tooltip: 'Catálogo de prêmios disponíveis',
                icon: Award,
                path: '/admin/wheel/prizes',
                apiPermission: 'wheel.admin',
            },
            {
                id: 'wheel-rules',
                label: 'Regras',
                tooltip: 'Regras de distribuição: cooldowns, limites e controles',
                icon: Settings,
                path: '/admin/wheel/rules',
                apiPermission: 'wheel.admin',
            },
            {
                id: 'wheel-players',
                label: 'Jogadores',
                tooltip: 'Pessoas que participaram da roleta',
                icon: Users,
                path: '/admin/wheel/players',
                apiPermission: 'wheel.admin',
            },
            {
                id: 'wheel-logs',
                label: 'Eventos',
                tooltip: 'Histórico de ações e ocorrências',
                icon: ScrollText,
                path: '/admin/wheel/logs',
                apiPermission: 'wheel.admin',
            },
            {
                id: 'wheel-analytics',
                label: 'Relatórios',
                tooltip: 'Estatísticas detalhadas de desempenho',
                icon: BarChart3,
                path: '/admin/wheel/analytics',
                apiPermission: 'wheel.admin',
            },
        ],
    },
];

/**
 * Filter menu sections based on user permissions
 * @param hasPermission - Function to check if user has a permission (uses API permissions from /me)
 * @param isSuperAdmin - If true, bypasses excludeRoles check (super admin sees everything)
 */
export function filterMenuSections(
    sections: MenuSection[],
    hasPermission: (p: string) => boolean,
    hasRole: (r: Role) => boolean,
    hasMinRole: (r: Role) => boolean,
    isSuperAdmin: boolean = false
): MenuSection[] {
    return sections
        .filter((section) => {
            // Super admin bypasses excludeRoles - they see EVERYTHING
            // For non-super admin, check excludeRoles
            if (!isSuperAdmin && section.excludeRoles?.length) {
                if (section.excludeRoles.some(hasRole)) return false;
            }

            // Check section roles
            if (section.roles?.length) {
                if (!section.roles.some(hasRole)) return false;
            }

            // Check section minRole
            if (section.minRole) {
                if (!hasMinRole(section.minRole)) return false;
            }

            // Check section apiPermission first (new system)
            if (section.apiPermission) {
                if (!hasPermission(section.apiPermission)) return false;
            }
            // Fallback to legacy permissions
            else if (section.permissions?.length) {
                if (!section.permissions.some(hasPermission)) return false;
            }

            return true;
        })
        .map((section) => ({
            ...section,
            items: section.items.filter((item) => {
                // Super admin bypasses excludeRoles for items too
                if (!isSuperAdmin && item.excludeRoles?.length) {
                    if (item.excludeRoles.some(hasRole)) return false;
                }

                // Check item roles
                if (item.roles?.length) {
                    if (!item.roles.some(hasRole)) return false;
                }

                // Check item minRole
                if (item.minRole) {
                    if (!hasMinRole(item.minRole)) return false;
                }

                // Check apiPermission first (new system) - takes priority
                if (item.apiPermission) {
                    if (!hasPermission(item.apiPermission)) return false;
                }
                // Fallback to legacy permissions (any)
                else if (item.permissions?.length) {
                    if (!item.permissions.some(hasPermission)) return false;
                }

                return true;
            }),
        }))
        .filter((section) => section.items.length > 0);
}

