/**
 * Divergências Page (Refactored)
 * 
 * Modern interface for managing pending cash shift approvals.
 * Features priority-based cards and approval/rejection workflow.
 */

import React, { useState } from 'react';
import {
  AlertTriangle, CheckCircle, XCircle, Clock, ChevronRight,
  Store, Calendar, User, DollarSign, AlertCircle, Loader2,
  MessageSquare, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/PageHeader';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import { usePendingShifts, useDivergentShifts } from '@/hooks/api/use-cash-shifts';
import { useCashClosing, useApproveClosing, useRejectClosing } from '@/hooks/api/use-cash-closings';
import { cn } from '@/lib/utils';
import { SHIFT_CODES, type PendingShift, type DivergentShift } from '@/types/conference.types';

// ============================================================
// Constants
// ============================================================

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'text-destructive bg-destructive/10 border-destructive/30';
    case 'medium': return 'text-amber-600 bg-amber-500/10 border-amber-500/30';
    default: return 'text-muted-foreground bg-muted border-border';
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'high': return 'Urgente';
    case 'medium': return 'Atenção';
    default: return 'Normal';
  }
};

// ============================================================
// Detail Modal Component
// ============================================================

interface DetailModalProps {
  shiftId: number | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

function DetailModal({ shiftId, onClose, onApprove, onReject, isApproving, isRejecting }: DetailModalProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const { data: closingData, isLoading } = useCashClosing(shiftId || 0, { enabled: !!shiftId });
  const closing = closingData?.data;

  if (!shiftId) return null;

  const handleReject = () => {
    if (rejectReason.length >= 10) {
      onReject(rejectReason);
    }
  };

  return (
    <Dialog open={!!shiftId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detalhes do Fechamento
          </DialogTitle>
          <DialogDescription>
            Revise os valores e aprove ou rejeite o fechamento.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : closing ? (
          <div className="space-y-4">
            {/* Shift Info */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <Badge variant="outline">{closing.cash_shift?.store?.name}</Badge>
              <Badge variant="outline">{closing.cash_shift?.date}</Badge>
              <Badge variant="outline">{SHIFT_CODES[closing.cash_shift?.shift_code || 'M']}</Badge>
              <Badge variant="outline">{closing.cash_shift?.seller?.name}</Badge>
            </div>

            {/* Lines */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Formas de Pagamento</Label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Forma</th>
                      <th className="text-right p-3 text-sm font-medium">Sistema</th>
                      <th className="text-right p-3 text-sm font-medium">Real</th>
                      <th className="text-right p-3 text-sm font-medium">Diferença</th>
                      <th className="text-left p-3 text-sm font-medium">Justificativa</th>
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
                        <td className="p-3 text-sm text-muted-foreground">
                          {line.justification_text || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50 font-medium">
                    <tr>
                      <td className="p-3">TOTAL</td>
                      <td className="p-3 text-right font-mono">
                        {formatCurrency(closing.lines.reduce((s, l) => s + l.system_value, 0))}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {formatCurrency(closing.lines.reduce((s, l) => s + l.real_value, 0))}
                      </td>
                      <td className={cn(
                        'p-3 text-right font-mono',
                        closing.lines.reduce((s, l) => s + l.diff_value, 0) === 0
                          ? 'text-green-600' : 'text-destructive'
                      )}>
                        {formatCurrency(closing.lines.reduce((s, l) => s + l.diff_value, 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Reject Form */}
            {showRejectForm && (
              <div className="space-y-2 p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                <Label className="text-destructive">Motivo da Rejeição *</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Descreva o motivo da rejeição (mín. 10 caracteres)..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {rejectReason.length}/10 caracteres mínimos
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum fechamento encontrado para este turno.
          </div>
        )}

        <DialogFooter className="gap-2">
          {showRejectForm ? (
            <>
              <Button variant="outline" onClick={() => setShowRejectForm(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectReason.length < 10 || isRejecting}
              >
                {isRejecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Confirmar Rejeição
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectForm(true)}
                disabled={!closing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
              <Button
                onClick={onApprove}
                disabled={!closing || isApproving}
              >
                {isApproving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Aprovar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Shift Card Component
// ============================================================

interface ShiftCardProps {
  shift: PendingShift | DivergentShift;
  type: 'pending' | 'divergent';
  onViewDetails: (id: number) => void;
  index: number;
}

function ShiftCard({ shift, type, onViewDetails, index }: ShiftCardProps) {
  const isDivergent = type === 'divergent';
  const divergentShift = shift as DivergentShift;
  const pendingShift = shift as PendingShift;

  return (
    <Card
      className={cn(
        'animate-fade-in hover:shadow-lg transition-all cursor-pointer group',
        isDivergent && !divergentShift.has_justification && 'border-destructive/50'
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => onViewDetails(shift.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Avatar & Info */}
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold',
              isDivergent
                ? 'bg-destructive/10 text-destructive'
                : pendingShift.priority === 'high'
                  ? 'bg-destructive/10 text-destructive'
                  : pendingShift.priority === 'medium'
                    ? 'bg-amber-500/10 text-amber-600'
                    : 'bg-primary/10 text-primary'
            )}>
              {shift.seller_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{shift.seller_name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Store className="h-3 w-3" />
                <span>{shift.store_name}</span>
                <span>•</span>
                <Calendar className="h-3 w-3" />
                <span>{formatDate(shift.date)}</span>
                <span>•</span>
                <span>{SHIFT_CODES[shift.shift_code]}</span>
              </div>
            </div>
          </div>

          {/* Right: Stats & Actions */}
          <div className="flex items-center gap-6">
            {/* Divergence Value (for divergent type) */}
            {isDivergent && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Divergência</p>
                <p className="text-xl font-bold text-destructive font-mono">
                  {formatCurrency(Math.abs(divergentShift.divergence))}
                </p>
              </div>
            )}

            {/* Days Pending */}
            <div className="flex items-center gap-2">
              {shift.days_pending > 0 && (
                <div className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-sm',
                  shift.days_pending > 2 ? 'bg-destructive/10 text-destructive' :
                    shift.days_pending > 0 ? 'bg-amber-500/10 text-amber-600' :
                      'bg-muted text-muted-foreground'
                )}>
                  <Clock className="h-3 w-3" />
                  <span>{shift.days_pending}d</span>
                </div>
              )}
            </div>

            {/* Priority Badge (for pending type) */}
            {!isDivergent && (
              <Badge className={cn('capitalize', getPriorityColor(pendingShift.priority))}>
                {getPriorityLabel(pendingShift.priority)}
              </Badge>
            )}

            {/* Justification Status (for divergent type) */}
            {isDivergent && (
              <Badge variant={divergentShift.has_justification ? 'secondary' : 'destructive'}>
                {divergentShift.has_justification ? 'Justificado' : 'Sem Justificativa'}
              </Badge>
            )}

            {/* Arrow */}
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Component
// ============================================================

const DivergenciasPage: React.FC = () => {
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);

  // Queries
  const { data: storesData } = useAdminStores({ per_page: 100 });
  const { data: pendingData, isLoading: pendingLoading } = usePendingShifts(
    storeFilter !== 'all' ? parseInt(storeFilter) : undefined
  );
  const { data: divergentData, isLoading: divergentLoading } = useDivergentShifts(
    storeFilter !== 'all' ? parseInt(storeFilter) : undefined
  );

  // Mutations
  const approveMutation = useApproveClosing();
  const rejectMutation = useRejectClosing();

  const pendingShifts = pendingData?.data?.shifts || [];
  const divergentShifts = divergentData?.data?.shifts || [];
  const totalPending = pendingData?.data?.total_pending || 0;
  const totalDivergent = divergentData?.data?.total_divergent || 0;
  const totalDivergenceValue = divergentData?.data?.total_divergence_value || 0;

  const handleApprove = async () => {
    if (selectedShiftId) {
      await approveMutation.mutateAsync(selectedShiftId);
      setSelectedShiftId(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (selectedShiftId) {
      await rejectMutation.mutateAsync({ shiftId: selectedShiftId, data: { reason } });
      setSelectedShiftId(null);
    }
  };

  const isLoading = pendingLoading || divergentLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Divergências Pendentes"
        description="Turnos aguardando conferência e aprovação"
        icon={AlertTriangle}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{totalPending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Com Divergência</p>
                <p className="text-2xl font-bold">{totalDivergent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <DollarSign className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Divergências</p>
                <p className="text-2xl font-bold text-destructive font-mono">
                  {formatCurrency(Math.abs(totalDivergenceValue))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && pendingShifts.length === 0 && divergentShifts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-medium">Tudo em dia!</p>
            <p className="text-muted-foreground">Não há turnos pendentes de conferência.</p>
          </CardContent>
        </Card>
      )}

      {/* Divergent Shifts (Priority) */}
      {divergentShifts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Com Divergências ({divergentShifts.length})
          </h2>
          <div className="space-y-3">
            {divergentShifts.map((shift, index) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                type="divergent"
                onViewDetails={setSelectedShiftId}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending Shifts */}
      {pendingShifts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            Aguardando Conferência ({pendingShifts.length})
          </h2>
          <div className="space-y-3">
            {pendingShifts.map((shift, index) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                type="pending"
                onViewDetails={setSelectedShiftId}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <DetailModal
        shiftId={selectedShiftId}
        onClose={() => setSelectedShiftId(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        isApproving={approveMutation.isPending}
        isRejecting={rejectMutation.isPending}
      />
    </div>
  );
};

export default DivergenciasPage;
