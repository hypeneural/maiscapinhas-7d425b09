/**
 * Histórico de Envelopes Page (Refactored)
 * 
 * Modern interface for viewing cash shift history with filters and stats.
 * Features expandable rows and integrity reports.
 */

import React, { useState, useMemo } from 'react';
import {
  History, Store, Calendar, CheckCircle, XCircle, Clock,
  TrendingUp, AlertTriangle, FileCheck, ChevronDown, ChevronUp,
  Loader2, BarChart3, Eye, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/PageHeader';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import { useAdminUsers } from '@/hooks/api/use-admin-users';
import { useCashShifts } from '@/hooks/api/use-cash-shifts';
import { useCashIntegrityReport, useCashClosing } from '@/hooks/api/use-cash-closings';
import { cn } from '@/lib/utils';
import { SHIFT_CODES, type CashShift, type ShiftCode } from '@/types/conference.types';

// ============================================================
// Constants
// ============================================================

const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  try {
    // Handle both ISO format and YYYY-MM-DD
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">CONCLUÍDO</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Rejeitado</Badge>;
    case 'submitted':
      return <Badge variant="secondary">Aguardando Aprovação</Badge>;
    case 'draft':
      return <Badge variant="outline">Rascunho</Badge>;
    case 'closed':
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">CONCLUÍDO</Badge>;
    case 'open':
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Aberto</Badge>;
    default:
      return <Badge variant="outline">Pendente</Badge>;
  }
};

const getIntegrityColor = (status: string) => {
  switch (status) {
    case 'GREEN': return 'text-green-600 bg-green-500/10';
    case 'YELLOW': return 'text-amber-600 bg-amber-500/10';
    case 'RED': return 'text-destructive bg-destructive/10';
    default: return 'text-muted-foreground bg-muted';
  }
};

// ============================================================
// Detail Dialog Component
// ============================================================

interface DetailDialogProps {
  shift: CashShift | null;
  onClose: () => void;
}

function DetailDialog({ shift, onClose }: DetailDialogProps) {
  // Always call hooks at top level
  const shiftId = shift?.id || 0;
  const { data: closingData, isLoading } = useCashClosing(shiftId, { enabled: !!shift });

  if (!shift) return null;

  const closing = closingData?.data;

  // Helper for timeline icon/color
  const getTimelineEventInfo = (description: string, event: string) => {
    switch (description) {
      case 'created': return { icon: FileCheck, color: 'text-blue-500 bg-blue-500/10', text: 'Fechamento Criado' };
      case 'updated': return { icon: TrendingUp, color: 'text-amber-500 bg-amber-500/10', text: 'Atualizado' };
      default: return { icon: Clock, color: 'text-gray-500 bg-gray-500/10', text: 'Evento Registrado' };
    }
  };

  const activities = closing?.activities || [];
  const lines = closing?.lines || [];
  const totalSystem = lines.reduce((s: number, l: any) => s + Number(l.system_value), 0);
  const totalReal = lines.reduce((s: number, l: any) => s + Number(l.real_value), 0);
  const totalDiff = lines.reduce((s: number, l: any) => s + Number(l.diff_value), 0);

  return (
    <Dialog open={!!shift} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detalhes do Fechamento
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : closing ? (
          <div className="space-y-6">
            {/* 1. Header Info */}
            <div className="flex flex-wrap items-center gap-3 pb-4 border-b">
              <Badge variant="outline" className="text-base px-3 py-1">
                <Store className="h-3 w-3 mr-2" />
                {shift.store?.name}
              </Badge>
              <Badge variant="outline" className="text-base px-3 py-1">
                <Calendar className="h-3 w-3 mr-2" />
                {formatDate(shift.date)}
              </Badge>
              <Badge variant="outline" className="text-base px-3 py-1">
                {SHIFT_CODES[shift.shift_code]}
              </Badge>
              <Badge variant="outline" className="text-base px-3 py-1">
                <User className="h-3 w-3 mr-2" />
                {shift.seller?.name}
              </Badge>
              <div className="ml-auto">
                {getStatusBadge(closing.status)}
              </div>
            </div>

            {/* 2. Values Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/30 border">
                <p className="text-sm text-muted-foreground mb-1">Valor Sistema</p>
                <p className="text-xl font-bold font-mono">{formatCurrency(totalSystem)}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border">
                <p className="text-sm text-muted-foreground mb-1">Valor Declarado</p>
                <p className="text-xl font-bold font-mono">{formatCurrency(totalReal)}</p>
              </div>
              <div className={cn(
                "p-4 rounded-lg border",
                totalDiff === 0 ? "bg-green-500/10 border-green-200" : "bg-destructive/10 border-destructive/20"
              )}>
                <p className={cn("text-sm mb-1", totalDiff === 0 ? "text-green-700" : "text-destructive")}>
                  Diferença
                </p>
                <p className={cn("text-xl font-bold font-mono", totalDiff === 0 ? "text-green-700" : "text-destructive")}>
                  {formatCurrency(totalDiff)}
                </p>
              </div>
            </div>

            {/* 3. Justification (if any) */}
            {closing.justification_text && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <h4 className="flex items-center gap-2 font-semibold text-amber-700 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  Justificativa do Conferente
                </h4>
                <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
                  {closing.justification_text}
                </p>
              </div>
            )}

            {/* 4. Detailed Lines Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Forma de Pagamento</th>
                    <th className="text-right p-3 font-medium">Sistema</th>
                    <th className="text-right p-3 font-medium">Declarado</th>
                    <th className="text-right p-3 font-medium">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line: any) => (
                    <tr key={line.id} className="border-t hover:bg-muted/20">
                      <td className="p-3 font-medium">{line.label}</td>
                      <td className="p-3 text-right font-mono text-muted-foreground">{formatCurrency(Number(line.system_value))}</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(Number(line.real_value))}</td>
                      <td className={cn(
                        'p-3 text-right font-mono font-medium',
                        Number(line.diff_value) === 0 ? 'text-green-600' : 'text-destructive'
                      )}>
                        {Number(line.diff_value) > 0 ? '+' : ''}{formatCurrency(Number(line.diff_value))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 5. Timeline */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <History className="h-4 w-4" />
                Linha do Tempo
              </h4>
              <div className="space-y-6 relative ml-2 border-l-2 border-muted pl-6 pb-2">
                {activities.length > 0 ? (
                  activities.map((log: any, index: number) => {
                    const info = getTimelineEventInfo(log.description, log.event);
                    const Icon = info.icon;
                    return (
                      <div key={log.id || index} className="relative">
                        <div className={cn(
                          "absolute -left-[31px] top-0 p-1.5 rounded-full border-2 border-background",
                          info.color
                        )}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{info.text}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {log.causer ? (
                              <span>Por <strong>{log.causer.name}</strong></span>
                            ) : (
                              <span>Sistema</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground italic">Nenhum evento registrado.</p>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p>Nenhum dado encontrado.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Shift Row Component
// ============================================================

interface ShiftRowProps {
  shift: CashShift;
  onClick: () => void;
}

function ShiftRow({ shift, onClick }: ShiftRowProps) {
  const lines = shift.cash_closing?.lines || [];
  const totalReal = lines.reduce((s, l) => s + l.real_value, 0);
  const totalDiff = lines.reduce((s, l) => s + l.diff_value, 0);
  const hasClosing = lines.length > 0;

  return (
    <div
      className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      {/* Date + Shift */}
      <div className="col-span-3 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{formatDate(shift.date)}</span>
        <Badge variant="outline" className="text-xs">
          {SHIFT_CODES[shift.shift_code]}
        </Badge>
      </div>

      {/* Store */}
      <div className="col-span-2 flex items-center">
        <span className="text-sm truncate">{shift.store?.name || '—'}</span>
      </div>

      {/* Seller */}
      <div className="col-span-3 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
          {shift.seller?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <span className="text-sm truncate">{shift.seller?.name || '—'}</span>
      </div>

      {/* Values */}
      <div className="col-span-2 text-right">
        {hasClosing ? (
          <>
            <p className="text-sm font-mono">{formatCurrency(totalReal)}</p>
            {totalDiff !== 0 && (
              <p className={cn(
                'text-xs font-mono',
                totalDiff < 0 ? 'text-destructive' : 'text-green-600'
              )}>
                {totalDiff >= 0 ? '+' : ''}{formatCurrency(totalDiff)}
              </p>
            )}
          </>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </div>

      {/* Status */}
      <div className="col-span-2 flex items-center justify-end">
        {shift.cash_closing?.status
          ? getStatusBadge(shift.cash_closing.status)
          : getStatusBadge(shift.status)}
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

const HistoricoEnvelopesPage: React.FC = () => {
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedShift, setSelectedShift] = useState<CashShift | null>(null);

  // Get current month for reports
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Queries
  const { data: storesData } = useAdminStores({ per_page: 100 });
  const { data: usersData } = useAdminUsers({ per_page: 100 });

  const { data: shiftsData, isLoading } = useCashShifts({
    store_id: storeFilter !== 'all' ? parseInt(storeFilter) : undefined,
    date: dateFilter || undefined,
    seller_id: sellerFilter !== 'all' ? parseInt(sellerFilter) : undefined,
    shift_code: shiftFilter !== 'all' ? shiftFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    per_page: 25,
  });

  // Report for selected store
  const { data: reportData } = useCashIntegrityReport(
    storeFilter !== 'all' ? parseInt(storeFilter) : 0,
    currentMonth,
    storeFilter !== 'all'
  );

  const report = reportData?.data;
  const shifts = shiftsData?.data || [];

  // Handle pagination - API returns meta directly
  const paginationMeta = shiftsData?.meta;
  const totalPages = paginationMeta?.last_page || 1;
  const currentPage = paginationMeta?.current_page || 1;
  const total = paginationMeta?.total || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Histórico de Envelopes"
        description="Consulte os fechamentos de caixa anteriores"
        icon={History}
      />

      {/* Stats Cards (when store is selected) */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={cn('border-2', getIntegrityColor(report.cash_integrity.status))}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={cn('p-3 rounded-full', getIntegrityColor(report.cash_integrity.status))}>
                  {report.cash_integrity.status === 'GREEN' ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : report.cash_integrity.status === 'YELLOW' ? (
                    <AlertTriangle className="h-6 w-6" />
                  ) : (
                    <XCircle className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Integridade</p>
                  <p className="text-2xl font-bold">
                    {report.cash_integrity.cash_break_percentage.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <FileCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Turnos Fechados</p>
                  <p className="text-2xl font-bold">
                    {report.workflow_status.closed_count}/{report.workflow_status.total_shifts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-500/10">
                  <BarChart3 className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa Conclusão</p>
                  <p className="text-2xl font-bold">
                    {report.workflow_status.completion_rate.toFixed(1)}%
                  </p>
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
                  <p className="text-sm text-muted-foreground">Justificadas</p>
                  <p className="text-2xl font-bold">
                    {report.divergence_analysis.justified_rate.toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {report?.alerts && report.alerts.length > 0 && (
        <div className="space-y-2">
          {report.alerts.map((alert, index) => (
            <div
              key={index}
              className={cn(
                'p-3 rounded-lg flex items-center gap-3',
                alert.type === 'CRITICAL' && 'bg-destructive/10 text-destructive',
                alert.type === 'WARNING' && 'bg-amber-500/10 text-amber-600',
                alert.type === 'INFO' && 'bg-blue-500/10 text-blue-600'
              )}
            >
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Store Filter */}
            <div className="w-[200px]">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Loja</Label>
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger>
                  <Store className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as lojas</SelectItem>
                  {storesData?.data?.map(store => (
                    <SelectItem key={store.id} value={String(store.id)}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seller Filter */}
            <div className="w-[200px]">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Usuário</Label>
              <Select value={sellerFilter} onValueChange={setSellerFilter}>
                <SelectTrigger>
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  {usersData?.data?.map((user: any) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Shift Filter */}
            <div className="w-[140px]">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Turno</Label>
              <Select value={shiftFilter} onValueChange={setShiftFilter}>
                <SelectTrigger>
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(SHIFT_CODES).map(([code, label]) => (
                    <SelectItem key={code} value={code}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-[160px]">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <FileCheck className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                  <SelectItem value="submitted">Aguardando Aprov.</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="w-[160px]">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Data</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            {/* Clear Filters */}
            {(storeFilter !== 'all' || dateFilter || sellerFilter !== 'all' || shiftFilter !== 'all' || statusFilter !== 'all') && (
              <div className="flex items-end pb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStoreFilter('all');
                    setDateFilter('');
                    setSellerFilter('all');
                    setShiftFilter('all');
                    setStatusFilter('all');
                  }}
                  className="h-9 px-3 text-muted-foreground hover:text-foreground"
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data List */}
      <Card>
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
          <div className="col-span-3">Data / Turno</div>
          <div className="col-span-2">Loja</div>
          <div className="col-span-3">Vendedor</div>
          <div className="col-span-2 text-right">Valores</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && shifts.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum turno encontrado</p>
          </div>
        )}

        {/* Rows */}
        {!isLoading && shifts.map(shift => (
          <ShiftRow
            key={shift.id}
            shift={shift}
            onClick={() => setSelectedShift(shift)}
          />
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              {total} registros • Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Dialog */}
      <DetailDialog
        shift={selectedShift}
        onClose={() => setSelectedShift(null)}
      />
    </div>
  );
};

export default HistoricoEnvelopesPage;
