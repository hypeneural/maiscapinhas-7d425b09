/**
 * Tabela de Bônus Page (Refactored)
 * 
 * List page for bonus rules. Create/Edit uses dedicated pages.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Plus, Pencil, Trash2, Store, Globe, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, ConfirmDialog, type Column, type RowAction } from '@/components/crud';
import { useBonusRules, useDeleteBonusRule } from '@/hooks/api/use-rules';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import { cn } from '@/lib/utils';
import type { BonusRuleResponse, BonusTier } from '@/types/admin.types';

// ============================================================
// Helpers
// ============================================================

const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

// ============================================================
// Main Component
// ============================================================

const TabelaBonusPage: React.FC = () => {
  const navigate = useNavigate();
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<BonusRuleResponse | null>(null);

  // Queries and mutations
  const { data: rulesData, isLoading } = useBonusRules({
    store_id: storeFilter !== 'all' ? parseInt(storeFilter) : undefined,
    page,
    per_page: 25,
  });
  const { data: storesData } = useAdminStores({ per_page: 100 });
  const deleteMutation = useDeleteBonusRule();

  // Stats
  const stats = useMemo(() => {
    const rules = rulesData?.data || [];
    const global = rules.filter(r => r.store_id === null).length;
    const active = rules.filter(r => r.active).length;
    return { total: rules.length, global, active };
  }, [rulesData]);

  // Table columns
  const columns: Column<BonusRuleResponse>[] = [
    {
      key: 'name',
      label: 'Regra',
      render: (_, rule) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            rule.store_id === null ? 'bg-blue-500/10' : 'bg-primary/10'
          )}>
            {rule.store_id === null ? (
              <Globe className="h-5 w-5 text-blue-600" />
            ) : (
              <Store className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <p className="font-medium">{rule.name}</p>
            <p className="text-xs text-muted-foreground">
              {rule.store_id === null ? 'Global' : rule.store?.name}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'config_json',
      label: 'Faixas',
      render: (value) => {
        const tiers = value as BonusTier[];
        if (!tiers || tiers.length === 0) {
          return <span className="text-muted-foreground">Sem faixas</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {tiers.slice(0, 3).map((tier, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                ≥{formatCurrency(tier.min_sales)} → {formatCurrency(tier.bonus)}
              </Badge>
            ))}
            {tiers.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tiers.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'effective_from',
      label: 'Vigência',
      render: (_, rule) => (
        <span className="text-sm">
          {formatDate(rule.effective_from)}
          {rule.effective_to && ` - ${formatDate(rule.effective_to)}`}
        </span>
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
  const getRowActions = (rule: BonusRuleResponse): RowAction<BonusRuleResponse>[] => [
    {
      label: 'Editar',
      icon: <Pencil className="h-4 w-4" />,
      onClick: (r) => navigate(`/config/bonus/${r.id}`),
    },
    {
      label: 'Excluir',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (r) => setConfirmDelete(r),
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
        title="Tabela de Bônus"
        description="Configure as regras de bonificação por volume de vendas"
        icon={Gift}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Regras</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Regras Globais</p>
                <p className="text-2xl font-bold">{stats.global}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Regras Ativas</p>
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
              <SelectItem value="all">Todas (inclui globais)</SelectItem>
              {storesData?.data.map(store => (
                <SelectItem key={store.id} value={String(store.id)}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => navigate('/config/bonus/novo')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={rulesData?.data || []}
        columns={columns}
        loading={isLoading}
        getRowKey={(r) => r.id}
        pagination={rulesData?.meta}
        onPageChange={setPage}
        actions={getRowActions}
        emptyMessage="Nenhuma regra encontrada"
        emptyIcon={<Gift className="h-12 w-12 text-muted-foreground" />}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        title="Excluir Regra de Bônus"
        description={
          <p>
            Excluir a regra <strong>{confirmDelete?.name}</strong>?
            <br />
            <span className="text-muted-foreground text-sm">
              Esta ação não pode ser desfeita.
            </span>
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

export default TabelaBonusPage;
