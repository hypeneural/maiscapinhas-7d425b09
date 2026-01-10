/**
 * Metas Mensais Page (Refactored)
 * 
 * List page for monthly goals. Create/Edit uses dedicated pages.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Plus, Pencil, Trash2, Store, Users, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, ConfirmDialog, type Column, type RowAction } from '@/components/crud';
import { useGoals, useDeleteGoal } from '@/hooks/api/use-goals';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import type { MonthlyGoalResponse } from '@/types/admin.types';

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
  const navigate = useNavigate();
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<MonthlyGoalResponse | null>(null);

  // Queries and mutations
  const { data: goalsData, isLoading } = useGoals({
    store_id: storeFilter !== 'all' ? parseInt(storeFilter) : undefined,
    page,
    per_page: 25,
  });
  const { data: storesData } = useAdminStores({ per_page: 100 });
  const deleteMutation = useDeleteGoal();

  // Statistics
  const stats = useMemo(() => {
    const goals = goalsData?.data || [];
    const total = goals.reduce((acc, g) => acc + g.goal_amount, 0);
    const active = goals.filter(g => g.active).length;
    return { total, active, count: goals.length };
  }, [goalsData]);

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
      onClick: (g) => navigate(`/config/metas/${g.id}`),
    },
    {
      label: 'Definir Splits',
      icon: <Users className="h-4 w-4" />,
      onClick: (g) => navigate(`/config/metas/${g.id}/splits`),
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

  // Delete handler
  const handleDelete = async () => {
    if (confirmDelete) {
      await deleteMutation.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

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
        <Button onClick={() => navigate('/config/metas/novo')}>
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
