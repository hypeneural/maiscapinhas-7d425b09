/**
 * Usuários & Lojas Page (Refactored)
 * 
 * Modern CRUD interface for managing users and stores.
 * Uses real API integration via React Query hooks.
 */

import React, { useState } from 'react';
import { Users, Store, Plus, Pencil, Trash2, UserPlus, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, FormDialog, ConfirmDialog, ImageUpload, type Column, type RowAction } from '@/components/crud';
import {
  useAdminUsers,
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
  useReactivateUser,
  useUploadAvatar,
  useRemoveAvatar,
} from '@/hooks/api/use-admin-users';
import {
  useAdminStores,
  useCreateStore,
  useUpdateStore,
  useDeactivateStore,
  useStoreUsers,
  useAddUserToStore,
  useUpdateUserRole,
  useRemoveUserFromStore,
  useUploadStorePhoto,
} from '@/hooks/api/use-admin-stores';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { AdminUserResponse, AdminStoreResponse, CreateUserRequest, CreateStoreRequest, StoreUserBinding } from '@/types/admin.types';
import type { UserRole } from '@/types/api';

// ============================================================
// Constants
// ============================================================

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  conferente: 'Conferente',
  vendedor: 'Vendedor',
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-500/10 text-red-600 border-red-500/20',
  gerente: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  conferente: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  vendedor: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

// ============================================================
// Users Tab Component
// ============================================================

function UsersTab() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserResponse | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUserResponse | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    active: true,
  });

  // Queries and mutations
  const { data: usersData, isLoading } = useAdminUsers({ search, page, per_page: 25 });
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deactivateMutation = useDeactivateUser();
  const reactivateMutation = useReactivateUser();
  const uploadAvatarMutation = useUploadAvatar();
  const removeAvatarMutation = useRemoveAvatar();

  // Table columns
  const columns: Column<AdminUserResponse>[] = [
    {
      key: 'name',
      label: 'Usuário',
      render: (_, user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.stores?.[0]?.store_name} />
            <AvatarFallback className={cn(
              'text-sm font-medium',
              user.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'stores',
      label: 'Lojas / Roles',
      render: (_, user) => (
        <div className="flex flex-wrap gap-1">
          {user.stores?.length > 0 ? (
            user.stores.slice(0, 3).map((s) => (
              <Badge
                key={s.store_id}
                variant="outline"
                className={cn('text-xs', ROLE_COLORS[s.role])}
              >
                {s.store_name.split(' ').slice(-1)[0]} • {ROLE_LABELS[s.role]}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-xs">Sem lojas</span>
          )}
          {user.stores?.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{user.stores.length - 3}
            </Badge>
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

  // Row actions
  const getRowActions = (user: AdminUserResponse): RowAction<AdminUserResponse>[] => [
    {
      label: 'Editar',
      icon: <Pencil className="h-4 w-4" />,
      onClick: (u) => handleEdit(u),
    },
    {
      label: user.active ? 'Desativar' : 'Reativar',
      icon: user.active ? <Trash2 className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />,
      onClick: (u) => user.active ? setConfirmDelete(u) : handleReactivate(u),
      variant: user.active ? 'destructive' : 'default',
      separator: true,
      disabled: (row) => row.id === currentUser?.id, // Can't deactivate yourself
    },
  ];

  // Handlers
  const handleEdit = (user: AdminUserResponse) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      active: user.active,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', active: true });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingUser) {
      await updateMutation.mutateAsync({
        id: editingUser.id,
        data: {
          name: form.name,
          email: form.email,
          password: form.password || undefined,
          active: form.active,
        },
      });
    } else {
      await createMutation.mutateAsync({
        name: form.name,
        email: form.email,
        password: form.password,
        active: form.active,
      });
    }
    setIsDialogOpen(false);
  };

  const handleDeactivate = async () => {
    if (confirmDelete) {
      await deactivateMutation.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const handleReactivate = async (user: AdminUserResponse) => {
    await reactivateMutation.mutateAsync(user.id);
  };

  const handleAvatarUpload = async (file: File) => {
    if (editingUser) {
      await uploadAvatarMutation.mutateAsync({ id: editingUser.id, file });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div /> {/* Spacer */}
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

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

      {/* Create/Edit Dialog */}
      <FormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        isEdit={!!editingUser}
        size="md"
      >
        {editingUser && (
          <div className="flex justify-center mb-4">
            <ImageUpload
              variant="circle"
              size="lg"
              loading={uploadAvatarMutation.isPending}
              onChange={handleAvatarUpload}
              onRemove={() => removeAvatarMutation.mutate(editingUser.id)}
              maxSize={2 * 1024 * 1024}
              minDimension={{ width: 200, height: 200 }}
            />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label>Nome Completo *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="João Silva Santos"
            />
          </div>

          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="joao@maiscapinhas.com.br"
            />
          </div>

          <div>
            <Label>{editingUser ? 'Nova Senha (opcional)' : 'Senha *'}</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder={editingUser ? 'Deixe em branco para manter' : 'Mínimo 8 caracteres'}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label className="text-base">Usuário Ativo</Label>
              <p className="text-sm text-muted-foreground">Pode acessar o sistema</p>
            </div>
            <Switch
              checked={form.active}
              onCheckedChange={(checked) => setForm(f => ({ ...f, active: checked }))}
            />
          </div>
        </div>
      </FormDialog>

      {/* Confirm Deactivate Dialog */}
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
    </div>
  );
}

// ============================================================
// Stores Tab Component
// ============================================================

function StoresTab() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<AdminStoreResponse | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminStoreResponse | null>(null);
  const [selectedStoreForUsers, setSelectedStoreForUsers] = useState<AdminStoreResponse | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    city: '',
    active: true,
  });

  // Queries and mutations
  const { data: storesData, isLoading } = useAdminStores({ search, page, per_page: 25 });
  const createMutation = useCreateStore();
  const updateMutation = useUpdateStore();
  const deactivateMutation = useDeactivateStore();
  const uploadPhotoMutation = useUploadStorePhoto();

  // Table columns
  const columns: Column<AdminStoreResponse>[] = [
    {
      key: 'name',
      label: 'Loja',
      render: (_, store) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            store.active ? 'bg-primary/10' : 'bg-muted'
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
      key: 'users_count',
      label: 'Usuários',
      render: (value) => (
        <Badge variant="outline">
          {(value as number) || 0} usuários
        </Badge>
      ),
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

  // Row actions
  const getRowActions = (store: AdminStoreResponse): RowAction<AdminStoreResponse>[] => [
    {
      label: 'Editar',
      icon: <Pencil className="h-4 w-4" />,
      onClick: (s) => handleEdit(s),
    },
    {
      label: 'Gerenciar Usuários',
      icon: <Users className="h-4 w-4" />,
      onClick: (s) => setSelectedStoreForUsers(s),
      separator: true,
    },
    {
      label: store.active ? 'Desativar' : 'Reativar',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (s) => setConfirmDelete(s),
      variant: store.active ? 'destructive' : 'default',
      separator: true,
    },
  ];

  // Handlers
  const handleEdit = (store: AdminStoreResponse) => {
    setEditingStore(store);
    setForm({
      name: store.name,
      city: store.city,
      active: store.active,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingStore(null);
    setForm({ name: '', city: '', active: true });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingStore) {
      await updateMutation.mutateAsync({
        id: editingStore.id,
        data: form,
      });
    } else {
      await createMutation.mutateAsync(form);
    }
    setIsDialogOpen(false);
  };

  const handleDeactivate = async () => {
    if (confirmDelete) {
      await deactivateMutation.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div /> {/* Spacer */}
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Loja
        </Button>
      </div>

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

      {/* Create/Edit Dialog */}
      <FormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingStore ? 'Editar Loja' : 'Nova Loja'}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        isEdit={!!editingStore}
        size="md"
      >
        {editingStore && (
          <div className="flex justify-center mb-4">
            <ImageUpload
              variant="rectangle"
              size="lg"
              loading={uploadPhotoMutation.isPending}
              onChange={(file) => uploadPhotoMutation.mutate({ id: editingStore.id, file })}
              maxSize={5 * 1024 * 1024}
              minDimension={{ width: 800, height: 600 }}
              placeholder="Foto da loja"
            />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label>Nome da Loja *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Mais Capinhas Shopping Center"
            />
          </div>

          <div>
            <Label>Cidade *</Label>
            <Input
              value={form.city}
              onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
              placeholder="Tijucas"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label className="text-base">Loja Ativa</Label>
              <p className="text-sm text-muted-foreground">Aparece nas opções do sistema</p>
            </div>
            <Switch
              checked={form.active}
              onCheckedChange={(checked) => setForm(f => ({ ...f, active: checked }))}
            />
          </div>
        </div>
      </FormDialog>

      {/* Store Users Management Dialog */}
      {selectedStoreForUsers && (
        <StoreUsersDialog
          store={selectedStoreForUsers}
          onClose={() => setSelectedStoreForUsers(null)}
        />
      )}

      {/* Confirm Deactivate Dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        title="Desativar Loja"
        description={
          <p>
            Tem certeza que deseja desativar <strong>{confirmDelete?.name}</strong>?
            <br />
            <span className="text-muted-foreground text-sm">
              Os dados da loja serão mantidos, mas ela não aparecerá nas opções.
            </span>
          </p>
        }
        confirmText="Desativar"
        onConfirm={handleDeactivate}
        loading={deactivateMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}

// ============================================================
// Store Users Dialog Component
// ============================================================

interface StoreUsersDialogProps {
  store: AdminStoreResponse;
  onClose: () => void;
}

function StoreUsersDialog({ store, onClose }: StoreUsersDialogProps) {
  const { user: currentUser } = useAuth();
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('vendedor');
  const [confirmRemove, setConfirmRemove] = useState<StoreUserBinding | null>(null);

  const { data: storeUsers, isLoading } = useStoreUsers(store.id);
  const { data: allUsers } = useAdminUsers({ per_page: 100 });
  const addUserMutation = useAddUserToStore();
  const updateRoleMutation = useUpdateUserRole();
  const removeUserMutation = useRemoveUserFromStore();

  // Get users not already in this store
  const availableUsers = allUsers?.data.filter(
    u => !storeUsers?.some(su => su.user_id === u.id)
  ) || [];

  const handleAddUser = async () => {
    if (!newUserId) return;
    await addUserMutation.mutateAsync({
      storeId: store.id,
      data: { user_id: parseInt(newUserId), role: newUserRole },
    });
    setIsAddingUser(false);
    setNewUserId('');
    setNewUserRole('vendedor');
  };

  const handleUpdateRole = async (userId: number, role: UserRole) => {
    await updateRoleMutation.mutateAsync({
      storeId: store.id,
      userId,
      data: { role },
    });
  };

  const handleRemoveUser = async () => {
    if (!confirmRemove) return;
    await removeUserMutation.mutateAsync({
      storeId: store.id,
      userId: confirmRemove.user_id,
    });
    setConfirmRemove(null);
  };

  return (
    <>
      <FormDialog
        open={true}
        onOpenChange={onClose}
        title={`Usuários - ${store.name}`}
        onSubmit={(e) => { e.preventDefault(); onClose(); }}
        submitText="Fechar"
        size="lg"
      >
        <div className="space-y-4">
          {/* Add User Section */}
          {isAddingUser ? (
            <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Usuário</Label>
                  <Select value={newUserId} onValueChange={setNewUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map(u => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as UserRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_LABELS).map(([role, label]) => (
                        <SelectItem key={role} value={role}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddUser} disabled={addUserMutation.isPending}>
                  Adicionar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsAddingUser(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setIsAddingUser(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Usuário
            </Button>
          )}

          {/* Users List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : storeUsers?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário vinculado a esta loja.
              </div>
            ) : (
              storeUsers?.map((binding) => (
                <div
                  key={binding.user_id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>
                        {binding.user_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{binding.user_name}</p>
                      <p className="text-xs text-muted-foreground">{binding.user_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={binding.role}
                      onValueChange={(v) => handleUpdateRole(binding.user_id, v as UserRole)}
                      disabled={updateRoleMutation.isPending}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([role, label]) => (
                          <SelectItem key={role} value={role}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmRemove(binding)}
                      disabled={binding.user_id === currentUser?.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </FormDialog>

      {/* Confirm Remove Dialog */}
      <ConfirmDialog
        open={!!confirmRemove}
        onOpenChange={() => setConfirmRemove(null)}
        title="Remover Usuário"
        description={`Remover ${confirmRemove?.user_name} de ${store.name}?`}
        confirmText="Remover"
        onConfirm={handleRemoveUser}
        loading={removeUserMutation.isPending}
        variant="destructive"
      />
    </>
  );
}

// ============================================================
// Main Component
// ============================================================

const UsuariosLojas: React.FC = () => {
  const [activeTab, setActiveTab] = useState('usuarios');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Usuários & Lojas"
        description="Gerencie os usuários do sistema e as unidades da rede"
        icon={Users}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="lojas" className="gap-2">
            <Store className="w-4 h-4" />
            Lojas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="mt-0">
          <UsersTab />
        </TabsContent>

        <TabsContent value="lojas" className="mt-0">
          <StoresTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UsuariosLojas;
