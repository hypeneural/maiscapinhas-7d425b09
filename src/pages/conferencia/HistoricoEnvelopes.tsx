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
  Loader2, BarChart3, Eye
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
import { useCashShifts } from '@/hooks/api/use-cash-shifts';
import { useCashIntegrityReport } from '@/hooks/api/use-cash-closings';
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
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Aprovado</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Rejeitado</Badge>;
    case 'submitted':
      return <Badge variant="secondary">Aguardando</Badge>;
    case 'draft':
      return <Badge variant="outline">Rascunho</Badge>;
    case 'closed':
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Fechado</Badge>;
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
  if (!shift) return null;

  const closing = shift.cash_closing;
  const hasClosing = closing && closing.lines && closing.lines.length > 0;

  const totalSystem = hasClosing ? closing.lines.reduce((s, l) => s + l.system_value, 0) : 0;
  const totalReal = hasClosing ? closing.lines.reduce((s, l) => s + l.real_value, 0) : 0;
  const totalDiff = hasClosing ? closing.lines.reduce((s, l) => s + l.diff_value, 0) : 0;

  return (
    <Dialog open={!!shift} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detalhes do Turno
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Shift Info */}
          <div className="flex flex-wrap items-center gap-2 pb-4 border-b">
            <Badge variant="outline">{shift.store?.name || 'Loja'}</Badge>
            <Badge variant="outline">{formatDate(shift.date)}</Badge>
            <Badge variant="outline">{SHIFT_CODES[shift.shift_code]}</Badge>
            <Badge variant="outline">{shift.seller?.name || 'Vendedor'}</Badge>
            {getStatusBadge(shift.status)}
          </div>

          {/* Closing Lines */}
          {hasClosing ? (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Formas de Pagamento</Label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Forma</th>
                      <th className="text-right p-3 font-medium">Sistema</th>
                      <th className="text-right p-3 font-medium">Real</th>
                      <th className="text-right p-3 font-medium">Diferença</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closing.lines.map(line => (
                      <tr key={line.id} className={cn(
                        'border-t',
                        line.diff_value !== 0 && 'bg-destructive/5'
                      )}>
                        <td className="p-3 font-medium">{line.label}</td>
                        <td className="p-3 text-right font-mono">{formatCurrency(line.system_value)}</td>
                        <td className="p-3 text-right font-mono">{formatCurrency(line.real_value)}</td>
                        <td className={cn(
                          'p-3 text-right font-mono font-medium',
                          line.diff_value === 0 ? 'text-green-600' : 'text-destructive'
                        )}>
                          {formatCurrency(line.diff_value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50 font-medium">
                    <tr>
                      <td className="p-3">TOTAL</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(totalSystem)}</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(totalReal)}</td>
                      <td className={cn(
                        'p-3 text-right font-mono',
                        totalDiff === 0 ? 'text-green-600' : 'text-destructive'
                      )}>
                        {formatCurrency(totalDiff)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {closing.closed_by_user && (
                <div className="text-sm text-muted-foreground pt-2">
                  Conferido por <strong>{closing.closed_by_user.name}</strong> em{' '}
                  {closing.closed_at ? formatDate(closing.closed_at) : '—'}
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum fechamento registrado para este turno.</p>
              <p className="text-sm">O vendedor ainda não preencheu os valores.</p>
            </div>
          )}
        </div>
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
  const [page, setPage] = useState(1);
  const [selectedShift, setSelectedShift] = useState<CashShift | null>(null);

  // Get current month for reports
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Queries
  const { data: storesData } = useAdminStores({ per_page: 100 });
  const { data: shiftsData, isLoading } = useCashShifts({
    store_id: storeFilter !== 'all' ? parseInt(storeFilter) : undefined,
    date: dateFilter || undefined,
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

            <div className="w-[180px]">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Data</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Filtrar por data"
              />
            </div>

            {(storeFilter !== 'all' || dateFilter) && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStoreFilter('all');
                    setDateFilter('');
                  }}
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
