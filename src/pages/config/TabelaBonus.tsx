/**
 * Tabela de Bônus Page (Refactored)
 * 
 * Modern interface for managing bonus rules and tiers.
 * Uses real API integration via React Query hooks.
 */

import React, { useState, useMemo } from 'react';
import { Gift, Plus, Pencil, Trash2, Store, Globe, Calculator, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, FormDialog, ConfirmDialog, TierBuilder, type Column, type RowAction, type TierField } from '@/components/crud';
import { useBonusRules, useCreateBonusRule, useUpdateBonusRule, useDeleteBonusRule } from '@/hooks/api/use-rules';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import { cn } from '@/lib/utils';
import type { BonusRuleResponse, BonusTier, CreateBonusRuleRequest } from '@/types/admin.types';

// ============================================================
// Constants
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

const TIER_FIELDS: TierField[] = [
  { key: 'min_sales', label: 'Vendas Mínimas', type: 'number', prefix: 'R$', min: 0, step: 100 },
  { key: 'bonus', label: 'Bônus', type: 'number', prefix: 'R$', min: 0, step: 5 },
];

// ============================================================
// Bonus Simulator Component
// ============================================================

interface BonusSimulatorProps {
  tiers: BonusTier[];
}

function BonusSimulator({ tiers }: BonusSimulatorProps) {
  const [testValue, setTestValue] = useState<string>('');

  const result = useMemo(() => {
    const value = parseFloat(testValue) || 0;
    if (value === 0 || tiers.length === 0) return null;

    // Find the applicable tier (highest min_sales that value exceeds)
    const sortedTiers = [...tiers].sort((a, b) => b.min_sales - a.min_sales);
    const applicableTier = sortedTiers.find(t => value >= t.min_sales);

    return applicableTier || null;
  }, [testValue, tiers]);

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Simulador de Bônus
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              value={testValue}
              onChange={(e) => setTestValue(e.target.value)}
              placeholder="Valor das vendas"
              className="pl-9"
            />
          </div>
          <div className="text-right min-w-[120px]">
            {result ? (
              <div>
                <p className="text-xs text-muted-foreground">Bônus</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(result.bonus)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {tiers.length === 0 ? 'Sem faixas' : 'Digite um valor'}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Component
// ============================================================

const TabelaBonusPage: React.FC = () => {
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BonusRuleResponse | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BonusRuleResponse | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    store_id: '' as string | null,
    effective_from: '',
    effective_to: '',
    active: true,
  });
  const [tiers, setTiers] = useState<BonusTier[]>([]);

  // Queries and mutations
  const { data: rulesData, isLoading } = useBonusRules({
    store_id: storeFilter !== 'all' ? parseInt(storeFilter) : undefined,
    page,
    per_page: 25,
  });
  const { data: storesData } = useAdminStores({ per_page: 100 });

  const createMutation = useCreateBonusRule();
  const updateMutation = useUpdateBonusRule();
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
      onClick: (r) => handleEdit(r),
    },
    {
      label: 'Excluir',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (r) => setConfirmDelete(r),
      variant: 'destructive',
      separator: true,
    },
  ];

  // Handlers
  const handleEdit = (rule: BonusRuleResponse) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      store_id: rule.store_id ? String(rule.store_id) : null,
      effective_from: rule.effective_from,
      effective_to: rule.effective_to || '',
      active: rule.active,
    });
    setTiers(rule.config_json || []);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingRule(null);
    const today = new Date().toISOString().split('T')[0];
    setForm({
      name: '',
      store_id: null,
      effective_from: today,
      effective_to: '',
      active: true,
    });
    setTiers([]);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const data: CreateBonusRuleRequest = {
      name: form.name,
      store_id: form.store_id ? parseInt(form.store_id) : null,
      config_json: tiers,
      effective_from: form.effective_from,
      effective_to: form.effective_to || null,
      active: form.active,
    };

    if (editingRule) {
      await updateMutation.mutateAsync({ id: editingRule.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsDialogOpen(false);
  };

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
        <Button onClick={handleCreate}>
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

      {/* Create/Edit Dialog */}
      <FormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingRule ? 'Editar Regra de Bônus' : 'Nova Regra de Bônus'}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        isEdit={!!editingRule}
        size="lg"
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome da Regra *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Bônus Vendas Q1 2026"
              />
            </div>
            <div>
              <Label>Escopo</Label>
              <Select
                value={form.store_id || 'global'}
                onValueChange={(v) => setForm(f => ({ ...f, store_id: v === 'global' ? null : v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Global (todas as lojas)
                    </div>
                  </SelectItem>
                  {storesData?.data.map(store => (
                    <SelectItem key={store.id} value={String(store.id)}>
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        {store.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Início da Vigência *</Label>
              <Input
                type="date"
                value={form.effective_from}
                onChange={(e) => setForm(f => ({ ...f, effective_from: e.target.value }))}
              />
            </div>
            <div>
              <Label>Fim da Vigência (opcional)</Label>
              <Input
                type="date"
                value={form.effective_to}
                onChange={(e) => setForm(f => ({ ...f, effective_to: e.target.value }))}
              />
            </div>
          </div>

          <Separator />

          {/* Tier Builder */}
          <div>
            <Label className="text-base mb-3 block">Faixas de Bônus</Label>
            <Alert className="mb-4">
              <AlertDescription>
                O bônus é aplicado com base no valor total de vendas.
                O vendedor recebe o bônus da maior faixa que atingir.
              </AlertDescription>
            </Alert>
            <TierBuilder
              value={tiers as unknown as Record<string, unknown>[]}
              onChange={(newTiers) => setTiers(newTiers as unknown as BonusTier[])}
              fields={TIER_FIELDS}
              addLabel="Adicionar Faixa"
              defaultTier={{ min_sales: 0, bonus: 0 }}
            />
          </div>

          {/* Simulator */}
          <BonusSimulator tiers={tiers} />

          <Separator />

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label className="text-base">Regra Ativa</Label>
              <p className="text-sm text-muted-foreground">Será aplicada nos cálculos de bônus</p>
            </div>
            <Switch
              checked={form.active}
              onCheckedChange={(checked) => setForm(f => ({ ...f, active: checked }))}
            />
          </div>
        </div>
      </FormDialog>

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
