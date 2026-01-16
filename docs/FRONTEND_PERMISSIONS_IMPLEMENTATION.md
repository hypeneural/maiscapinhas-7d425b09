# 🔐 Implementação de Permissões Granulares no Frontend

> **Data**: 2026-01-16  
> **Stack**: React 18 + Vite + React Context + React Query + TailwindCSS + Shadcn/ui  
> **Objetivo**: Evoluir o sistema de permissões atual para suportar a granularidade do backend

---

## 📋 Índice

1. [Estado Atual vs Novo Sistema](#estado-atual-vs-novo-sistema)
2. [Mudanças Necessárias no Backend /me](#mudanças-necessárias-no-backend-me)
3. [Evolução do AuthContext](#evolução-do-authcontext)
4. [Evolução do usePermissions](#evolução-do-usepermissions)
5. [Sistema de Screens (Telas)](#sistema-de-screens-telas)
6. [Migração do Menu](#migração-do-menu)
7. [Componente PermissionGate](#componente-permissiongate)
8. [Proteção de Rotas](#proteção-de-rotas)
9. [Plano de Migração](#plano-de-migração)

---

## Estado Atual vs Novo Sistema

### Sistema Atual ❌

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA ATUAL                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   /me retorna:                                                  │
│   └─ user.stores[].role (vendedor, gerente, etc.)               │
│   └─ user.is_super_admin                                        │
│   └─ user.has_fabrica_access                                    │
│                                                                 │
│   Frontend (ROLE_PERMISSIONS):                                  │
│   └─ Mapeia role → permissões fixas                             │
│   └─ Não suporta override por usuário                           │
│   └─ Não suporta override por loja                              │
│                                                                 │
│   Problema: Se quero dar acesso especial a "Maria" (vendedora)  │
│   para ver relatórios, não consigo sem mudar o role dela.       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Novo Sistema ✅

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOVO SISTEMA                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   /me retorna:                                                  │
│   └─ permissions.global: string[]                               │
│   └─ permissions.by_store: { "1": [...], "2": [...] }           │
│   └─ screens.global: string[]                                   │
│   └─ screens.by_store: { "1": [...], "2": [...] }               │
│   └─ features: string[]                                         │
│   └─ menu: MenuItem[] (já filtrado!)                            │
│                                                                 │
│   Frontend:                                                     │
│   └─ Apenas CONSOME permissões do backend                       │
│   └─ Suporta granularidade total                                │
│   └─ Menu vem pronto do backend                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Comparativo

| Aspecto | Sistema Atual | Novo Sistema |
|---------|--------------|--------------|
| **Permissões** | Fixas por role no frontend | Dinâmicas do backend |
| **Override por usuário** | ❌ Impossível | ✅ Suportado |
| **Override por loja** | ❌ Impossível | ✅ Suportado |
| **Permissões temporárias** | ❌ Impossível | ✅ Suportado |
| **Menu** | Filtrado no frontend | Vem pronto do backend |
| **Complexidade frontend** | Alta | Baixa (só consome) |
| **Flexibilidade** | Baixa | Alta |

---

## Mudanças Necessárias no Backend /me

### Resposta Atual

```json
{
  "id": 1,
  "name": "Maria Silva",
  "email": "maria@loja.com",
  "is_super_admin": false,
  "has_fabrica_access": false,
  "stores": [
    { "id": 1, "name": "Loja Centro", "role": "vendedor" }
  ]
}
```

### Nova Resposta Proposta

```json
{
  "user": {
    "id": 1,
    "name": "Maria Silva",
    "email": "maria@loja.com",
    "avatar_url": "...",
    "is_super_admin": false,
    "has_fabrica_access": false,
    "stores": [
      { "id": 1, "name": "Loja Centro", "city": "Tijucas", "role": "vendedor" },
      { "id": 2, "name": "Loja Praia", "city": "Itapema", "role": "gerente" }
    ]
  },
  
  "permissions": {
    "global": [
      "dashboard:view",
      "sales:create",
      "sales:view",
      "pedidos.view",
      "pedidos.create",
      "capas.view",
      "capas.create"
    ],
    "by_store": {
      "2": [
        "reports:view",
        "caixa.approve",
        "pedidos.delete"
      ]
    }
  },
  
  "screens": {
    "global": [
      "screen.dashboard",
      "screen.pedidos",
      "screen.pedidos.list",
      "screen.pedidos.create",
      "screen.capas",
      "screen.capas.list",
      "screen.caixa",
      "screen.caixa.shift"
    ],
    "by_store": {
      "2": [
        "screen.reports",
        "screen.reports.sales",
        "screen.caixa.approve",
        "screen.gestao"
      ]
    }
  },
  
  "features": [
    "feature.whatsapp-notifications"
  ],
  
  "menu": [
    {
      "id": "dashboard",
      "label": "Dashboard",
      "icon": "LayoutDashboard",
      "path": "/",
      "screen": "screen.dashboard"
    },
    {
      "id": "pedidos",
      "label": "Pedidos",
      "icon": "FileCheck",
      "path": "/pedidos",
      "screen": "screen.pedidos"
    }
  ]
}
```

> [!IMPORTANT]
> O backend deve resolver TODAS as permissões (role + loja + usuário) e retornar o resultado final. O frontend não precisa saber a lógica de resolução.

---

## Evolução do AuthContext

### Novos Tipos

```typescript
// types/permissions.ts

export interface ResolvedPermissions {
  global: string[];
  by_store: Record<string, string[]>;
}

export interface ResolvedScreens {
  global: string[];
  by_store: Record<string, string[]>;
}

export interface MenuItemFromBackend {
  id: string;
  label: string;
  icon: string;  // Nome do ícone Lucide
  path: string;
  screen: string;
  children?: MenuItemFromBackend[];
}

export interface MeResponse {
  user: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
    is_super_admin: boolean;
    has_fabrica_access: boolean;
    stores: Array<{
      id: number;
      name: string;
      city?: string;
      role: string;
    }>;
  };
  permissions: ResolvedPermissions;
  screens: ResolvedScreens;
  features: string[];
  menu: MenuItemFromBackend[];
}
```

### AuthContext Atualizado

```typescript
// contexts/AuthContext.tsx

import React, { createContext, useContext, useCallback, useMemo, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser, useLogout, authKeys } from '@/hooks/api/use-auth';
import { initializeToken, setOnUnauthorized } from '@/lib/api';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import type { 
  UserWithStores, 
  UserRole,
  ResolvedPermissions,
  ResolvedScreens,
  MenuItemFromBackend 
} from '@/types/api';

interface AuthContextType {
  // Estado do usuário
  user: UserWithStores | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  
  // Loja atual
  currentStoreId: number | null;
  setCurrentStoreId: (id: number) => void;
  
  // Logout
  logout: () => void;
  
  // ========= NOVO: Permissões resolvidas =========
  permissions: ResolvedPermissions;
  screens: ResolvedScreens;
  features: string[];
  menu: MenuItemFromBackend[];
  
  // ========= NOVO: Verificações =========
  can: (permission: string, storeId?: number) => boolean;
  canAccessScreen: (screen: string, storeId?: number) => boolean;
  hasFeature: (feature: string) => boolean;
  
  // ========= LEGADO (manter para retrocompatibilidade) =========
  hasRole: (role: UserRole) => boolean;
  hasAccessToStore: (storeId: number) => boolean;
  highestRole: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentStoreId, setCurrentStoreId] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('currentStoreId');
    return saved ? parseInt(saved, 10) : null;
  });
  
  const { data, isLoading: isLoadingUser, isError } = useCurrentUser();
  const logoutMutation = useLogout();

  // Extrair dados da resposta do /me
  const user = data?.user ?? null;
  const permissions = data?.permissions ?? { global: [], by_store: {} };
  const screens = data?.screens ?? { global: [], by_store: {} };
  const features = data?.features ?? [];
  const menu = data?.menu ?? [];

  // Auto-select first store when user loads
  useEffect(() => {
    if (user?.stores?.length && !currentStoreId) {
      const firstStoreId = user.stores[0].id;
      setCurrentStoreId(firstStoreId);
      sessionStorage.setItem('currentStoreId', String(firstStoreId));
    }
  }, [user, currentStoreId]);

  // ========= NOVO: Verificar permissão (ability) =========
  const can = useCallback((permission: string, storeId?: number): boolean => {
    // Super admin pode tudo
    if (user?.is_super_admin) return true;
    
    // Verificar global
    if (permissions.global.includes(permission)) {
      return true;
    }
    
    // Verificar por loja
    const targetStoreId = storeId ?? currentStoreId;
    if (targetStoreId) {
      const storePerms = permissions.by_store[targetStoreId.toString()];
      if (storePerms?.includes(permission)) {
        return true;
      }
    }
    
    return false;
  }, [user?.is_super_admin, permissions, currentStoreId]);

  // ========= NOVO: Verificar screen (tela) =========
  const canAccessScreen = useCallback((screen: string, storeId?: number): boolean => {
    if (user?.is_super_admin) return true;
    
    if (screens.global.includes(screen)) {
      return true;
    }
    
    const targetStoreId = storeId ?? currentStoreId;
    if (targetStoreId) {
      const storeScreens = screens.by_store[targetStoreId.toString()];
      if (storeScreens?.includes(screen)) {
        return true;
      }
    }
    
    return false;
  }, [user?.is_super_admin, screens, currentStoreId]);

  // ========= NOVO: Verificar feature =========
  const hasFeature = useCallback((feature: string): boolean => {
    if (user?.is_super_admin) return true;
    return features.includes(feature);
  }, [user?.is_super_admin, features]);

  // ... resto do código existente (logout, hasRole, etc.)

  const value = useMemo<AuthContextType>(() => ({
    user,
    isLoading: !isInitialized || isLoadingUser,
    isAuthenticated: !!user && !isError,
    isSuperAdmin: user?.is_super_admin === true,
    currentStoreId,
    setCurrentStoreId: handleSetCurrentStoreId,
    logout: handleLogout,
    
    // NOVO
    permissions,
    screens,
    features,
    menu,
    can,
    canAccessScreen,
    hasFeature,
    
    // LEGADO
    hasRole: checkHasRole,
    hasAccessToStore: checkHasAccessToStore,
    highestRole: getHighestRole(user) as UserRole | null,
  }), [/* deps */]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

---

## Evolução do usePermissions

### Hook Atualizado

```typescript
// hooks/usePermissions.ts

import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Role, Permission } from '@/lib/permissions';

// Manter ROLE_PERMISSIONS para retrocompatibilidade durante migração
import { ROLE_PERMISSIONS, ROLE_HIERARCHY } from '@/lib/permissions';

interface UsePermissionsReturn {
  // Estado
  stores: StoreWithRole[];
  currentStore: StoreWithRole | null;
  currentRole: Role | null;
  isLoading: boolean;

  // Super Admin
  isSuperAdmin: boolean;
  canManageSuperAdmins: boolean;
  canAccessAllStores: boolean;

  // ========= NOVO: Verificações do backend =========
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;
  canAll: (permissions: string[]) => boolean;
  canAccessScreen: (screen: string) => boolean;
  hasFeature: (feature: string) => boolean;

  // ========= LEGADO: Manter para retrocompatibilidade =========
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasRole: (role: Role) => boolean;
  hasMinRole: (minRole: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;

  // Shortcuts
  isAdmin: boolean;
  isGerente: boolean;
  isConferente: boolean;
  isVendedor: boolean;

  // Store management
  setCurrentStore: (storeId: number) => void;
  getHighestRole: () => Role | null;
}

export function usePermissions(): UsePermissionsReturn {
  const { 
    user, 
    isLoading, 
    currentStoreId, 
    setCurrentStoreId, 
    isSuperAdmin,
    // NOVO
    can: authCan,
    canAccessScreen: authCanAccessScreen,
    hasFeature: authHasFeature,
  } = useAuth();

  // ========= NOVO: Wrappers para o novo sistema =========
  
  const can = useCallback((permission: string): boolean => {
    return authCan(permission);
  }, [authCan]);

  const canAny = useCallback((permissions: string[]): boolean => {
    return permissions.some(p => authCan(p));
  }, [authCan]);

  const canAll = useCallback((permissions: string[]): boolean => {
    return permissions.every(p => authCan(p));
  }, [authCan]);

  const canAccessScreen = useCallback((screen: string): boolean => {
    return authCanAccessScreen(screen);
  }, [authCanAccessScreen]);

  const hasFeature = useCallback((feature: string): boolean => {
    return authHasFeature(feature);
  }, [authHasFeature]);

  // ========= LEGADO: Manter comportamento atual =========
  
  const hasPermission = useCallback((permission: Permission): boolean => {
    // Primeiro tenta o novo sistema
    if (authCan(permission)) return true;
    
    // Fallback para o sistema antigo baseado em role
    if (isSuperAdmin) return true;
    if (!currentRole) return false;
    return ROLE_PERMISSIONS[currentRole].includes(permission);
  }, [authCan, isSuperAdmin, currentRole]);

  // ... resto do código existente

  return {
    // Estado
    stores,
    currentStore,
    currentRole,
    isLoading,
    
    // Super Admin
    isSuperAdmin,
    canManageSuperAdmins,
    canAccessAllStores,
    
    // NOVO
    can,
    canAny,
    canAll,
    canAccessScreen,
    hasFeature,
    
    // LEGADO
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasMinRole,
    hasAnyRole,
    
    // Shortcuts
    isAdmin,
    isGerente,
    isConferente,
    isVendedor,
    
    // Store management
    setCurrentStore,
    getHighestRole,
  };
}
```

---

## Sistema de Screens (Telas)

### Catálogo de Screens

Baseado no `menuConfig.ts` atual, aqui está o mapeamento de screens sugerido:

```typescript
// lib/permissions/screens.ts

/**
 * Catálogo de todas as screens (telas) do sistema
 * 
 * Convenção: screen.[módulo].[sub-tela]
 */
export const SCREEN_CATALOG = {
  // Principal
  dashboard: 'screen.dashboard',
  comunicados: 'screen.comunicados',
  
  // Vendas
  clientes: 'screen.clientes',
  pedidos: 'screen.pedidos',
  pedidosCreate: 'screen.pedidos.create',
  capas: 'screen.capas',
  capasCreate: 'screen.capas.create',
  capasProduction: 'screen.capas.production',
  
  // Faturamento (vendedor)
  extratoVendas: 'screen.faturamento.extrato',
  meusBonus: 'screen.faturamento.bonus',
  minhasComissoes: 'screen.faturamento.comissoes',
  
  // Conferência
  lancarTurno: 'screen.conferencia.lancar',
  divergencias: 'screen.conferencia.divergencias',
  historicoEnvelopes: 'screen.conferencia.historico',
  
  // Gestão
  rankingVendas: 'screen.gestao.ranking',
  desempenhoLojas: 'screen.gestao.lojas',
  quebraCaixa: 'screen.gestao.quebra',
  kpisColaboradores: 'screen.gestao.kpis',
  
  // Configurações
  metasMensais: 'screen.config.metas',
  tabelaBonus: 'screen.config.bonus',
  regrasComissao: 'screen.config.comissoes',
  usuariosLojas: 'screen.config.usuarios',
  gerenciarComunicados: 'screen.config.comunicados',
  
  // Admin
  auditLogs: 'screen.admin.logs',
  phoneCatalog: 'screen.admin.catalogo',
  whatsappInstances: 'screen.admin.whatsapp',
  paymentMethods: 'screen.admin.payment-methods',
  
  // Fábrica
  fabricaPedidos: 'screen.fabrica.pedidos',
} as const;

export type Screen = typeof SCREEN_CATALOG[keyof typeof SCREEN_CATALOG];
```

### Uso no menuConfig

```typescript
// lib/config/menuConfig.ts (atualizado)

import { SCREEN_CATALOG } from '@/lib/permissions/screens';

export const menuSections: MenuSection[] = [
  {
    id: 'principal',
    title: 'Principal',
    screen: SCREEN_CATALOG.dashboard, // NOVO: screen da seção
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/',
        screen: SCREEN_CATALOG.dashboard, // NOVO
        permissions: ['dashboard:view'],  // LEGADO (manter durante migração)
      },
    ],
  },
  // ...
];
```

---

## Migração do Menu

### Opção 1: Menu do Backend (Recomendado) ✅

O backend retorna o menu já filtrado. O frontend apenas renderiza.

```typescript
// hooks/useFilteredMenu.ts (NOVO - simplificado)

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { MenuItemFromBackend } from '@/types/api';
import { iconMap } from '@/lib/icons';

export interface MenuSection {
  id: string;
  title: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  children?: MenuItem[];
}

export function useFilteredMenu() {
  const { menu, isLoading } = useAuth();

  const processedMenu = useMemo(() => {
    if (!menu?.length) return [];
    
    // Agrupar por seção (primeira parte do path)
    // ou simplesmente mapear os itens do backend
    return menu.map(item => ({
      ...item,
      icon: iconMap[item.icon] || LayoutDashboard, // Mapear string para componente
    }));
  }, [menu]);

  return { menu: processedMenu, isLoading };
}

// lib/icons.ts - Mapeamento de strings para componentes
import { 
  LayoutDashboard, 
  FileCheck, 
  Users, 
  Palette,
  // ... outros
} from 'lucide-react';

export const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileCheck,
  Users,
  Palette,
  // ...
};
```

### Opção 2: Híbrido (Durante Migração)

Usa o novo sistema de screens mas mantém a config no frontend.

```typescript
// hooks/useFilteredMenu.ts (híbrido)

import { useMemo } from 'react';
import { usePermissions } from './usePermissions';
import { menuSections, filterMenuSections } from '@/lib/config/menuConfig';

export function useFilteredMenu() {
  const { 
    hasPermission, 
    hasRole, 
    hasMinRole, 
    isLoading, 
    isSuperAdmin,
    canAccessScreen,  // NOVO
  } = usePermissions();

  const menu = useMemo(() => {
    if (isLoading) return [];
    
    // Primeiro filtrar por screen (novo sistema)
    // Depois filtrar por permission/role (legado)
    return filterMenuSections(
      menuSections, 
      hasPermission, 
      hasRole, 
      hasMinRole, 
      isSuperAdmin,
      canAccessScreen  // NOVO parâmetro
    );
  }, [hasPermission, hasRole, hasMinRole, isLoading, isSuperAdmin, canAccessScreen]);

  return { menu, isLoading };
}
```

---

## Componente PermissionGate

### Componente Condicional

```typescript
// components/permissions/PermissionGate.tsx

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  children: ReactNode;
  
  // Novo sistema (preferencial)
  permission?: string;
  permissions?: string[];
  screen?: string;
  feature?: string;
  
  // Legado (manter para retrocompatibilidade)
  legacyPermission?: Permission;
  role?: Role;
  minRole?: Role;
  
  // Comportamento
  requireAll?: boolean;
  fallback?: ReactNode;
  
  // Loja específica
  storeId?: number;
}

export function PermissionGate({
  children,
  permission,
  permissions,
  screen,
  feature,
  legacyPermission,
  role,
  minRole,
  requireAll = false,
  fallback = null,
  storeId,
}: PermissionGateProps) {
  const { 
    can, 
    canAny, 
    canAll,
    canAccessScreen, 
    hasFeature,
    hasPermission,
    hasRole,
    hasMinRole,
    isSuperAdmin,
  } = usePermissions();

  // Super admin vê tudo
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  let isAuthorized = true;

  // ========= NOVO SISTEMA =========
  
  // Verificar screen
  if (screen && isAuthorized) {
    isAuthorized = canAccessScreen(screen);
  }

  // Verificar permission única
  if (permission && isAuthorized) {
    isAuthorized = can(permission);
  }

  // Verificar múltiplas permissions
  if (permissions?.length && isAuthorized) {
    isAuthorized = requireAll ? canAll(permissions) : canAny(permissions);
  }

  // Verificar feature
  if (feature && isAuthorized) {
    isAuthorized = hasFeature(feature);
  }

  // ========= SISTEMA LEGADO =========

  if (legacyPermission && isAuthorized) {
    isAuthorized = hasPermission(legacyPermission);
  }

  if (role && isAuthorized) {
    isAuthorized = hasRole(role);
  }

  if (minRole && isAuthorized) {
    isAuthorized = hasMinRole(minRole);
  }

  return isAuthorized ? <>{children}</> : <>{fallback}</>;
}
```

### Exemplos de Uso

```tsx
// Novo sistema (preferencial)
<PermissionGate permission="pedidos.delete">
  <Button variant="destructive">Excluir</Button>
</PermissionGate>

<PermissionGate screen="screen.reports">
  <ReportsSection />
</PermissionGate>

<PermissionGate feature="feature.export-excel">
  <Button>Exportar Excel</Button>
</PermissionGate>

// Múltiplas permissões (OR)
<PermissionGate permissions={["pedidos.update", "pedidos.delete"]}>
  <ActionButtons />
</PermissionGate>

// Múltiplas permissões (AND)
<PermissionGate permissions={["pedidos.update", "pedidos.status.update"]} requireAll>
  <StatusEditor />
</PermissionGate>

// Sistema legado (durante migração)
<PermissionGate legacyPermission="sales:view">
  <SalesTable />
</PermissionGate>

<PermissionGate minRole="gerente">
  <ManagerActions />
</PermissionGate>

// Com fallback
<PermissionGate 
  permission="pedidos.delete" 
  fallback={<DisabledButton />}
>
  <Button>Excluir</Button>
</PermissionGate>
```

---

## Proteção de Rotas

### ProtectedRoute Atualizado

```typescript
// components/auth/ProtectedRoute.tsx

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permission, Role } from '@/lib/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  
  // Novo sistema
  screen?: string;
  permission?: string;
  feature?: string;
  
  // Legado
  permissions?: Permission[];
  requiredRole?: Role;
  minRole?: Role;
  
  // Comportamento
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  screen,
  permission,
  feature,
  permissions,
  requiredRole,
  minRole,
  redirectTo = '/unauthorized',
  fallback,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, isSuperAdmin } = useAuth();
  const { 
    canAccessScreen, 
    can, 
    hasFeature,
    hasAnyPermission, 
    hasRole, 
    hasMinRole 
  } = usePermissions();

  // Loading
  if (isLoading) {
    return fallback || <LoadingSpinner />;
  }

  // Não autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Super admin passa direto
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  let isAuthorized = true;

  // NOVO: Verificar screen
  if (screen && isAuthorized) {
    isAuthorized = canAccessScreen(screen);
  }

  // NOVO: Verificar permission
  if (permission && isAuthorized) {
    isAuthorized = can(permission);
  }

  // NOVO: Verificar feature
  if (feature && isAuthorized) {
    isAuthorized = hasFeature(feature);
  }

  // LEGADO: Verificar permissions
  if (permissions?.length && isAuthorized) {
    isAuthorized = hasAnyPermission(permissions);
  }

  // LEGADO: Verificar role
  if (requiredRole && isAuthorized) {
    isAuthorized = hasRole(requiredRole);
  }

  // LEGADO: Verificar minRole
  if (minRole && isAuthorized) {
    isAuthorized = hasMinRole(minRole);
  }

  if (!isAuthorized) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

### Configuração de Rotas

```typescript
// App.tsx (atualizado)

import { SCREEN_CATALOG } from '@/lib/permissions/screens';

// Definição centralizada de rotas
const routes = [
  // Públicas
  { path: '/login', element: <Login />, public: true },
  
  // Dashboard - todos
  { 
    path: '/', 
    element: <Dashboard />, 
    screen: SCREEN_CATALOG.dashboard 
  },
  
  // Pedidos
  { 
    path: '/pedidos', 
    element: <PedidosList />, 
    screen: SCREEN_CATALOG.pedidos 
  },
  { 
    path: '/pedidos/:id', 
    element: <PedidoDetail />, 
    screen: SCREEN_CATALOG.pedidos 
  },
  
  // Capas
  { 
    path: '/capas', 
    element: <CapasList />, 
    screen: SCREEN_CATALOG.capas 
  },
  
  // Relatórios - precisa de screen específica
  { 
    path: '/gestao/ranking', 
    element: <RankingPage />, 
    screen: SCREEN_CATALOG.rankingVendas 
  },
  
  // Admin - precisa de screen admin
  { 
    path: '/config/usuarios', 
    element: <UsersPage />, 
    screen: SCREEN_CATALOG.usuariosLojas 
  },
  { 
    path: '/config/whatsapp', 
    element: <WhatsAppInstances />, 
    screen: SCREEN_CATALOG.whatsappInstances 
  },
];

// No Router
{routes.map(route => (
  route.public ? (
    <Route key={route.path} path={route.path} element={route.element} />
  ) : (
    <Route
      key={route.path}
      path={route.path}
      element={
        <ProtectedRoute screen={route.screen}>
          {route.element}
        </ProtectedRoute>
      }
    />
  )
))}
```

---

## Plano de Migração

### Fase 1: Preparação (Sem Breaking Changes)

1. **Atualizar tipos** para aceitar nova resposta do `/me`
2. **Adicionar novos métodos** ao AuthContext (`can`, `canAccessScreen`, `hasFeature`)
3. **Atualizar usePermissions** com novos métodos (mantendo legado)
4. **Criar catálogo de screens**

```
Status: Retrocompatível ✅
Frontend aceita formato antigo e novo do /me
```

### Fase 2: Migração Gradual

1. **Adicionar screens** ao menuConfig
2. **Criar PermissionGate** componente
3. **Atualizar rotas críticas** para usar screens
4. **Migrar componentes** gradualmente

```
Status: Híbrido ⚠️
Alguns componentes usam novo sistema, outros ainda usam legado
```

### Fase 3: Finalização

1. **Backend envia menu filtrado** no `/me`
2. **Remover filterMenuSections** do frontend
3. **Remover ROLE_PERMISSIONS** hardcoded
4. **Deprecar métodos legados**

```
Status: Novo sistema completo ✅
Frontend apenas consome permissões do backend
```

### Checklist de Migração

```
[ ] Fase 1: Preparação
    [ ] Atualizar types/api.ts com novos tipos
    [ ] Adicionar can/canAccessScreen/hasFeature ao AuthContext
    [ ] Atualizar usePermissions com novos métodos
    [ ] Criar lib/permissions/screens.ts
    
[ ] Fase 2: Migração
    [ ] Adicionar screen a cada item do menuConfig
    [ ] Criar PermissionGate componente  
    [ ] Atualizar ProtectedRoute
    [ ] Migrar rotas para usar screen
    [ ] Migrar botões críticos para usar PermissionGate
    
[ ] Fase 3: Finalização
    [ ] Backend retorna menu no /me
    [ ] Simplificar useFilteredMenu
    [ ] Remover ROLE_PERMISSIONS hardcoded
    [ ] Remover métodos legados após 2 releases
```

---

## Resumo de Sugestões

| Área | Sugestão |
|------|----------|
| **Backend** | Retornar `permissions`, `screens`, `features` e `menu` no `/me` |
| **AuthContext** | Adicionar `can()`, `canAccessScreen()`, `hasFeature()` |
| **usePermissions** | Manter retrocompatibilidade durante migração |
| **Menu** | Migrar para menu pré-filtrado do backend |
| **Rotas** | Proteger por `screen` ao invés de `permissions` |
| **Componentes** | Usar `PermissionGate` para elementos condicionais |
| **Botões** | Usar `can()` para abilities específicas |

---

*Documento atualizado baseado na stack real do projeto MaisCapinhas.*
