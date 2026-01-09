import React, { useState } from 'react';
import { AlertTriangle, TrendingDown, CheckCircle2, XCircle, Clock, Filter, Info, AlertCircle, Percent, FileText, ClipboardCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { MonthPicker } from '@/components/MonthPicker';
import { StatusIndicator } from '@/components/StatusIndicator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCashIntegrity } from '@/hooks/api/use-reports';
import { useStores } from '@/hooks/api/use-stores';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';

// Get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const QuebraCaixa: React.FC = () => {
  const { currentStoreId, user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [selectedLoja, setSelectedLoja] = useState<string>(
    currentStoreId ? String(currentStoreId) : ''
  );

  // Fetch stores list
  const { data: storesData } = useStores();

  // Only fetch cash integrity when a store is selected
  const storeIdNumber = selectedLoja ? Number(selectedLoja) : 0;
  const { data: cashData, isLoading, isError, error } = useCashIntegrity(
    storeIdNumber,
    selectedMonth
  );

  // Helper component for info tooltips
  const InfoTooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-4 h-4 text-muted-foreground cursor-help ml-1" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Get alert icon based on type
  const getAlertIcon = (type: 'CRITICAL' | 'WARNING' | 'INFO') => {
    switch (type) {
      case 'CRITICAL':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'INFO':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  // Get risk level from percentage
  const getRiskLevel = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage <= 2) return 'success';
    if (percentage <= 5) return 'warning';
    return 'error';
  };

  const getRiskLabel = (percentage: number): string => {
    if (percentage <= 2) return 'Baixo';
    if (percentage <= 5) return 'Médio';
    return 'Alto';
  };

  // No store selected state
  if (!selectedLoja) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Quebra de Caixa"
          description="Análise de divergências e riscos operacionais"
          icon={AlertTriangle}
          actions={
            <div className="flex gap-2">
              <MonthPicker
                value={selectedMonth}
                onChange={setSelectedMonth}
              />
              <Select value={selectedLoja} onValueChange={setSelectedLoja}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Selecione uma loja" />
                </SelectTrigger>
                <SelectContent>
                  {storesData?.map(store => (
                    <SelectItem key={store.id} value={String(store.id)}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Selecione uma Loja</p>
            <p className="text-sm text-muted-foreground">
              Para visualizar o relatório de quebra de caixa, selecione uma loja no filtro acima.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Quebra de Caixa"
          description="Análise de divergências e riscos operacionais"
          icon={AlertTriangle}
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Quebra de Caixa"
          description="Análise de divergências e riscos operacionais"
          icon={AlertTriangle}
          actions={
            <div className="flex gap-2">
              <MonthPicker
                value={selectedMonth}
                onChange={setSelectedMonth}
              />
              <Select value={selectedLoja} onValueChange={setSelectedLoja}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Selecione uma loja" />
                </SelectTrigger>
                <SelectContent>
                  {storesData?.map(store => (
                    <SelectItem key={store.id} value={String(store.id)}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-2">Erro ao carregar relatório</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Tente novamente mais tarde'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const integrity = cashData?.cash_integrity;
  const divergence = cashData?.divergence_analysis;
  const workflow = cashData?.workflow_status;
  const alerts = cashData?.alerts || [];

  // Pie chart data for divergence distribution
  const pieData = divergence ? [
    { name: 'Justificadas', value: divergence.justified_count, color: 'hsl(var(--secondary))' },
    { name: 'Não Justificadas', value: divergence.unjustified_count, color: 'hsl(var(--destructive))' },
  ] : [];

  // Pie chart for workflow status
  const workflowPieData = workflow ? [
    { name: 'Aprovados', value: workflow.closed_count, color: 'hsl(142, 76%, 36%)' },
    { name: 'Pendentes', value: workflow.pending_approval, color: 'hsl(var(--accent))' },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Quebra de Caixa"
        description="Análise de divergências e riscos operacionais"
        icon={AlertTriangle}
        actions={
          <div className="flex gap-2">
            <MonthPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
            />
            <Select value={selectedLoja} onValueChange={setSelectedLoja}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Selecione uma loja" />
              </SelectTrigger>
              <SelectContent>
                {storesData?.map(store => (
                  <SelectItem key={store.id} value={String(store.id)}>{store.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              variant={alert.type === 'CRITICAL' ? 'destructive' : 'default'}
              className={cn(
                alert.type === 'WARNING' && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
                alert.type === 'INFO' && 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              )}
            >
              {getAlertIcon(alert.type)}
              <AlertTitle className="ml-2">{alert.code.replace(/_/g, ' ')}</AlertTitle>
              <AlertDescription className="ml-2">{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* % Quebra Principal */}
        <Card className={cn(
          'relative overflow-hidden',
          integrity && integrity.cash_break_percentage > 5 && 'ring-2 ring-destructive/50'
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center">
                  % Quebra
                  <InfoTooltip>Percentual de divergência em relação ao valor esperado pelo sistema</InfoTooltip>
                </p>
                <p className="text-3xl font-bold">{integrity?.cash_break_percentage.toFixed(2)}%</p>
              </div>
              <div className={cn(
                'p-3 rounded-full',
                integrity && integrity.cash_break_percentage <= 2 && 'bg-green-500/20',
                integrity && integrity.cash_break_percentage > 2 && integrity.cash_break_percentage <= 5 && 'bg-yellow-500/20',
                integrity && integrity.cash_break_percentage > 5 && 'bg-red-500/20'
              )}>
                <Percent className={cn(
                  'w-6 h-6',
                  integrity && integrity.cash_break_percentage <= 2 && 'text-green-600',
                  integrity && integrity.cash_break_percentage > 2 && integrity.cash_break_percentage <= 5 && 'text-yellow-600',
                  integrity && integrity.cash_break_percentage > 5 && 'text-red-600'
                )} />
              </div>
            </div>
            {integrity && (
              <div className="mt-2">
                <StatusIndicator
                  status={integrity.status}
                  label={`Risco ${getRiskLabel(integrity.cash_break_percentage)}`}
                  size="sm"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Divergência */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center">
                  Divergência Total
                  <InfoTooltip>Diferença entre valor esperado e valor real. Negativo indica falta no caixa.</InfoTooltip>
                </p>
                <p className={cn(
                  'text-2xl font-bold',
                  integrity && integrity.total_divergence < 0 ? 'text-destructive' : 'text-green-600'
                )}>
                  R$ {integrity?.total_divergence.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
          </CardContent>
        </Card>

        {/* Linhas com Divergência */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center">
                  Divergências
                  <InfoTooltip>Total de linhas de fechamento com diferença entre esperado e real</InfoTooltip>
                </p>
                <p className="text-2xl font-bold">{divergence?.total_lines_with_divergence || 0}</p>
              </div>
              <AlertCircle className="w-6 h-6 text-muted-foreground" />
            </div>
            {divergence && (
              <p className="text-xs text-muted-foreground mt-1">
                {divergence.justified_count} justificadas, {divergence.unjustified_count} pendentes
              </p>
            )}
          </CardContent>
        </Card>

        {/* Taxa de Conclusão */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center">
                  Turnos Fechados
                  <InfoTooltip>Percentual de turnos com fechamento aprovado</InfoTooltip>
                </p>
                <p className="text-2xl font-bold">{workflow?.completion_rate.toFixed(0)}%</p>
              </div>
              <ClipboardCheck className="w-6 h-6 text-secondary" />
            </div>
            {workflow && (
              <p className="text-xs text-muted-foreground mt-1">
                {workflow.closed_count}/{workflow.total_shifts} turnos
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Análise de Divergências */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Análise de Divergências
              <InfoTooltip>Distribuição entre divergências justificadas e não justificadas</InfoTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {divergence && divergence.total_lines_with_divergence > 0 ? (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: number) => [value, 'Divergências']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm text-muted-foreground">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Taxa de Justificação</span>
                    <span className="font-medium">{divergence.justified_rate.toFixed(0)}%</span>
                  </div>
                  <Progress value={divergence.justified_rate} className="mt-2 h-2" />
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-2" />
                  <p className="text-muted-foreground">Nenhuma divergência registrada</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status do Workflow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Status do Workflow
              <InfoTooltip>Situação dos turnos: aprovados vs pendentes de aprovação</InfoTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workflow && workflow.total_shifts > 0 ? (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={workflowPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {workflowPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: number) => [value, 'Turnos']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  {workflowPieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm text-muted-foreground">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Turnos Aprovados
                    </span>
                    <span className="font-medium">{workflow.closed_count}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      Pendentes de Aprovação
                    </span>
                    <span className="font-medium">{workflow.pending_approval}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Total de Turnos
                    </span>
                    <span className="font-medium">{workflow.total_shifts}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhum turno registrado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Valores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Resumo Financeiro
            <InfoTooltip>Comparação entre valores esperados pelo sistema e valores reais contados</InfoTooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Valor Esperado (Sistema)</p>
              <p className="text-2xl font-bold">
                R$ {integrity?.total_system_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Valor Real (Contado)</p>
              <p className="text-2xl font-bold">
                R$ {integrity?.total_real_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className={cn(
              'p-4 rounded-lg',
              integrity && integrity.total_divergence < 0 ? 'bg-red-100 dark:bg-red-950/30' : 'bg-green-100 dark:bg-green-950/30'
            )}>
              <p className="text-sm text-muted-foreground mb-1">Diferença</p>
              <p className={cn(
                'text-2xl font-bold',
                integrity && integrity.total_divergence < 0 ? 'text-red-600' : 'text-green-600'
              )}>
                R$ {integrity?.total_divergence.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuebraCaixa;
