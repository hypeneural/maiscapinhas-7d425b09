/**
 * Usuários & Lojas Page
 * 
 * Modern CRUD interface for managing users and stores.
 * Uses navigation to dedicated form pages for better UX.
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Store, Plus, Pencil, Trash2, UserPlus, Crown, Factory, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, ConfirmDialog, type Column, type RowAction } from '@/components/crud';
import { AddStoresToUserModal } from '@/components/admin/AddStoresToUserModal';
import { AddUsersToStoreModal } from '@/components/admin/AddUsersToStoreModal';
import { ViewLinkedStoresModal } from '@/components/admin/ViewLinkedStoresModal';
import { ViewLinkedUsersModal } from '@/components/admin/ViewLinkedUsersModal';
import {
  useAdminUsers,
  useDeactivateUser,
  useReactivateUser,
} from '@/hooks/api/use-admin-users';
import {
  useAdminStores,
  useDeactivateStore,
} from '@/hooks/api/use-admin-stores';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { AdminUserResponse, AdminStoreResponse, AdminListFilters, GlobalRole } from '@/types/admin.types';
import type { UserRole } from '@/types/api';

// ============================================================
// Constants
// ============================================================

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  conferente: 'Conferente',
  vendedor: 'Vendedor',
  fabrica: 'Fábrica',
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-500/10 text-red-600 border-red-500/20',
  gerente: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  conferente: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  vendedor: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  fabrica: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

const SUPER_ADMIN_COLOR = 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500/30';

// ============================================================
// Users Tab Component
// ============================================================

function UsersTab() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<AdminUserResponse | null>(null);

  // Modal state for quick linking
  const [selectedUserForStores, setSelectedUserForStores] = useState<AdminUserResponse | null>(null);

  // Advanced filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'fabrica' | 'super_admin'>('all');
  const [storesFilter, setStoresFilter] = useState<'all' | 'with_stores' | 'without_stores'>('all');

  // Build filters object
  const filters: AdminListFilters = {
    search,
    page,
    per_page: 25,
    ...(statusFilter !== 'all' && { active: statusFilter === 'active' }),
    ...(roleFilter === 'fabrica' && { role: 'fabrica' as GlobalRole }),
    ...(storesFilter !== 'all' && { has_stores: storesFilter === 'with_stores' }),
  };

  const { data: usersData, isLoading } = useAdminUsers(filters);
  const deactivateMutation = useDeactivateUser();
  const reactivateMutation = useReactivateUser();

  const columns: Column<AdminUserResponse>[] = [
    {
      key: 'name',
      label: 'Usuário',
      render: (_, user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className={cn(
              'text-sm font-medium',
              user.is_super_admin
                ? 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700'
                : 'bg-gradient-to-br from-primary/20 to-primary/5'
            )}>
              {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{user.name}</p>
              {user.is_super_admin && (
                <Crown className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'stores',
      label: 'Vínculos',
      render: (_, user) => (
        <div className="flex flex-wrap gap-1">
          {user.is_super_admin ? (
            <Badge className={SUPER_ADMIN_COLOR}>Super Admin</Badge>
          ) : (
            <>
              {/* Fabrica badge if user has fabrica access */}
              {user.has_fabrica_access && (
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 gap-1">
                  <Factory className="h-3 w-3" />
                  Fábrica
                </Badge>
              )}
              {/* Store badges */}
              {user.stores.length > 0 ? (
                user.stores.slice(0, user.has_fabrica_access ? 1 : 2).map((s, i) => (
                  <Badge key={i} variant="outline" className={ROLE_COLORS[s.role]}>
                    {s.store_name.length > 12 ? s.store_name.slice(0, 12) + '...' : s.store_name}
                  </Badge>
                ))
              ) : !user.has_fabrica_access && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-muted-foreground hover:text-primary gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserForStores(user);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        Vincular lojas
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adicionar este usuário a uma ou mais lojas</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {user.stores.length > (user.has_fabrica_access ? 1 : 2) && (
                <Badge variant="secondary">+{user.stores.length - (user.has_fabrica_access ? 1 : 2)}</Badge>
              )}
            </>
          )}
        </div>
      ),
    },
    {
      key: 'active',
      label: 'Status',
      render: (value) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  const getRowActions = (user: AdminUserResponse): RowAction<AdminUserResponse>[] => [
    {
      label: 'Editar',
      icon: <Pencil className="h-4 w-4" />,
      onClick: (u) => navigate(`/config/usuarios/${u.id}`),
    },
    {
      label: user.active ? 'Desativar' : 'Reativar',
      icon: user.active ? <Trash2 className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />,
      onClick: (u) => user.active ? setConfirmDelete(u) : handleReactivate(u),
      variant: user.active ? 'destructive' : 'default',
      separator: true,
      disabled: (row) => row.id === currentUser?.id,
    },
  ];

  const handleDeactivate = async () => {
    if (confirmDelete) {
      await deactivateMutation.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const handleReactivate = async (user: AdminUserResponse) => {
    await reactivateMutation.mutateAsync(user.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        {/* Advanced Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(v: 'all' | 'active' | 'inactive') => setStatusFilter(v)}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={(v: 'all' | 'fabrica' | 'super_admin') => setRoleFilter(v)}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="fabrica">Fábrica</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={storesFilter} onValueChange={(v: 'all' | 'with_stores' | 'without_stores') => setStoresFilter(v)}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="Lojas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="with_stores">Com lojas</SelectItem>
              <SelectItem value="without_stores">Sem lojas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => navigate('/config/usuarios/novo')} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Lista de Usuários
          </CardTitle>
          <CardDescription>
            {usersData?.meta?.total || 0} usuários cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={usersData?.data || []}
            columns={columns}
            loading={isLoading}
            getRowKey={(u) => u.id}
            onSearch={setSearch}
            searchPlaceholder="Buscar por nome ou email..."
            pagination={usersData?.meta}
            onPageChange={setPage}
            actions={getRowActions}
            emptyMessage="Nenhum usuário encontrado"
            emptyIcon={<Users className="h-12 w-12 text-muted-foreground" />}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        title="Desativar Usuário"
        description={
          <p>
            Tem certeza que deseja desativar <strong>{confirmDelete?.name}</strong>?
            <br />
            <span className="text-muted-foreground text-sm">
              O usuário perderá acesso ao sistema, mas seus dados serão mantidos.
            </span>
          </p>
        }
        confirmText="Desativar"
        onConfirm={handleDeactivate}
        loading={deactivateMutation.isPending}
        variant="destructive"
      />

      {/* Quick Add Stores Modal */}
      {selectedUserForStores && (
        <AddStoresToUserModal
          userId={selectedUserForStores.id}
          userName={selectedUserForStores.name}
          existingStores={selectedUserForStores.stores}
          open={!!selectedUserForStores}
          onOpenChange={(open) => !open && setSelectedUserForStores(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// Stores Tab Component
// ============================================================

function StoresTab() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<AdminStoreResponse | null>(null);

  // Modal state for quick linking
  const [selectedStoreForUsers, setSelectedStoreForUsers] = useState<AdminStoreResponse | null>(null);

  const { data: storesData, isLoading } = useAdminStores({ search, page, per_page: 25 });
  const deactivateMutation = useDeactivateStore();

  const columns: Column<AdminStoreResponse>[] = [
    {
      key: 'name',
      label: 'Loja',
      render: (_, store) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2.5 rounded-lg',
            store.active ? 'bg-gradient-to-br from-primary/20 to-primary/5' : 'bg-muted'
          )}>
            <Store className={cn(
              'h-5 w-5',
              store.active ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          <div>
            <p className="font-medium">{store.name}</p>
            <p className="text-xs text-muted-foreground">{store.city}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'codigo',
      label: 'Código',
      render: (value) => value ? (
        <Badge variant="outline" className="font-mono">{value as string}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: 'users_count',
      label: 'Usuários',
      render: (value, store) => {
        const count = (value as number) || 0;
        return count > 0 ? (
          <Badge variant="secondary">
            {count} usuários
          </Badge>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-muted-foreground hover:text-primary gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStoreForUsers(store);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Vincular usuários
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Adicionar usuários a esta loja</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      key: 'active',
      label: 'Status',
      render: (value) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Ativa' : 'Inativa'}
        </Badge>
      ),
    },
  ];

  const getRowActions = (store: AdminStoreResponse): RowAction<AdminStoreResponse>[] => [
    {
      label: 'Editar',
      icon: <Pencil className="h-4 w-4" />,
      onClick: (s) => navigate(`/config/lojas/${s.id}`),
    },
    {
      label: store.active ? 'Desativar' : 'Reativar',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (s) => setConfirmDelete(s),
      variant: store.active ? 'destructive' : 'default',
      separator: true,
    },
  ];

  const handleDeactivate = async () => {
    if (confirmDelete) {
      await deactivateMutation.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div />
        <Button onClick={() => navigate('/config/lojas/novo')} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Loja
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Lista de Lojas
          </CardTitle>
          <CardDescription>
            {storesData?.meta?.total || 0} lojas cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={storesData?.data || []}
            columns={columns}
            loading={isLoading}
            getRowKey={(s) => s.id}
            onSearch={setSearch}
            searchPlaceholder="Buscar por nome ou cidade..."
            pagination={storesData?.meta}
            onPageChange={setPage}
            actions={getRowActions}
            emptyMessage="Nenhuma loja encontrada"
            emptyIcon={<Store className="h-12 w-12 text-muted-foreground" />}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        title="Desativar Loja"
        description={
          <p>
            Tem certeza que deseja desativar <strong>{confirmDelete?.name}</strong>?
            <br />
            <span className="text-muted-foreground text-sm">
              A loja não será excluída, apenas desativada.
            </span>
          </p>
        }
        confirmText="Desativar"
        onConfirm={handleDeactivate}
        loading={deactivateMutation.isPending}
        variant="destructive"
      />

      {/* Quick Add Users Modal */}
      {selectedStoreForUsers && (
        <AddUsersToStoreModal
          storeId={selectedStoreForUsers.id}
          storeName={selectedStoreForUsers.name}
          existingUserIds={selectedStoreForUsers.users?.map(u => u.user_id) || []}
          open={!!selectedStoreForUsers}
          onOpenChange={(open) => !open && setSelectedStoreForUsers(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================

const UsuariosLojas: React.FC = () => {
  const location = useLocation();
  const defaultTab = location.pathname.includes('/lojas') ? 'lojas' : 'usuarios';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Usuários & Lojas"
        description="Gerencie usuários do sistema e configurações das lojas"
        icon={Users}
      />

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="lojas" className="gap-2">
            <Store className="h-4 w-4" />
            Lojas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <UsersTab />
        </TabsContent>

        <TabsContent value="lojas">
          <StoresTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UsuariosLojas;
