/**
 * Regras de Comissão Page (Refactored)
 * 
 * Modern interface for managing commission rules and tiers.
 * Uses real API integration via React Query hooks.
 */

import React, { useState, useMemo } from 'react';
import { Percent, Plus, Pencil, Trash2, Store, Globe, Calculator, TrendingUp, Target } from 'lucide-react';
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
import { useCommissionRules, useCreateCommissionRule, useUpdateCommissionRule, useDeleteCommissionRule } from '@/hooks/api/use-rules';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import { cn } from '@/lib/utils';
import type { CommissionRuleResponse, CommissionTier, CreateCommissionRuleRequest } from '@/types/admin.types';

// ============================================================
// Constants
// ============================================================

const formatPercent = (value: number | undefined | null) => {
  if (value === undefined || value === null) return '0%';
  return `${value.toFixed(1)}%`;
};

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
  { key: 'min_rate', label: '% da Meta', type: 'number', suffix: '%', min: 0, max: 200, step: 5 },
  { key: 'commission_rate', label: '% Comissão', type: 'number', suffix: '%', min: 0, max: 100, step: 0.5 },
];

// ============================================================
// Commission Simulator Component
// ============================================================

interface CommissionSimulatorProps {
  tiers: CommissionTier[];
}

function CommissionSimulator({ tiers }: CommissionSimulatorProps) {
  const [goalPercent, setGoalPercent] = useState<string>('');
  const [salesValue, setSalesValue] = useState<string>('');

  const result = useMemo(() => {
    const percent = parseFloat(goalPercent) || 0;
    const sales = parseFloat(salesValue) || 0;

    if (percent === 0 || sales === 0 || tiers.length === 0) return null;

    // Find the applicable tier (highest min_rate that percent exceeds)
    const sortedTiers = [...tiers].sort((a, b) => b.min_rate - a.min_rate);
    const applicableTier = sortedTiers.find(t => percent >= t.min_rate);

    if (!applicableTier) return null;

    const commission = (sales * applicableTier.commission_rate) / 100;
    return { tier: applicableTier, commission };
  }, [goalPercent, salesValue, tiers]);

  return (
    <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Simulador de Comissão
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">% Atingimento da Meta</Label>
            <div className="relative">
              <Input
                type="number"
                value={goalPercent}
                onChange={(e) => setGoalPercent(e.target.value)}
                placeholder="100"
                className="pr-8"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Valor das Vendas</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input
                type="number"
                value={salesValue}
                onChange={(e) => setSalesValue(e.target.value)}
                placeholder="50000"
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex flex-col justify-end">
            {result ? (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  Taxa: {formatPercent(result.tier.commission_rate)}
                </p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(result.commission)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-right">
                {tiers.length === 0 ? 'Sem faixas' : 'Preencha os campos'}
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

const RegrasComissaoPage: React.FC = () => {
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRuleResponse | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CommissionRuleResponse | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    store_id: '' as string | null,
    effective_from: '',
    effective_to: '',
    active: true,
  });
  const [tiers, setTiers] = useState<CommissionTier[]>([]);

  // Queries and mutations
  const { data: rulesData, isLoading } = useCommissionRules({
    store_id: storeFilter !== 'all' ? parseInt(storeFilter) : undefined,
    page,
    per_page: 25,
  });
  const { data: storesData } = useAdminStores({ per_page: 100 });

  const createMutation = useCreateCommissionRule();
  const updateMutation = useUpdateCommissionRule();
  const deleteMutation = useDeleteCommissionRule();

  // Stats
  const stats = useMemo(() => {
    const rules = rulesData?.data || [];
    const global = rules.filter(r => r.store_id === null).length;
    const active = rules.filter(r => r.active).length;
    return { total: rules.length, global, active };
  }, [rulesData]);

  // Table columns
  const columns: Column<CommissionRuleResponse>[] = [
    {
      key: 'name',
      label: 'Regra',
      render: (_, rule) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            rule.store_id === null ? 'bg-green-500/10' : 'bg-primary/10'
          )}>
            {rule.store_id === null ? (
              <Globe className="h-5 w-5 text-green-600" />
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
        const tiers = value as CommissionTier[];
        if (!tiers || tiers.length === 0) {
          return <span className="text-muted-foreground">Sem faixas</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {tiers.slice(0, 3).map((tier, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                ≥{formatPercent(tier.min_rate)} → {formatPercent(tier.commission_rate)}
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
  const getRowActions = (rule: CommissionRuleResponse): RowAction<CommissionRuleResponse>[] => [
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
  const handleEdit = (rule: CommissionRuleResponse) => {
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
    setTiers([
      { min_rate: 0, commission_rate: 1 },
      { min_rate: 80, commission_rate: 2 },
      { min_rate: 100, commission_rate: 3 },
    ]);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const data: CreateCommissionRuleRequest = {
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
        title="Regras de Comissão"
        description="Configure as regras de comissão baseadas no atingimento de metas"
        icon={Percent}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Percent className="h-6 w-6 text-primary" />
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
              <div className="p-3 rounded-full bg-green-500/10">
                <Globe className="h-6 w-6 text-green-600" />
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
              <div className="p-3 rounded-full bg-blue-500/10">
                <TrendingUp className="h-6 w-6 text-blue-600" />
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
        emptyIcon={<Percent className="h-12 w-12 text-muted-foreground" />}
      />

      {/* Create/Edit Dialog */}
      <FormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingRule ? 'Editar Regra de Comissão' : 'Nova Regra de Comissão'}
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
                placeholder="Comissão Padrão 2026"
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
            <Label className="text-base mb-3 block">Faixas de Comissão</Label>
            <Alert className="mb-4">
              <Target className="h-4 w-4" />
              <AlertDescription>
                <strong>% da Meta:</strong> Percentual de atingimento da meta mensal.
                <br />
                <strong>% Comissão:</strong> Taxa aplicada sobre o total de vendas do período.
              </AlertDescription>
            </Alert>
            <TierBuilder
              value={tiers as unknown as Record<string, unknown>[]}
              onChange={(newTiers) => setTiers(newTiers as unknown as CommissionTier[])}
              fields={TIER_FIELDS}
              addLabel="Adicionar Faixa"
              defaultTier={{ min_rate: 0, commission_rate: 0 }}
            />
          </div>

          {/* Simulator */}
          <CommissionSimulator tiers={tiers} />

          <Separator />

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label className="text-base">Regra Ativa</Label>
              <p className="text-sm text-muted-foreground">Será aplicada nos cálculos de comissão</p>
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
        title="Excluir Regra de Comissão"
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

export default RegrasComissaoPage;
