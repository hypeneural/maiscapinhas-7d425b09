/**
 * Divergências Page (Refactored)
 * 
 * Modern interface for managing pending cash shift approvals.
 * Features priority-based cards and approval/rejection workflow.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, CheckCircle, XCircle, Clock, ChevronRight,
  Store, Calendar, User, DollarSign, AlertCircle, Loader2,
  MessageSquare, Eye, Filter, Search, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/PageHeader';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import { useDivergentShifts } from '@/hooks/api/use-cash-shifts';
import { useCashClosing, useApproveClosing, useRejectClosing } from '@/hooks/api/use-cash-closings';
import { cn } from '@/lib/utils';
import type { DivergentShift } from '@/types/conference.types';

// ============================================================
// Constants
// ============================================================

type JustificationFilter = 'all' | 'with' | 'without';
type ConfirmationAction = 'approve' | 'reject' | null;

const SHIFT_LABELS: Record<string, string> = {
  '1': '1° Turno',
  '2': '2° Turno',
  '3': '3° Turno',
  M: '1° Turno',
  T: '2° Turno',
  N: '3° Turno',
};

const SHIFT_ORDER: Record<string, number> = {
  '1': 1,
  '2': 2,
  '3': 3,
};

const normalizeShiftCode = (value: unknown): string => {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === 'M') return '1';
  if (raw === 'T') return '2';
  if (raw === 'N') return '3';
  return raw;
};

const getShiftLabel = (value: unknown): string => {
  const normalized = normalizeShiftCode(value);
  return SHIFT_LABELS[normalized] ?? `Turno ${String(value ?? '-')}`;
};

const extractDateKey = (value: unknown): string | null => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? null;
};

const parseDateValue = (value: unknown): Date | null => {
  const dateKey = extractDateKey(value);
  if (dateKey) {
    const localNoon = new Date(`${dateKey}T12:00:00`);
    if (!Number.isNaN(localNoon.getTime())) return localNoon;
  }

  const raw = String(value ?? '').trim();
  if (!raw) return null;

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateShort = (value: unknown): string => {
  const date = parseDateValue(value);
  if (!date) return 'Data invalida';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
};

const formatDateFull = (value: unknown): string => {
  const date = parseDateValue(value);
  if (!date) return 'Data invalida';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const formatCurrency = (value: unknown) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(toNumber(value));
};

const formatSignedCurrency = (value: unknown): string => {
  const number = toNumber(value);
  const absFormatted = formatCurrency(Math.abs(number));
  if (number > 0) return `+${absFormatted}`;
  if (number < 0) return `-${absFormatted}`;
  return absFormatted;
};

const getStatusLabel = (status: string | undefined): string => {
  switch (status) {
    case 'submitted': return 'Aguardando aprovacao';
    case 'approved': return 'Aprovado';
    case 'rejected': return 'Rejeitado';
    case 'draft': return 'Rascunho';
    default: return status || 'Nao informado';
  }
};

// ============================================================
// Detail Modal Component
// ============================================================

interface DetailModalProps {
  shiftId: number | null;
  selectedShift: DivergentShift | null;
  onClose: () => void;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  isApproving: boolean;
  isRejecting: boolean;
}

function DetailModal({
  shiftId,
  selectedShift,
  onClose,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: DetailModalProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<ConfirmationAction>(null);

  const { data: closingData, isLoading } = useCashClosing(shiftId || 0, { enabled: !!shiftId });
  const closing = closingData?.data;

  useEffect(() => {
    if (!shiftId) {
      setRejectReason('');
      setShowRejectForm(false);
      setConfirmationAction(null);
    }
  }, [shiftId]);

  if (!shiftId) return null;

  const lines = closing?.lines || [];
  const totals = lines.reduce(
    (acc, line) => {
      acc.system += toNumber(line.system_value);
      acc.real += toNumber(line.real_value);
      acc.diff += toNumber(line.diff_value);
      return acc;
    },
    { system: 0, real: 0, diff: 0 }
  );

  const storeName = closing?.cash_shift?.store?.name ?? selectedShift?.store_name ?? 'Loja nao informada';
  const sellerName = closing?.cash_shift?.seller?.name ?? selectedShift?.seller_name ?? 'Vendedor nao informado';
  const shiftDate = closing?.cash_shift?.date ?? selectedShift?.date;
  const shiftCode = closing?.cash_shift?.shift_code ?? selectedShift?.shift_code;
  const isSubmitted = closing?.status === 'submitted';

  const isConfirmingAction = confirmationAction === 'approve' ? isApproving : isRejecting;

  const runConfirmation = async () => {
    try {
      if (confirmationAction === 'approve') {
        await onApprove();
        setConfirmationAction(null);
        return;
      }

      if (confirmationAction === 'reject') {
        await onReject(rejectReason.trim());
        setConfirmationAction(null);
      }
    } catch {
      // Mutation hooks already show toast feedback on API failures.
    }
  };

  return (
    <>
      <Dialog open={!!shiftId} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes do Fechamento
            </DialogTitle>
            <DialogDescription>
              Confira os valores e valide o fechamento com seguranca.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : closing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Badge variant="outline" className="justify-start gap-2 px-3 py-1.5">
                  <Store className="h-3.5 w-3.5" />
                  {storeName}
                </Badge>
                <Badge variant="outline" className="justify-start gap-2 px-3 py-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateFull(shiftDate)}
                </Badge>
                <Badge variant="outline" className="justify-start gap-2 px-3 py-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {getShiftLabel(shiftCode)}
                </Badge>
                <Badge variant="outline" className="justify-start gap-2 px-3 py-1.5">
                  <User className="h-3.5 w-3.5" />
                  {sellerName}
                </Badge>
              </div>

              <Alert className="bg-muted/40">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Status atual: {getStatusLabel(closing.status)}</AlertTitle>
                <AlertDescription>
                  Aprovacao e reprovacao alteram o fluxo do fechamento e nao devem ser executadas sem revisao.
                </AlertDescription>
              </Alert>

              {closing.justification_text && (
                <div className="rounded-lg border border-amber-300/50 bg-amber-50/70 p-4">
                  <h4 className="mb-1 flex items-center gap-2 font-semibold text-amber-800">
                    <MessageSquare className="h-4 w-4" />
                    Justificativa informada
                  </h4>
                  <p className="text-sm text-amber-900 whitespace-pre-wrap">{closing.justification_text}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Formas de Pagamento</Label>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[620px]">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-3 text-left text-sm font-medium">Forma</th>
                        <th className="p-3 text-right text-sm font-medium">Sistema</th>
                        <th className="p-3 text-right text-sm font-medium">Real</th>
                        <th className="p-3 text-right text-sm font-medium">Diferenca</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line) => {
                        const systemValue = toNumber(line.system_value);
                        const realValue = toNumber(line.real_value);
                        const diffValue = toNumber(line.diff_value);
                        return (
                          <tr
                            key={line.id}
                            className={cn(
                              'border-t',
                              diffValue !== 0 && 'bg-destructive/5'
                            )}
                          >
                            <td className="p-3 font-medium">{line.label}</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(systemValue)}</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(realValue)}</td>
                            <td
                              className={cn(
                                'p-3 text-right font-mono font-medium',
                                diffValue === 0
                                  ? 'text-emerald-600'
                                  : diffValue > 0
                                    ? 'text-emerald-600'
                                    : 'text-destructive'
                              )}
                            >
                              {formatSignedCurrency(diffValue)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-muted/50 font-medium">
                      <tr>
                        <td className="p-3">TOTAL</td>
                        <td className="p-3 text-right font-mono">{formatCurrency(totals.system)}</td>
                        <td className="p-3 text-right font-mono">{formatCurrency(totals.real)}</td>
                        <td
                          className={cn(
                            'p-3 text-right font-mono',
                            totals.diff === 0
                              ? 'text-emerald-600'
                              : totals.diff > 0
                                ? 'text-emerald-600'
                                : 'text-destructive'
                          )}
                        >
                          {formatSignedCurrency(totals.diff)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {showRejectForm && (
                <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <Label className="text-destructive">Motivo da reprovacao *</Label>
                  <Textarea
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Explique o motivo da reprovacao (minimo de 10 caracteres)."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {rejectReason.trim().length}/10 caracteres minimos
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              Nao foi encontrado fechamento para este turno.
            </div>
          )}

          <DialogFooter className="gap-2">
            {showRejectForm ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectReason('');
                  }}
                  disabled={isRejecting}
                >
                  Voltar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setConfirmationAction('reject')}
                  disabled={rejectReason.trim().length < 10 || isRejecting || !isSubmitted}
                >
                  {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                  Reprovar fechamento
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
                  disabled={!closing || !isSubmitted}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reprovar
                </Button>
                <Button
                  onClick={() => setConfirmationAction('approve')}
                  disabled={!closing || !isSubmitted || isApproving}
                >
                  {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  Aprovar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmationAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmationAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmationAction === 'approve'
                ? 'Confirmar aprovacao definitiva?'
                : 'Confirmar reprovacao definitiva?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationAction === 'approve'
                ? 'Esta acao aprova o fechamento e encerra o fluxo de analise nesta tela.'
                : 'Esta acao reprova o fechamento e exige novo ajuste antes de reenviar para conferencia.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirmingAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void runConfirmation();
              }}
              disabled={isConfirmingAction}
              className={confirmationAction === 'reject' ? 'bg-destructive hover:bg-destructive/90' : undefined}
            >
              {isConfirmingAction ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : confirmationAction === 'approve' ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              {confirmationAction === 'approve' ? 'Aprovar agora' : 'Reprovar agora'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================
// Shift Card Component
// ============================================================

interface ShiftCardProps {
  shift: DivergentShift;
  onViewDetails: (id: number) => void;
  index: number;
}

function ShiftCard({ shift, onViewDetails, index }: ShiftCardProps) {
  const divergence = toNumber(shift.divergence);
  const isNegative = divergence < 0;
  const pendingClass = shift.days_pending >= 3
    ? 'bg-destructive/10 text-destructive border-destructive/40'
    : shift.days_pending > 0
      ? 'bg-amber-500/10 text-amber-700 border-amber-500/40'
      : 'bg-muted text-muted-foreground border-border';

  return (
    <Card
      className={cn(
        'cursor-pointer border transition-all hover:-translate-y-0.5 hover:shadow-md animate-fade-in',
        !shift.has_justification && 'border-destructive/40'
      )}
      style={{ animationDelay: `${index * 0.04}s` }}
      onClick={() => onViewDetails(shift.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
              !shift.has_justification ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
            )}>
              {shift.seller_name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 space-y-1">
              <p className="truncate font-semibold">{shift.seller_name}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Store className="h-3.5 w-3.5" />
                  {shift.store_name}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateShort(shift.date)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {getShiftLabel(shift.shift_code)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Divergencia</p>
              <p className={cn(
                'font-mono text-lg font-bold',
                isNegative ? 'text-destructive' : 'text-emerald-600'
              )}>
                {formatSignedCurrency(divergence)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={shift.has_justification ? 'secondary' : 'destructive'}>
                {shift.has_justification ? 'Com justificativa' : 'Sem justificativa'}
              </Badge>
              <Badge variant="outline" className={cn('border', pendingClass)}>
                {shift.days_pending}d pendente
              </Badge>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
  const [storeFilter, setStoreFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [sellerFilter, setSellerFilter] = useState('all');
  const [justificationFilter, setJustificationFilter] = useState<JustificationFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);

  const selectedStoreId = storeFilter !== 'all' ? Number.parseInt(storeFilter, 10) : undefined;
  const safeStoreId = selectedStoreId !== undefined && !Number.isNaN(selectedStoreId)
    ? selectedStoreId
    : undefined;

  const { data: storesData } = useAdminStores({ per_page: 100 });
  const { data: divergentData, isLoading: divergentLoading, isFetching: divergentFetching } = useDivergentShifts(
    safeStoreId
  );

  const approveMutation = useApproveClosing();
  const rejectMutation = useRejectClosing();

  const divergentShifts = useMemo(
    () => divergentData?.data?.shifts ?? [],
    [divergentData]
  );

  const dateOptions = useMemo(() => {
    const uniqueDateKeys = new Set<string>();
    divergentShifts.forEach((shift) => {
      const dateKey = extractDateKey(shift.date);
      if (dateKey) uniqueDateKeys.add(dateKey);
    });

    return Array.from(uniqueDateKeys)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((dateKey) => ({
        value: dateKey,
        label: formatDateFull(dateKey),
      }));
  }, [divergentShifts]);

  const shiftOptions = useMemo(() => {
    const uniqueShifts = new Set<string>();
    divergentShifts.forEach((shift) => {
      const normalized = normalizeShiftCode(shift.shift_code);
      if (normalized) uniqueShifts.add(normalized);
    });

    return Array.from(uniqueShifts)
      .sort((a, b) => (SHIFT_ORDER[a] ?? 99) - (SHIFT_ORDER[b] ?? 99))
      .map((code) => ({
        value: code,
        label: getShiftLabel(code),
      }));
  }, [divergentShifts]);

  const sellerOptions = useMemo(() => {
    const uniqueNames = new Set<string>();
    divergentShifts.forEach((shift) => {
      if (shift.seller_name) uniqueNames.add(shift.seller_name);
    });
    return Array.from(uniqueNames)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((name) => ({
        value: name,
        label: name,
      }));
  }, [divergentShifts]);

  useEffect(() => {
    if (dateFilter !== 'all' && !dateOptions.some((option) => option.value === dateFilter)) {
      setDateFilter('all');
    }
  }, [dateFilter, dateOptions]);

  useEffect(() => {
    if (shiftFilter !== 'all' && !shiftOptions.some((option) => option.value === shiftFilter)) {
      setShiftFilter('all');
    }
  }, [shiftFilter, shiftOptions]);

  useEffect(() => {
    if (sellerFilter !== 'all' && !sellerOptions.some((option) => option.value === sellerFilter)) {
      setSellerFilter('all');
    }
  }, [sellerFilter, sellerOptions]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredShifts = useMemo(() => {
    return divergentShifts.filter((shift) => {
      if (dateFilter !== 'all') {
        if (extractDateKey(shift.date) !== dateFilter) return false;
      }

      if (shiftFilter !== 'all') {
        if (normalizeShiftCode(shift.shift_code) !== shiftFilter) return false;
      }

      if (sellerFilter !== 'all' && shift.seller_name !== sellerFilter) {
        return false;
      }

      if (justificationFilter === 'with' && !shift.has_justification) {
        return false;
      }

      if (justificationFilter === 'without' && shift.has_justification) {
        return false;
      }

      if (normalizedSearch) {
        const searchable = `${shift.store_name} ${shift.seller_name} ${getShiftLabel(shift.shift_code)} ${extractDateKey(shift.date) ?? ''}`.toLowerCase();
        if (!searchable.includes(normalizedSearch)) {
          return false;
        }
      }

      return true;
    });
  }, [
    dateFilter,
    divergentShifts,
    justificationFilter,
    normalizedSearch,
    sellerFilter,
    shiftFilter,
  ]);

  const sortedShifts = useMemo(() => {
    return [...filteredShifts].sort((a, b) => {
      if (a.has_justification !== b.has_justification) {
        return a.has_justification ? 1 : -1;
      }

      const divergenceDelta = Math.abs(toNumber(b.divergence)) - Math.abs(toNumber(a.divergence));
      if (divergenceDelta !== 0) return divergenceDelta;

      const pendingDelta = b.days_pending - a.days_pending;
      if (pendingDelta !== 0) return pendingDelta;

      const dateA = extractDateKey(a.date) ?? '';
      const dateB = extractDateKey(b.date) ?? '';
      return dateA < dateB ? 1 : -1;
    });
  }, [filteredShifts]);

  const selectedShift = useMemo(
    () => divergentShifts.find((shift) => shift.id === selectedShiftId) ?? null,
    [divergentShifts, selectedShiftId]
  );

  const filteredTotals = useMemo(() => {
    const total = sortedShifts.length;
    const withJustification = sortedShifts.filter((shift) => shift.has_justification).length;
    const withoutJustification = total - withJustification;
    const sum = sortedShifts.reduce((acc, shift) => acc + toNumber(shift.divergence), 0);
    return {
      total,
      withJustification,
      withoutJustification,
      sum,
    };
  }, [sortedShifts]);

  const hasActiveFilters = (
    storeFilter !== 'all'
    || dateFilter !== 'all'
    || shiftFilter !== 'all'
    || sellerFilter !== 'all'
    || justificationFilter !== 'all'
    || searchTerm.trim() !== ''
  );

  const clearFilters = () => {
    setStoreFilter('all');
    setDateFilter('all');
    setShiftFilter('all');
    setSellerFilter('all');
    setJustificationFilter('all');
    setSearchTerm('');
  };

  const handleApprove = async () => {
    if (!selectedShiftId) return;
    await approveMutation.mutateAsync(selectedShiftId);
    setSelectedShiftId(null);
  };

  const handleReject = async (reason: string) => {
    if (!selectedShiftId) return;
    await rejectMutation.mutateAsync({ shiftId: selectedShiftId, data: { reason } });
    setSelectedShiftId(null);
  };

  const isLoading = divergentLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Conferencia de Divergencias"
        description="Revise fechamentos enviados, filtre por turno e confirme a decisao final com seguranca."
        icon={AlertTriangle}
      />

      <Alert className="border-amber-300/50 bg-amber-50/70">
        <AlertTriangle className="h-4 w-4 text-amber-700" />
        <AlertTitle>Fluxo recomendado</AlertTitle>
        <AlertDescription>
          Confira valores de sistema e real no detalhe antes de aprovar ou reprovar. Essas acoes exigem confirmacao e impactam o fluxo do turno.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2.5">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registros listados</p>
                <p className="text-2xl font-bold">{filteredTotals.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/10 p-2.5">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sem justificativa</p>
                <p className="text-2xl font-bold text-destructive">{filteredTotals.withoutJustification}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-500/10 p-2.5">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Com justificativa</p>
                <p className="text-2xl font-bold text-emerald-600">{filteredTotals.withJustification}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/10 p-2.5">
                <DollarSign className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Soma das divergencias</p>
                <p className={cn(
                  'text-2xl font-bold font-mono',
                  filteredTotals.sum < 0 ? 'text-destructive' : 'text-emerald-600'
                )}>
                  {formatSignedCurrency(filteredTotals.sum)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtros de conferencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Select value={storeFilter} onValueChange={setStoreFilter}>
              <SelectTrigger>
                <Store className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Todas as lojas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as lojas</SelectItem>
                {storesData?.data?.map((store) => (
                  <SelectItem key={store.id} value={String(store.id)}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Todas as datas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as datas</SelectItem>
                {dateOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={shiftFilter} onValueChange={setShiftFilter}>
              <SelectTrigger>
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Todos os turnos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os turnos</SelectItem>
                {shiftOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sellerFilter} onValueChange={setSellerFilter}>
              <SelectTrigger>
                <User className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Todos os vendedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os vendedores</SelectItem>
                {sellerOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={justificationFilter}
              onValueChange={(value: JustificationFilter) => setJustificationFilter(value)}
            >
              <SelectTrigger>
                <AlertCircle className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status justificativa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as situacoes</SelectItem>
                <SelectItem value="without">Sem justificativa</SelectItem>
                <SelectItem value="with">Com justificativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por loja, vendedor, turno ou data..."
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && sortedShifts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            {divergentShifts.length === 0 ? (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="text-lg font-medium">Nenhuma divergencia pendente</p>
                <p className="text-muted-foreground">Nao ha fechamentos submetidos com diferenca para revisao.</p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Filter className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">Nenhum resultado com os filtros atuais</p>
                <p className="text-muted-foreground">Ajuste os filtros para encontrar os turnos desejados.</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && sortedShifts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Divergencias para analise ({sortedShifts.length})
            </h2>
            {divergentFetching && (
              <Badge variant="outline" className="gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Atualizando
              </Badge>
            )}
          </div>
          <div className="space-y-3">
            {sortedShifts.map((shift, index) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                onViewDetails={setSelectedShiftId}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      <DetailModal
        shiftId={selectedShiftId}
        selectedShift={selectedShift}
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
