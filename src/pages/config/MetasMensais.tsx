/**
 * Metas Mensais Page (Refactored)
 * 
 * Modern interface for managing monthly goals and sales splits.
 * Uses real API integration via React Query hooks.
 */

import React, { useState, useMemo } from 'react';
import { Target, Plus, Pencil, Trash2, Store, Users, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, FormDialog, ConfirmDialog, PercentSplitter, type Column, type RowAction, type SplitUser, type SplitValue } from '@/components/crud';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useSetGoalSplits } from '@/hooks/api/use-goals';
import { useAdminStores, useStoreUsers } from '@/hooks/api/use-admin-stores';
import { cn } from '@/lib/utils';
import type { MonthlyGoalResponse, CreateGoalRequest } from '@/types/admin.types';

// ============================================================
// Constants
// ============================================================

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split('-');
  return `${MONTHS[parseInt(month) - 1]} ${year}`;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// ============================================================
// Main Component
// ============================================================

const MetasMensais: React.FC = () => {
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSplitsDialogOpen, setIsSplitsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<MonthlyGoalResponse | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MonthlyGoalResponse | null>(null);

  // Form state
  const [form, setForm] = useState({
    store_id: '',
    month: '',
    goal_amount: '',
    active: true,
  });

  // Splits state
  const [currentGoalForSplits, setCurrentGoalForSplits] = useState<MonthlyGoalResponse | null>(null);
  const [splits, setSplits] = useState<SplitValue[]>([]);

  // Queries and mutations
  const { data: goalsData, isLoading } = useGoals({
    store_id: storeFilter !== 'all' ? parseInt(storeFilter) : undefined,
    page,
    per_page: 25,
  });
  const { data: storesData } = useAdminStores({ per_page: 100 });
  const { data: storeUsers } = useStoreUsers(
    currentGoalForSplits?.store_id || parseInt(form.store_id) || 0
  );

  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const deleteMutation = useDeleteGoal();
  const setSplitsMutation = useSetGoalSplits();

  // Statistics
  const stats = useMemo(() => {
    const goals = goalsData?.data || [];
    const total = goals.reduce((acc, g) => acc + g.goal_amount, 0);
    const active = goals.filter(g => g.active).length;
    return { total, active, count: goals.length };
  }, [goalsData]);

  // Vendedores for splits (filter only vendedor role)
  const vendedores: SplitUser[] = useMemo(() => {
    return (storeUsers || [])
      .filter(u => u.role === 'vendedor')
      .map(u => ({
        id: u.user_id,
        name: u.user_name,
      }));
  }, [storeUsers]);

  // Table columns
  const columns: Column<MonthlyGoalResponse>[] = [
    {
      key: 'month',
      label: 'Mês',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatMonth(value as string)}</span>
        </div>
      ),
    },
    {
      key: 'store',
      label: 'Loja',
      render: (_, goal) => (
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-muted-foreground" />
          <span>{goal.store?.name}</span>
        </div>
      ),
    },
    {
      key: 'goal_amount',
      label: 'Meta',
      render: (value) => (
        <span className="font-semibold text-primary">
          {formatCurrency(value as number)}
        </span>
      ),
    },
    {
      key: 'splits',
      label: 'Distribuição',
      render: (_, goal) => {
        const hasComplete = goal.splits?.reduce((acc, s) => acc + s.percent, 0) === 100;
        return (
          <Badge variant={hasComplete ? 'default' : 'destructive'}>
            {hasComplete ? `${goal.splits?.length || 0} vendedores` : 'Incompleta'}
          </Badge>
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

  // Row actions
  const getRowActions = (goal: MonthlyGoalResponse): RowAction<MonthlyGoalResponse>[] => [
    {
      label: 'Editar Meta',
      icon: <Pencil className="h-4 w-4" />,
      onClick: (g) => handleEdit(g),
    },
    {
      label: 'Definir Splits',
      icon: <Users className="h-4 w-4" />,
      onClick: (g) => handleOpenSplits(g),
      separator: true,
    },
    {
      label: 'Excluir',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (g) => setConfirmDelete(g),
      variant: 'destructive',
      separator: true,
    },
  ];

  // Handlers
  const handleEdit = (goal: MonthlyGoalResponse) => {
    setEditingGoal(goal);
    setForm({
      store_id: String(goal.store_id),
      month: goal.month,
      goal_amount: String(goal.goal_amount),
      active: goal.active,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingGoal(null);
    const now = new Date();
    setForm({
      store_id: '',
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      goal_amount: '',
      active: true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingGoal) {
      await updateMutation.mutateAsync({
        id: editingGoal.id,
        data: {
          goal_amount: parseFloat(form.goal_amount),
          active: form.active,
        },
      });
    } else {
      await createMutation.mutateAsync({
        store_id: parseInt(form.store_id),
        month: form.month,
        goal_amount: parseFloat(form.goal_amount),
        active: form.active,
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (confirmDelete) {
      await deleteMutation.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const handleOpenSplits = (goal: MonthlyGoalResponse) => {
    setCurrentGoalForSplits(goal);
    setSplits(goal.splits?.map(s => ({
      user_id: s.user_id,
      percent: s.percent,
    })) || []);
    setIsSplitsDialogOpen(true);
  };

  const handleSaveSplits = async () => {
    if (currentGoalForSplits) {
      await setSplitsMutation.mutateAsync({
        id: currentGoalForSplits.id,
        splits,
      });
      setIsSplitsDialogOpen(false);
    }
  };

  // Check if splits are valid (sum = 100)
  const splitsTotal = splits.reduce((acc, s) => acc + s.percent, 0);
  const isSplitsValid = Math.abs(splitsTotal - 100) < 0.01;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Metas Mensais"
        description="Configure as metas de vendas e a distribuição entre vendedores"
        icon={Target}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Metas Cadastradas</p>
                <p className="text-2xl font-bold">{stats.count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total em Metas</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Metas Ativas</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger className="w-[200px]">
              <Store className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Todas as lojas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as lojas</SelectItem>
              {storesData?.data.map(store => (
                <SelectItem key={store.id} value={String(store.id)}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={goalsData?.data || []}
        columns={columns}
        loading={isLoading}
        getRowKey={(g) => g.id}
        pagination={goalsData?.meta}
        onPageChange={setPage}
        actions={getRowActions}
        emptyMessage="Nenhuma meta encontrada"
        emptyIcon={<Target className="h-12 w-12 text-muted-foreground" />}
      />

      {/* Create/Edit Dialog */}
      <FormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingGoal ? 'Editar Meta' : 'Nova Meta'}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        isEdit={!!editingGoal}
      >
        <div className="space-y-4">
          {!editingGoal && (
            <>
              <div>
                <Label>Loja *</Label>
                <Select
                  value={form.store_id}
                  onValueChange={(v) => setForm(f => ({ ...f, store_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {storesData?.data.map(store => (
                      <SelectItem key={store.id} value={String(store.id)}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Mês de Referência *</Label>
                <Input
                  type="month"
                  value={form.month}
                  onChange={(e) => setForm(f => ({ ...f, month: e.target.value }))}
                />
              </div>
            </>
          )}

          <div>
            <Label>Valor da Meta (R$) *</Label>
            <Input
              type="number"
              value={form.goal_amount}
              onChange={(e) => setForm(f => ({ ...f, goal_amount: e.target.value }))}
              placeholder="50000.00"
              min={0}
              step={100}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label className="text-base">Meta Ativa</Label>
              <p className="text-sm text-muted-foreground">Visível nos dashboards</p>
            </div>
            <Switch
              checked={form.active}
              onCheckedChange={(checked) => setForm(f => ({ ...f, active: checked }))}
            />
          </div>
        </div>
      </FormDialog>

      {/* Splits Dialog */}
      <FormDialog
        open={isSplitsDialogOpen}
        onOpenChange={setIsSplitsDialogOpen}
        title={`Distribuição - ${currentGoalForSplits?.store?.name}`}
        description={`${formatMonth(currentGoalForSplits?.month || '')} • Meta: ${formatCurrency(currentGoalForSplits?.goal_amount || 0)}`}
        onSubmit={handleSaveSplits}
        loading={setSplitsMutation.isPending}
        submitText="Salvar Distribuição"
        size="lg"
      >
        <PercentSplitter
          users={vendedores}
          value={splits}
          onChange={setSplits}
          total={100}
        />
      </FormDialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        title="Excluir Meta"
        description={
          <p>
            Excluir meta de <strong>{formatCurrency(confirmDelete?.goal_amount || 0)}</strong>
            {' '}para <strong>{confirmDelete?.store?.name}</strong> em {formatMonth(confirmDelete?.month || '')}?
          </p>
        }
        confirmText="Excluir"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
};

export default MetasMensais;
