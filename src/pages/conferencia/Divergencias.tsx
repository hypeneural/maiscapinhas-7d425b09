/**
 * Divergências Page (Refactored)
 * 
 * Modern interface for managing pending cash shift approvals.
 * Features priority-based cards and approval/rejection workflow.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, CheckCircle, XCircle, Clock, ChevronRight,
  Store, Calendar, User, UserCheck, AlertCircle, Loader2,
  MessageSquare, Eye, Filter, Search, RotateCcw, ShieldCheck,
  Sparkles, ChevronDown, ChevronUp, SlidersHorizontal, Paperclip, FileText, ExternalLink
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PageHeader } from '@/components/PageHeader';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import { useDivergentShifts } from '@/hooks/api/use-cash-shifts';
import { useCashClosing, useApproveClosing, useRejectClosing } from '@/hooks/api/use-cash-closings';
import { cn } from '@/lib/utils';
import type { DivergentShift } from '@/types/conference.types';
import { sanitizeStorageUrl } from '@/types/conference.types';
import { formatDateTimeSaoPaulo } from '@/lib/datetime';

// ============================================================
// Constants
// ============================================================

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
    case 'rejected': return 'Reprovado';
    default: return status || 'Nao informado';
  }
};

const getPendingBadgeClass = (daysPending: number): string => {
  if (daysPending >= 3) return 'bg-destructive/10 text-destructive border-destructive/40';
  if (daysPending > 0) return 'bg-amber-500/10 text-amber-700 border-amber-500/40';
  return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30';
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
  const [confirmationAction, setConfirmationAction] = useState<ConfirmationAction>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data: closingData, isLoading } = useCashClosing(shiftId || 0, { enabled: !!shiftId });
  const closing = closingData?.data;

  useEffect(() => {
    if (!shiftId) {
      setRejectReason('');
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
  const confirmationConfig = confirmationAction === 'approve'
    ? {
      title: 'Confirmar aprovacao definitiva?',
      description: 'Aprovando agora, o fechamento e finalizado e sai da fila de analise.',
      confirmLabel: 'Aprovar definitivamente',
      icon: ShieldCheck,
      iconClassName: 'bg-emerald-500/15 text-emerald-600 ring-emerald-500/30',
      barClassName: 'bg-emerald-500',
      buttonClassName: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      noteTitle: 'Acao irreversivel',
      noteDescription: 'Confira os valores antes de concluir a aprovacao final.',
      noteClassName: 'border-emerald-500/30 bg-emerald-500/10',
    }
    : {
      title: 'Confirmar reprovacao definitiva?',
      description: 'Ao reprovar, o fechamento retorna para ajuste e precisara ser reenviado.',
      confirmLabel: 'Reprovar definitivamente',
      icon: XCircle,
      iconClassName: 'bg-destructive/15 text-destructive ring-destructive/30',
      barClassName: 'bg-destructive',
      buttonClassName: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
      noteTitle: 'Exige nova correcao',
      noteDescription: 'A reprovacao deve ser usada apenas quando os dados nao estiverem validos.',
      noteClassName: 'border-destructive/30 bg-destructive/10',
    };
  const ConfirmationIcon = confirmationConfig.icon;

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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
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
                  Vendedor: {sellerName}
                </Badge>
              </div>

              {/* Conferente info */}
              {(selectedShift?.conferente_name || selectedShift?.submitted_at) && (
                <div className="grid grid-cols-1 gap-2">
                  <Badge variant="outline" className="justify-start gap-2 px-3 py-1.5 border-primary/30 bg-primary/5">
                    <UserCheck className="h-3.5 w-3.5 text-primary" />
                    Enviado: {selectedShift.submitted_at ? formatDateTimeSaoPaulo(selectedShift.submitted_at) : '-'}
                    {selectedShift.conferente_name && <> por <span className="font-semibold">{selectedShift.conferente_name}</span></>}
                  </Badge>
                </div>
              )}

              <Alert className="border-primary/20 bg-primary/5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <AlertTitle className="flex items-center gap-2">
                  Status atual: {getStatusLabel(closing.status)}
                  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                    Pronto para decisao final
                  </Badge>
                </AlertTitle>
                <AlertDescription>
                  Valide o fechamento apenas apos conferir a justificativa e os valores por meio de pagamento.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Total sistema</p>
                  <p className="font-mono text-lg font-semibold">{formatCurrency(totals.system)}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Total real</p>
                  <p className="font-mono text-lg font-semibold">{formatCurrency(totals.real)}</p>
                </div>
                <div className={cn(
                  'rounded-lg border p-3',
                  totals.diff === 0 ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-destructive/30 bg-destructive/10'
                )}>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Diferenca</p>
                  <p className={cn(
                    'font-mono text-lg font-semibold',
                    totals.diff === 0 ? 'text-emerald-700' : 'text-destructive'
                  )}>
                    {formatSignedCurrency(totals.diff)}
                  </p>
                </div>
              </div>

              {closing.justification_text && (
                <div className="rounded-lg border border-amber-300/50 bg-amber-50/70 p-4">
                  <h4 className="mb-1 flex items-center gap-2 font-semibold text-amber-800">
                    <MessageSquare className="h-4 w-4" />
                    Justificativa do Vendedor
                  </h4>
                  <p className="text-sm text-amber-900 whitespace-pre-wrap">{closing.justification_text}</p>
                </div>
              )}

              {closing.observer_notes && (
                <div className="rounded-lg border border-blue-300/50 bg-blue-50/70 p-4">
                  <h4 className="mb-1 flex items-center gap-2 font-semibold text-blue-800">
                    <Eye className="h-4 w-4" />
                    Observacoes do Conferente
                  </h4>
                  <p className="text-sm text-blue-900 whitespace-pre-wrap">{closing.observer_notes}</p>
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

              {/* Documentos Anexados */}
              {(closing.attachments?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Paperclip className="h-3.5 w-3.5" />
                    Documentos Anexados ({closing.attachments!.length})
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {closing.attachments!.map(att => (
                      <div key={att.id} className="rounded-lg border bg-muted/20 overflow-hidden group">
                        {att.file_type.startsWith('image/') ? (
                          <button
                            type="button"
                            className="w-full"
                            onClick={(e) => { e.stopPropagation(); setPreviewImage(sanitizeStorageUrl(att.url)); }}
                          >
                            <img
                              src={sanitizeStorageUrl(att.url)}
                              alt={att.file_name}
                              className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="p-2">
                              <p className="text-xs font-medium truncate">{att.file_name}</p>
                              <p className="text-[10px] text-muted-foreground">Clique para ampliar</p>
                            </div>
                          </button>
                        ) : (
                          <a
                            href={sanitizeStorageUrl(att.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center p-4 gap-2 hover:bg-muted/40"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText className="h-10 w-10 text-red-500" />
                            <p className="text-xs font-medium truncate w-full text-center">{att.file_name}</p>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" /> Abrir PDF
                            </span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              Nao foi encontrado fechamento para este turno.
            </div>
          )}

          <DialogFooter className="gap-2 border-t pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setRejectReason('');
                setConfirmationAction('reject');
              }}
              disabled={!closing || !isSubmitted}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reprovar
            </Button>
            <Button
              onClick={() => setConfirmationAction('approve')}
              disabled={!closing || !isSubmitted || isApproving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmationAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmationAction(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-xl overflow-hidden p-0">
          <div className={cn('h-1.5 w-full', confirmationConfig.barClassName)} />

          <div className="space-y-5 p-6">
            <AlertDialogHeader className="space-y-3 text-center">
              <div className="flex justify-center">
                <div className={cn(
                  'relative flex h-16 w-16 items-center justify-center rounded-full ring-4',
                  confirmationConfig.iconClassName
                )}>
                  <ConfirmationIcon className={cn(
                    'h-8 w-8',
                    confirmationAction === 'approve' ? 'animate-bounce' : 'animate-pulse'
                  )} />
                  {confirmationAction === 'reject' && (
                    <span className="absolute inset-0 rounded-full border-2 border-destructive/40 animate-ping" />
                  )}
                </div>
              </div>

              <AlertDialogTitle className="text-xl">{confirmationConfig.title}</AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-relaxed">
                {confirmationConfig.description}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className={cn('rounded-lg border p-3 text-sm', confirmationConfig.noteClassName)}>
              <p className="font-semibold">{confirmationConfig.noteTitle}</p>
              <p className="mt-1 text-muted-foreground">{confirmationConfig.noteDescription}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Loja</p>
                <p className="font-medium">{storeName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Vendedor</p>
                <p className="font-medium">{sellerName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Data</p>
                <p className="font-medium">{formatDateFull(shiftDate)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Turno</p>
                <p className="font-medium">{getShiftLabel(shiftCode)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-3 text-center">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Sistema</p>
                <p className="font-mono font-semibold">{formatCurrency(totals.system)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Real</p>
                <p className="font-mono font-semibold">{formatCurrency(totals.real)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Diferenca</p>
                <p className={cn(
                  'font-mono font-semibold',
                  totals.diff === 0 ? 'text-emerald-700' : 'text-destructive'
                )}>
                  {formatSignedCurrency(totals.diff)}
                </p>
              </div>
            </div>

            {confirmationAction === 'reject' && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Motivo da reprovacao (opcional)</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Informe o motivo da reprovacao, se desejar."
                  rows={3}
                />
              </div>
            )}
          </div>

          <AlertDialogFooter className="border-t bg-muted/20 px-6 py-4">
            <AlertDialogCancel disabled={isConfirmingAction} className="min-w-[120px]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void runConfirmation();
              }}
              disabled={isConfirmingAction}
              className={cn('min-w-[220px] gap-2', confirmationConfig.buttonClassName)}
            >
              {isConfirmingAction ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ConfirmationIcon className="h-4 w-4" />
              )}
              {confirmationConfig.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Lightbox Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-2 bg-black/95 border-none [&>button]:text-white [&>button]:hover:bg-white/20">
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-auto max-h-[90vh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>
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
  const pendingClass = getPendingBadgeClass(shift.days_pending);
  const justPreview = shift.justification_text?.trim();
  const obsPreview = shift.observer_notes?.trim();

  const submittedLabel = shift.submitted_at
    ? `${formatDateTimeSaoPaulo(shift.submitted_at)}${shift.conferente_name ? ` por ${shift.conferente_name}` : ''}`
    : null;

  return (
    <Card
      className={cn(
        'group relative cursor-pointer overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-lg animate-fade-in',
        shift.days_pending >= 3 && 'border-destructive/40 shadow-destructive/5'
      )}
      style={{ animationDelay: `${index * 0.04}s` }}
      onClick={() => onViewDetails(shift.id)}
    >
      <div className={cn(
        'h-1.5 w-full',
        shift.days_pending >= 3 ? 'bg-destructive' : shift.days_pending > 0 ? 'bg-amber-500' : 'bg-emerald-500'
      )} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
              shift.days_pending >= 3 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
            )}>
              {shift.seller_name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 space-y-1.5">
              {/* Seller + Store */}
              <p className="truncate font-semibold">{shift.seller_name}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Store className="h-3.5 w-3.5" />
                  {shift.store_name}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateShort(shift.date)} · {getShiftLabel(shift.shift_code)}
                </span>
              </div>

              {/* Submitted info: "Enviado: 27/02/2026, 09:14 por XXXXX" */}
              {submittedLabel && (
                <div className="flex items-center gap-1.5 text-xs">
                  <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-primary">
                    Enviado: <span className="font-medium">{submittedLabel}</span>
                  </span>
                </div>
              )}

              {/* Justification previews */}
              {(justPreview || obsPreview) && (
                <div className="space-y-1 mt-1">
                  {justPreview && (
                    <div className="flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-500/5 rounded px-2 py-1 max-w-md">
                      <MessageSquare className="h-3 w-3 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        <span className="font-medium">Vendedor:</span> {justPreview.length > 80 ? justPreview.slice(0, 80) + '...' : justPreview}
                      </span>
                    </div>
                  )}
                  {obsPreview && (
                    <div className="flex items-start gap-1.5 text-[11px] text-blue-700 bg-blue-500/5 rounded px-2 py-1 max-w-md">
                      <Eye className="h-3 w-3 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        <span className="font-medium">Conferente:</span> {obsPreview.length > 80 ? obsPreview.slice(0, 80) + '...' : obsPreview}
                      </span>
                    </div>
                  )}
                </div>
              )}
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
              <Badge variant="secondary" className="border-primary/20 bg-primary/10 text-primary">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                Aguardando aprovacao
              </Badge>
              <Badge variant="outline" className={cn('border', pendingClass)}>
                <Clock className="mr-1 h-3.5 w-3.5" />
                {shift.days_pending}d pendente
              </Badge>
              {(shift.attachments?.length ?? 0) > 0 && (
                <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
                  <Paperclip className="mr-1 h-3.5 w-3.5" />
                  {shift.attachments!.length} anexo{shift.attachments!.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const approvalQueueShifts = useMemo(
    () => divergentShifts.filter((shift) => shift.has_justification),
    [divergentShifts]
  );

  const dateOptions = useMemo(() => {
    const uniqueDateKeys = new Set<string>();
    approvalQueueShifts.forEach((shift) => {
      const dateKey = extractDateKey(shift.date);
      if (dateKey) uniqueDateKeys.add(dateKey);
    });

    return Array.from(uniqueDateKeys)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((dateKey) => ({
        value: dateKey,
        label: formatDateFull(dateKey),
      }));
  }, [approvalQueueShifts]);

  const shiftOptions = useMemo(() => {
    const uniqueShifts = new Set<string>();
    approvalQueueShifts.forEach((shift) => {
      const normalized = normalizeShiftCode(shift.shift_code);
      if (normalized) uniqueShifts.add(normalized);
    });

    return Array.from(uniqueShifts)
      .sort((a, b) => (SHIFT_ORDER[a] ?? 99) - (SHIFT_ORDER[b] ?? 99))
      .map((code) => ({
        value: code,
        label: getShiftLabel(code),
      }));
  }, [approvalQueueShifts]);

  const sellerOptions = useMemo(() => {
    const uniqueNames = new Set<string>();
    approvalQueueShifts.forEach((shift) => {
      if (shift.seller_name) uniqueNames.add(shift.seller_name);
    });
    return Array.from(uniqueNames)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((name) => ({
        value: name,
        label: name,
      }));
  }, [approvalQueueShifts]);

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
    return approvalQueueShifts.filter((shift) => {
      if (dateFilter !== 'all') {
        if (extractDateKey(shift.date) !== dateFilter) return false;
      }

      if (shiftFilter !== 'all') {
        if (normalizeShiftCode(shift.shift_code) !== shiftFilter) return false;
      }

      if (sellerFilter !== 'all' && shift.seller_name !== sellerFilter) {
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
    approvalQueueShifts,
    dateFilter,
    normalizedSearch,
    sellerFilter,
    shiftFilter,
  ]);

  const sortedShifts = useMemo(() => {
    return [...filteredShifts].sort((a, b) => {
      // Oldest first (ascending days_pending — more days pending = older = show first)
      const pendingDelta = b.days_pending - a.days_pending;
      if (pendingDelta !== 0) return pendingDelta;

      // Then by date ascending (oldest date first)
      const dateA = extractDateKey(a.date) ?? '';
      const dateB = extractDateKey(b.date) ?? '';
      if (dateA !== dateB) return dateA < dateB ? -1 : 1;

      // Then by shift code ascending
      const shiftA = SHIFT_ORDER[normalizeShiftCode(a.shift_code)] ?? 99;
      const shiftB = SHIFT_ORDER[normalizeShiftCode(b.shift_code)] ?? 99;
      return shiftA - shiftB;
    });
  }, [filteredShifts]);

  const selectedShift = useMemo(
    () => divergentShifts.find((shift) => shift.id === selectedShiftId) ?? null,
    [divergentShifts, selectedShiftId]
  );

  const filteredTotals = useMemo(() => {
    const total = sortedShifts.length;
    const sum = sortedShifts.reduce((acc, shift) => acc + toNumber(shift.divergence), 0);
    const averagePendingDays = total > 0
      ? sortedShifts.reduce((acc, shift) => acc + shift.days_pending, 0) / total
      : 0;
    const criticalCount = sortedShifts.filter((shift) => shift.days_pending >= 3).length;
    const maxAbsDivergence = sortedShifts.reduce((max, shift) => {
      const absValue = Math.abs(toNumber(shift.divergence));
      return absValue > max ? absValue : max;
    }, 0);

    return {
      total,
      sum,
      averagePendingDays,
      criticalCount,
      maxAbsDivergence,
    };
  }, [sortedShifts]);

  const hasActiveFilters = (
    storeFilter !== 'all'
    || dateFilter !== 'all'
    || shiftFilter !== 'all'
    || sellerFilter !== 'all'
    || searchTerm.trim() !== ''
  );

  useEffect(() => {
    if (hasActiveFilters) setFiltersOpen(true);
  }, [hasActiveFilters]);

  const clearFilters = () => {
    setStoreFilter('all');
    setDateFilter('all');
    setShiftFilter('all');
    setSellerFilter('all');
    setSearchTerm('');
  };

  const handleApprove = async () => {
    if (!selectedShiftId) return;
    await approveMutation.mutateAsync(selectedShiftId);
    setSelectedShiftId(null);
  };

  const handleReject = async (reason: string) => {
    if (!selectedShiftId) return;
    await rejectMutation.mutateAsync({ shiftId: selectedShiftId, data: { reason: reason || '' } });
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

      <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/10 via-background to-amber-500/10">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Fila de aprovacao de divergencias
              </div>
              <h2 className="text-xl font-semibold tracking-tight">Analise final com foco em decisao rapida e segura</h2>
              <p className="text-sm text-muted-foreground">
                Esta tela exibe somente divergencias com justificativa, prontas para aprovacao ou reprovacao definitiva.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border bg-background/90 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Registros</p>
                <p className="text-lg font-semibold">{filteredTotals.total}</p>
              </div>
              <div className="rounded-lg border bg-background/90 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Soma</p>
                <p className={cn(
                  'text-lg font-semibold font-mono',
                  filteredTotals.sum < 0 ? 'text-destructive' : 'text-emerald-600'
                )}>
                  {formatSignedCurrency(filteredTotals.sum)}
                </p>
              </div>
              <div className="rounded-lg border bg-background/90 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Pendencia media</p>
                <p className="text-lg font-semibold">{filteredTotals.averagePendingDays.toFixed(1)}d</p>
              </div>
              <div className="rounded-lg border bg-background/90 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Criticos (3d+)</p>
                <p className={cn('text-lg font-semibold', filteredTotals.criticalCount > 0 ? 'text-destructive' : 'text-emerald-600')}>
                  {filteredTotals.criticalCount}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {divergentShifts.length > approvalQueueShifts.length && (
        <Alert className="border-amber-300/50 bg-amber-50/70">
          <AlertCircle className="h-4 w-4 text-amber-700" />
          <AlertTitle>Regra ativa de aprovacao</AlertTitle>
          <AlertDescription>
            {divergentShifts.length - approvalQueueShifts.length} registro(s) sem justificativa nao entram nesta tela e seguem outro fluxo.
          </AlertDescription>
        </Alert>
      )}

      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" />
                Filtros de conferencia
              </CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                    {[
                      storeFilter !== 'all',
                      dateFilter !== 'all',
                      shiftFilter !== 'all',
                      sellerFilter !== 'all',
                      searchTerm.trim() !== '',
                    ].filter(Boolean).length} ativo(s)
                  </Badge>
                )}
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    {filtersOpen ? 'Ocultar filtros' : 'Visualizar filtros'}
                    {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {isLoading && (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && sortedShifts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            {approvalQueueShifts.length === 0 ? (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="text-lg font-medium">Nenhuma divergencia aguardando aprovacao</p>
                <p className="text-muted-foreground">No momento nao existem registros com justificativa para esta etapa.</p>
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                Maior divergencia: {formatCurrency(filteredTotals.maxAbsDivergence)}
              </Badge>
              {divergentFetching && (
                <Badge variant="outline" className="gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Atualizando
                </Badge>
              )}
            </div>
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
