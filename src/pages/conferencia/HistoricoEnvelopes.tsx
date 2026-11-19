/**
 * Historico de Envelopes Page (Refactored)
 * 
 * Modern interface for viewing cash shift history with filters and stats.
 * Features expandable rows and integrity reports.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import {
  History, Store, Calendar, CalendarClock, CalendarDays, CalendarRange,
  CheckCircle, XCircle, Clock, ArrowUpCircle,
  TrendingUp, AlertTriangle, FileCheck,
  Loader2, BarChart3, Eye, User, UserCheck, Paperclip, FileText, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/PageHeader';
import { cashClosingsService } from '@/services/conference';
import { useHistoryFilters } from '@/hooks/api/use-history-filters';
import { useCashShifts } from '@/hooks/api/use-cash-shifts';
import { useCashIntegrityReport, useCashClosing } from '@/hooks/api/use-cash-closings';
import { formatDateKeyPtBr, formatDateTimeSaoPaulo } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import { SHIFT_CODES, sanitizeStorageUrl, type CashClosing, type CashShift, type ShiftCode } from '@/types/conference.types';
import { ViewToggle, type ViewMode } from './components/ViewToggle';
import { KanbanBoard } from './components/KanbanBoard';

// ============================================================
// Constants
// ============================================================

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const normalized = trimmed.includes(',')
      ? trimmed.replace(/\./g, '').replace(',', '.')
      : trimmed;
    const sanitized = normalized.replace(/[^\d.-]/g, '');
    const parsed = Number.parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const formatCurrency = (value: number | string | undefined | null) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(toNumber(value));
};

const formatDate = (dateStr: string) => {
  return formatDateKeyPtBr(dateStr, '-');
};

const hasClosingJustification = (closing?: Partial<CashClosing> | null) => {
  const justificationText = typeof closing?.justification_text === 'string'
    ? closing.justification_text.trim()
    : '';
  const observerNotes = typeof closing?.observer_notes === 'string'
    ? closing.observer_notes.trim()
    : '';
  return Boolean(justificationText) || Boolean(observerNotes) || closing?.justified === true;
};

const hasClosingDivergence = (closing?: Partial<CashClosing> | null) => {
  if (!closing || !Array.isArray(closing.lines) || closing.lines.length === 0) {
    return false;
  }

  return closing.lines.some((line) => {
    const diffValue = Number.parseFloat(String(line.diff_value ?? Number.NaN));
    if (Number.isFinite(diffValue)) {
      return Math.abs(diffValue) >= 0.01;
    }

    const systemValue = Number.parseFloat(String(line.system_value ?? Number.NaN));
    const realValue = Number.parseFloat(String(line.real_value ?? Number.NaN));
    if (!Number.isFinite(systemValue) || !Number.isFinite(realValue)) {
      return false;
    }

    return Math.abs(realValue - systemValue) >= 0.01;
  });
};

const isApprovedWithDivergence = (closing?: Partial<CashClosing> | null) => {
  return closing?.status === 'approved'
    && hasClosingDivergence(closing)
    && !hasClosingJustification(closing);
};

const HISTORY_STATUS_META = {
  submitted: {
    label: 'Aguardando Aprovacao',
    icon: Clock,
    className: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  },
  approved_with_divergence: {
    label: 'Aprovado Justificado',
    icon: AlertTriangle,
    className: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  },
  approved: {
    label: 'Aprovado',
    icon: CheckCircle,
    className: 'bg-green-500/10 text-green-700 border-green-500/30',
  },
  rejected: {
    label: 'Reprovado',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
} as const;

type HistoryStatusKey = keyof typeof HISTORY_STATUS_META;

const HISTORY_STATUS_FILTER_VALUES: HistoryStatusKey[] = [
  'submitted',
  'approved_with_divergence',
  'approved',
  'rejected',
];

const resolveHistoryStatus = (
  status: string | undefined | null,
  options?: { approvedWithDivergence?: boolean }
): HistoryStatusKey | null => {
  if (!status) return null;
  if (status === 'approved_with_divergence') return 'approved_with_divergence';
  if (status === 'approved' && options?.approvedWithDivergence) return 'approved_with_divergence';
  if (status === 'approved') return 'approved';
  if (status === 'submitted') return 'submitted';
  if (status === 'rejected') return 'rejected';
  return null;
};

const getConferenceUserName = (closing?: Partial<CashClosing> | null): string | null => {
  const directName = closing?.closed_by_user?.name?.trim();
  if (directName) return directName;

  if (!Array.isArray(closing?.activities) || closing.activities.length === 0) {
    return null;
  }

  const activities = [...(closing.activities as any[])];
  const findByStatus = (targetStatus: string) => {
    const match = [...activities]
      .reverse()
      .find((activity) => {
        const status = activity?.properties?.attributes?.status;
        const causerName = activity?.causer?.name;
        return status === targetStatus && typeof causerName === 'string' && causerName.trim().length > 0;
      });

    return typeof match?.causer?.name === 'string' ? match.causer.name.trim() : null;
  };

  return (
    findByStatus('approved')
    ?? findByStatus('submitted')
    ?? findByStatus('rejected')
    ?? activities
      .reverse()
      .map((activity) => activity?.causer?.name)
      .find((name) => typeof name === 'string' && name.trim().length > 0)
    ?? null
  );
};

const getStatusBadge = (status: string, options?: { approvedWithDivergence?: boolean }) => {
  const resolvedStatus = resolveHistoryStatus(status, options);
  if (!resolvedStatus) {
    return <Badge variant="outline">Pendente</Badge>;
  }

  const statusMeta = HISTORY_STATUS_META[resolvedStatus];
  const Icon = statusMeta.icon;
  return (
    <Badge className={cn('inline-flex items-center gap-1.5 border', statusMeta.className)}>
      <Icon className="h-3.5 w-3.5" />
      {statusMeta.label}
    </Badge>
  );
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!shift) return null;

  const closing = closingData?.data;

  // Helper for timeline: parse Spatie activity_log into rich events
  const parseTimelineEvent = (log: any) => {
    const desc = log.description; // 'created' | 'updated'
    const attrs = log.properties?.attributes || {};
    const old = log.properties?.old || {};
    const newStatus = attrs.status as string | undefined;
    const oldStatus = old.status as string | undefined;

    // Created → draft
    if (desc === 'created') {
      return {
        icon: FileCheck,
        color: 'text-blue-500 bg-blue-500/10',
        title: 'Conferencia Criada',
        subtitle: 'Rascunho salvo para revisao',
        details: [
          attrs.justification_text && `Justificativa: "${attrs.justification_text}"`,
          attrs.observer_notes && `Obs. Conferente: "${attrs.observer_notes}"`,
        ].filter(Boolean) as string[],
      };
    }

    // Updated with status change
    if (desc === 'updated' && newStatus && oldStatus) {
      // draft/rejected → submitted
      if (newStatus === 'submitted' && (oldStatus === 'draft' || oldStatus === 'rejected')) {
        return {
          icon: ArrowUpCircle,
          color: 'text-indigo-500 bg-indigo-500/10',
          title: oldStatus === 'rejected' ? 'Re-enviado para Aprovacao' : 'Enviado para Conferencia',
          subtitle: 'Aguardando analise do gestor',
          details: [] as string[],
        };
      }

      // submitted → approved
      if (newStatus === 'approved') {
        return {
          icon: CheckCircle,
          color: 'text-green-600 bg-green-500/10',
          title: 'Aprovado',
          subtitle: attrs.closed_at
            ? `Fechado em ${formatDateTimeSaoPaulo(attrs.closed_at, '-')}`
            : 'Fechamento oficializado',
          details: [] as string[],
        };
      }

      // submitted → rejected
      if (newStatus === 'rejected') {
        return {
          icon: XCircle,
          color: 'text-red-500 bg-red-500/10',
          title: 'Reprovado',
          subtitle: 'Devolvido para correcao',
          details: [] as string[],
        };
      }
    }

    // Updated without status change (e.g. justification edited)
    if (desc === 'updated') {
      const changes: string[] = [];
      if (attrs.justification_text !== undefined && old.justification_text !== undefined) {
        changes.push('Justificativa alterada');
      }
      if (attrs.observer_notes !== undefined && old.observer_notes !== undefined) {
        changes.push('Obs. conferente alterada');
      }
      if (attrs.version !== undefined) {
        changes.push(`Versao ${attrs.version}`);
      }
      return {
        icon: TrendingUp,
        color: 'text-amber-500 bg-amber-500/10',
        title: 'Dados Atualizados',
        subtitle: changes.length > 0 ? changes.join(' · ') : 'Campos modificados',
        details: [] as string[],
      };
    }

    // Fallback
    return {
      icon: Clock,
      color: 'text-gray-500 bg-gray-500/10',
      title: desc === 'created' ? 'Criado' : 'Evento',
      subtitle: '',
      details: [] as string[],
    };
  };

  const activities = closing?.activities || [];
  const lines = closing?.lines || [];
  const totalSystem = lines.reduce((s: number, l: any) => s + Number(l.system_value), 0);
  const totalReal = lines.reduce((s: number, l: any) => s + Number(l.real_value), 0);
  const totalDiff = lines.reduce((s: number, l: any) => s + Number(l.diff_value), 0);
  const approvedWithDivergence = isApprovedWithDivergence(closing);
  const conferenceUserName = getConferenceUserName(closing);

  const sortedActivities = [...activities].sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  /* --- timeline rendering (section 5) --- */
  const timelineSection = (
    <div className="pt-4 border-t">
      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <History className="h-4 w-4" />
        Linha do Tempo
      </h4>
      <div className="space-y-0 relative ml-2 border-l-2 border-muted pl-6 pb-2">
        {sortedActivities.length > 0 ? (
          sortedActivities.map((log: any, index: number) => {
            const ev = parseTimelineEvent(log);
            const Icon = ev.icon;
            const isLast = index === sortedActivities.length - 1;
            return (
              <div key={log.id || index} className={cn("relative", !isLast && "pb-6")}>
                {/* Node */}
                <div className={cn(
                  "absolute -left-[31px] top-0 p-1.5 rounded-full border-2 border-background",
                  ev.color
                )}>
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Content */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{ev.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTimeSaoPaulo(log.created_at, '-')}
                    </span>
                  </div>

                  {ev.subtitle && (
                    <p className="text-xs text-muted-foreground">{ev.subtitle}</p>
                  )}

                  {/* User */}
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <User className="h-3 w-3" />
                    {log.causer ? (
                      <span>Por <strong className="text-foreground">{log.causer.name}</strong></span>
                    ) : (
                      <span>Sistema</span>
                    )}
                  </div>

                  {/* Extra details */}
                  {ev.details.length > 0 && (
                    <div className="mt-1 text-xs bg-muted/30 rounded p-2 space-y-0.5">
                      {ev.details.map((d, i) => (
                        <p key={i} className="text-muted-foreground">{d}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground italic">Nenhum evento registrado.</p>
        )}
      </div>
    </div>
  );

  return (
    <>
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
                <Badge variant="outline" className="text-base px-3 py-1 border-primary/30 bg-primary/5">
                  <UserCheck className="h-3 w-3 mr-2 text-primary" />
                  Conferido por: {conferenceUserName || '-'}
                </Badge>
                <div className="ml-auto">
                  {getStatusBadge(closing.status, { approvedWithDivergence })}
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
                    Diferenca
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
                    Justificativa do Vendedor
                  </h4>
                  <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
                    {closing.justification_text}
                  </p>
                </div>
              )}

              {/* 3b. Observer Notes (if any) */}
              {closing.observer_notes && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="flex items-center gap-2 font-semibold text-blue-700 mb-2">
                    <FileCheck className="h-4 w-4" />
                    Observações do Conferente
                  </h4>
                  <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">
                    {closing.observer_notes}
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
                      <th className="text-right p-3 font-medium">Diferenca</th>
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

              {/* 4b. Documentos Anexados */}
              {(closing.attachments?.length ?? 0) > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Documentos Anexados ({closing.attachments!.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {closing.attachments!.map(att => (
                      <div key={att.id} className="rounded-lg border bg-muted/20 overflow-hidden group">
                        {att.file_type.startsWith('image/') ? (
                          <button
                            type="button"
                            className="w-full text-left"
                            onClick={() => setPreviewImage(sanitizeStorageUrl(att.url))}
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

              {/* 5. Timeline */}
              {timelineSection}

            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <p>Nenhum dado encontrado.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
// Shift Row Component
// ============================================================

interface ShiftRowProps {
  shift: CashShift;
  closing?: CashClosing | null;
  closingLoading?: boolean;
  onClick: () => void;
}

function ShiftRow({ shift, closing, closingLoading = false, onClick }: ShiftRowProps) {
  const resolvedClosing = closing ?? shift.cash_closing ?? null;
  const lines = resolvedClosing?.lines || [];
  const totalSystem = lines.reduce((sum, line) => sum + toNumber(line.system_value), 0);
  const totalConference = lines.reduce((sum, line) => sum + toNumber(line.real_value), 0);
  const totalDiff = lines.reduce((sum, line) => sum + toNumber(line.diff_value), 0);
  const hasClosing = lines.length > 0;
  const approvedWithDivergence = isApprovedWithDivergence(resolvedClosing);
  const statusValue = resolvedClosing?.status || shift.cash_closing?.status || shift.status;
  const conferenceUserName = getConferenceUserName(resolvedClosing);

  return (
    <div
      className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="col-span-2 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{formatDate(shift.date)}</span>
        <Badge variant="outline" className="text-xs">
          {SHIFT_CODES[shift.shift_code]}
        </Badge>
      </div>

      <div className="col-span-2 flex items-center">
        <span className="text-sm truncate">{shift.store?.name || '-'}</span>
      </div>

      <div className="col-span-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
          {shift.seller?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <span className="text-sm truncate">{shift.seller?.name || '-'}</span>
      </div>

      <div className="col-span-2 flex items-center">
        {conferenceUserName ? (
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <UserCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <span className="text-sm truncate" title={conferenceUserName}>
              {conferenceUserName}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </div>

      <div className="col-span-2 text-right">
        {closingLoading && !hasClosing ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Carregando
          </span>
        ) : hasClosing ? (
          <>
            <p className="text-[11px] text-muted-foreground">Sistema</p>
            <p className="text-sm font-mono font-semibold">{formatCurrency(totalSystem)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Conferencia</p>
            <p className="text-sm font-mono font-semibold">{formatCurrency(totalConference)}</p>
            <p className={cn(
              'text-xs font-mono mt-1',
              totalDiff < 0 ? 'text-destructive' : totalDiff > 0 ? 'text-green-600' : 'text-muted-foreground'
            )}>
              Dif: {totalDiff >= 0 ? '+' : ''}{formatCurrency(totalDiff)}
            </p>
          </>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </div>

      <div className="col-span-2 flex items-center justify-end gap-1.5">
        {(resolvedClosing?.attachments?.length ?? 0) > 0 && (
          <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0">
            <Paperclip className="mr-0.5 h-3 w-3" />
            {resolvedClosing!.attachments!.length}
          </Badge>
        )}
        {getStatusBadge(statusValue, { approvedWithDivergence })}
      </div>
    </div>
  );
}

// ============================================================
// Main Component
const HistoricoEnvelopesPage: React.FC = () => {
  // Date filter mode
  type HistoricoDateMode = 'month' | 'period' | 'day' | 'custom';
  type PeriodPreset = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month';

  const PERIOD_LABELS: Record<PeriodPreset, string> = {
    today: 'Hoje',
    yesterday: 'Ontem',
    last_7_days: 'Ultimos 7 dias',
    last_30_days: 'Ultimos 30 dias',
    this_month: 'Mes atual',
    last_month: 'Mes anterior',
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const toInputDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // URL persistence
  const [searchParams, setSearchParams] = useSearchParams();

  const [storeFilter, setStoreFilter] = useState<string>(searchParams.get('store') || 'all');
  const [sellerFilter, setSellerFilter] = useState<string>(searchParams.get('seller') || 'all');
  const [shiftFilter, setShiftFilter] = useState<string>(searchParams.get('shift') || 'all');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
  const [selectedShift, setSelectedShift] = useState<CashShift | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get('view') as ViewMode) || 'table'
  );

  // Smart date filter state
  const [dateMode, setDateMode] = useState<HistoricoDateMode>(
    (searchParams.get('dateMode') as HistoricoDateMode) || 'month'
  );
  const [monthFilter, setMonthFilter] = useState<string>(searchParams.get('month') || getCurrentMonth());
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>(
    (searchParams.get('period') as PeriodPreset) || 'this_month'
  );
  const [dayDate, setDayDate] = useState<string>(searchParams.get('day') || toInputDate(new Date()));
  const [fromDate, setFromDate] = useState<string>(
    searchParams.get('from') || (() => {
      const now = new Date();
      return toInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
    })()
  );
  const [toDate, setToDate] = useState<string>(searchParams.get('to') || toInputDate(new Date()));

  // Sorting state (persisted in URL as ?sort=date:asc,store:desc)
  type SortDirection = 'asc' | 'desc';
  type SortColumn = 'date' | 'store' | 'seller' | 'conferente' | 'values' | 'status';
  interface SortEntry { id: SortColumn; direction: SortDirection; }

  const parseSortFromUrl = useCallback((): SortEntry[] => {
    const raw = searchParams.get('sort');
    if (!raw) return [];
    return raw.split(',').map(s => {
      const [id, dir] = s.split(':');
      return { id: id as SortColumn, direction: (dir === 'desc' ? 'desc' : 'asc') as SortDirection };
    }).filter(s => ['date', 'store', 'seller', 'conferente', 'values', 'status'].includes(s.id));
  }, [searchParams]);

  const [sorting, setSorting] = useState<SortEntry[]>(parseSortFromUrl);

  // Sync state → URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (storeFilter !== 'all') params.set('store', storeFilter);
    if (sellerFilter !== 'all') params.set('seller', sellerFilter);
    if (shiftFilter !== 'all') params.set('shift', shiftFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (dateMode !== 'month') params.set('dateMode', dateMode);
    if (dateMode === 'month' && monthFilter !== getCurrentMonth()) params.set('month', monthFilter);
    if (dateMode === 'period') params.set('period', periodPreset);
    if (dateMode === 'day') params.set('day', dayDate);
    if (dateMode === 'custom') { params.set('from', fromDate); params.set('to', toDate); }
    if (page > 1) params.set('page', String(page));
    if (sorting.length > 0) params.set('sort', sorting.map(s => `${s.id}:${s.direction}`).join(','));
    if (viewMode !== 'table') params.set('view', viewMode);
    setSearchParams(params, { replace: true });
  }, [storeFilter, sellerFilter, shiftFilter, statusFilter, dateMode, monthFilter, periodPreset, dayDate, fromDate, toDate, page, sorting, viewMode, setSearchParams]);

  // Compute API date params based on mode
  const dateApiParams = useMemo(() => {
    if (dateMode === 'day') {
      return { date: dayDate };
    }

    if (dateMode === 'month') {
      const [y, m] = monthFilter.split('-').map(Number);
      const first = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const last = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return { from: first, to: last };
    }

    if (dateMode === 'period') {
      const now = new Date();
      const today = toInputDate(now);
      const yesterday = toInputDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

      switch (periodPreset) {
        case 'today':
          return { date: today };
        case 'yesterday':
          return { date: yesterday };
        case 'last_7_days':
          return { from: toInputDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)), to: today };
        case 'last_30_days':
          return { from: toInputDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)), to: today };
        case 'this_month':
          return { from: toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
        case 'last_month': {
          const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
          return { from: toInputDate(firstOfLastMonth), to: toInputDate(lastOfLastMonth) };
        }
        default:
          return {};
      }
    }

    // custom
    return { from: fromDate, to: toDate };
  }, [dateMode, monthFilter, periodPreset, dayDate, fromDate, toDate]);

  // Applied period label for badge
  const appliedPeriodLabel = useMemo(() => {
    const formatBr = (v: string) => {
      if (!v) return '-';
      const d = new Date(`${v}T00:00:00`);
      return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('pt-BR');
    };

    if (dateMode === 'month') {
      const [yRaw, mRaw] = monthFilter.split('-');
      const mi = Number(mRaw) - 1;
      return new Date(Number(yRaw), mi, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    if (dateMode === 'period') return PERIOD_LABELS[periodPreset];
    if (dateMode === 'day') return formatBr(dayDate);
    return `${formatBr(fromDate)} até ${formatBr(toDate)}`;
  }, [dateMode, monthFilter, periodPreset, dayDate, fromDate, toDate]);

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    if (toDate && value > toDate) setToDate(value);
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    if (fromDate && value < fromDate) setFromDate(value);
  };

  const handleResetFilters = () => {
    setStoreFilter('all');
    setSellerFilter('all');
    setShiftFilter('all');
    setStatusFilter('all');
    setDateMode('month');
    setMonthFilter(getCurrentMonth());
    setPeriodPreset('this_month');
    setDayDate(toInputDate(new Date()));
    const now = new Date();
    setFromDate(toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)));
    setToDate(toInputDate(now));
    setPage(1);
  };

  // Get current month for reports
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Smart filters — only loads what exists in the data
  const { data: smartFilters, isFetching: filtersFetching } = useHistoryFilters(
    dateApiParams.from,
    dateApiParams.to,
    storeFilter !== 'all' ? parseInt(storeFilter, 10) : undefined
  );

  // Auto-reset filters when selected value disappears from smart data
  useEffect(() => {
    if (!smartFilters) return;
    if (storeFilter !== 'all' && !smartFilters.stores.some(s => String(s.id) === storeFilter)) {
      setStoreFilter('all');
    }
    if (sellerFilter !== 'all' && !smartFilters.sellers.some(s => String(s.id) === sellerFilter)) {
      setSellerFilter('all');
    }
    if (shiftFilter !== 'all' && !smartFilters.shifts.includes(shiftFilter)) {
      setShiftFilter('all');
    }
    if (statusFilter !== 'all' && smartFilters.statuses && !smartFilters.statuses.includes(statusFilter)) {
      setStatusFilter('all');
    }
  }, [smartFilters, storeFilter, sellerFilter, shiftFilter, statusFilter]);

  const serverStatusFilter = useMemo(() => {
    if (statusFilter === 'all') {
      return undefined;
    }
    if (statusFilter === 'approved_with_divergence') {
      return 'approved';
    }
    return statusFilter;
  }, [statusFilter]);

  const perPage = viewMode === 'kanban' ? 250 : 25;

  const { data: shiftsData, isLoading } = useCashShifts({
    store_id: storeFilter !== 'all' ? parseInt(storeFilter, 10) : undefined,
    ...dateApiParams,
    seller_id: sellerFilter !== 'all' ? parseInt(sellerFilter, 10) : undefined,
    shift_code: shiftFilter !== 'all' ? shiftFilter : undefined,
    status: serverStatusFilter,
    page: viewMode === 'kanban' ? 1 : page,
    per_page: perPage,
  });

  // Report for selected store
  const { data: reportData } = useCashIntegrityReport(
    storeFilter !== 'all' ? parseInt(storeFilter, 10) : 0,
    currentMonth,
    storeFilter !== 'all'
  );

  const report = reportData?.data;
  const shifts = shiftsData?.data || [];
  const shiftsWithClosing = useMemo(
    () => shifts.filter((shift) => Boolean(shift.cash_closing?.status)),
    [shifts]
  );

  const closingDetailQueries = useQueries({
    queries: shiftsWithClosing.map((shift) => ({
      queryKey: ['historico-closing-detail', shift.id],
      queryFn: () => cashClosingsService.get(shift.id),
      enabled: Boolean(shift.id),
      staleTime: 30 * 1000,
    })),
  });

  const closingByShiftId = useMemo(() => {
    const map = new Map<number, CashClosing>();
    closingDetailQueries.forEach((query, index) => {
      const shift = shiftsWithClosing[index];
      const closing = query.data?.data;
      if (shift?.id && closing) {
        map.set(shift.id, closing);
      }
    });
    return map;
  }, [closingDetailQueries, shiftsWithClosing]);

  const loadingDetailShiftIds = useMemo(() => {
    const ids = new Set<number>();
    closingDetailQueries.forEach((query, index) => {
      if (!query.isLoading && !query.isFetching) return;
      const shift = shiftsWithClosing[index];
      if (shift?.id) {
        ids.add(shift.id);
      }
    });
    return ids;
  }, [closingDetailQueries, shiftsWithClosing]);

  const listShifts = useMemo(() => {
    const mapped = shifts
      .map((shift) => ({
        ...shift,
        cash_closing: closingByShiftId.get(shift.id) ?? shift.cash_closing ?? null,
      }))
      .filter((shift) => {
        const status = shift.cash_closing?.status;
        return status === 'submitted' || status === 'approved' || status === 'rejected';
      });

    if (statusFilter === 'approved_with_divergence') {
      return mapped.filter((shift) => isApprovedWithDivergence(shift.cash_closing));
    }

    if (statusFilter === 'approved') {
      return mapped.filter(
        (shift) => shift.cash_closing?.status === 'approved' && !isApprovedWithDivergence(shift.cash_closing)
      );
    }

    if (statusFilter === 'submitted' || statusFilter === 'rejected') {
      return mapped.filter((shift) => shift.cash_closing?.status === statusFilter);
    }

    return mapped;
  }, [shifts, closingByShiftId, statusFilter]);

  // Sorting logic — tri-state + multi-sort
  const handleSort = useCallback((columnId: SortColumn, event: React.MouseEvent) => {
    setSorting(prev => {
      const existing = prev.find(s => s.id === columnId);
      if (event.shiftKey) {
        // Multi-sort: toggle or add
        if (existing) {
          if (existing.direction === 'asc') return prev.map(s => s.id === columnId ? { ...s, direction: 'desc' as SortDirection } : s);
          return prev.filter(s => s.id !== columnId); // remove (tri-state: desc → none)
        }
        return [...prev, { id: columnId, direction: 'asc' as SortDirection }];
      }
      // Single sort: tri-state
      if (existing) {
        if (existing.direction === 'asc') return [{ id: columnId, direction: 'desc' as SortDirection }];
        return []; // desc → none
      }
      return [{ id: columnId, direction: 'asc' as SortDirection }];
    });
  }, []);

  const STATUS_ORDER: Record<string, number> = { submitted: 0, approved: 1, approved_with_divergence: 2, rejected: 3 };

  const sortedShifts = useMemo(() => {
    if (sorting.length === 0) return listShifts;
    const arr = [...listShifts];
    arr.sort((a, b) => {
      for (const { id, direction } of sorting) {
        let cmp = 0;
        const closingA = closingByShiftId.get(a.id) ?? a.cash_closing;
        const closingB = closingByShiftId.get(b.id) ?? b.cash_closing;
        switch (id) {
          case 'date': {
            cmp = (a.date || '').localeCompare(b.date || '') || String(a.shift_code).localeCompare(String(b.shift_code));
            break;
          }
          case 'store': cmp = (a.store?.name || '').localeCompare(b.store?.name || '', 'pt-BR'); break;
          case 'seller': cmp = (a.seller?.name || '').localeCompare(b.seller?.name || '', 'pt-BR'); break;
          case 'conferente': {
            const nameA = getConferenceUserName(closingA) || '';
            const nameB = getConferenceUserName(closingB) || '';
            cmp = nameA.localeCompare(nameB, 'pt-BR');
            break;
          }
          case 'values': {
            const linesA = closingA?.lines || [];
            const linesB = closingB?.lines || [];
            const totalA = linesA.reduce((s: number, l: any) => s + toNumber(l.system_value), 0);
            const totalB = linesB.reduce((s: number, l: any) => s + toNumber(l.system_value), 0);
            cmp = totalA - totalB;
            break;
          }
          case 'status': {
            const statusA = closingA?.status || '';
            const statusB = closingB?.status || '';
            cmp = (STATUS_ORDER[statusA] ?? 99) - (STATUS_ORDER[statusB] ?? 99);
            break;
          }
        }
        if (cmp !== 0) return direction === 'desc' ? -cmp : cmp;
      }
      return 0;
    });
    return arr;
  }, [listShifts, sorting, closingByShiftId]);

  // Handle pagination - API returns meta directly
  const paginationMeta = shiftsData?.meta;
  const totalPages = paginationMeta?.last_page || 1;
  const currentPage = paginationMeta?.current_page || 1;
  const total = statusFilter === 'approved_with_divergence' || statusFilter === 'approved'
    ? sortedShifts.length
    : (paginationMeta?.total || 0);
  const requiresDetailedStatusFilter = statusFilter === 'approved_with_divergence' || statusFilter === 'approved';
  const isListLoading = isLoading || (requiresDetailedStatusFilter && closingDetailQueries.some((query) => query.isLoading));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Historico de Envelopes"
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
                  <p className="text-sm text-muted-foreground">Taxa Conclusao</p>
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
            {/* Date Mode */}
            <div className="w-[160px]">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Periodo</Label>
              <Select value={dateMode} onValueChange={(v) => setDateMode(v as HistoricoDateMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Mes
                    </span>
                  </SelectItem>
                  <SelectItem value="period">
                    <span className="inline-flex items-center gap-2">
                      <CalendarRange className="h-3.5 w-3.5" />
                      Periodo pre-definido
                    </span>
                  </SelectItem>
                  <SelectItem value="day">
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      Dia especifico
                    </span>
                  </SelectItem>
                  <SelectItem value="custom">
                    <span className="inline-flex items-center gap-2">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Intervalo customizado
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Month Selector — via Select com meses disponiveis da API */}
            {dateMode === 'month' && (
              <div className="w-[200px]">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Mes</Label>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger>
                    <CalendarDays className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Selecione o mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {(smartFilters?.months ?? [getCurrentMonth()]).map((m) => {
                      const [yRaw, mRaw] = m.split('-');
                      const label = new Date(Number(yRaw), Number(mRaw) - 1, 1)
                        .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                      return (
                        <SelectItem key={m} value={m}>
                          {label.charAt(0).toUpperCase() + label.slice(1)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {dateMode === 'period' && (
              <div className="w-[170px]">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Periodo</Label>
                <Select value={periodPreset} onValueChange={(v) => setPeriodPreset(v as PeriodPreset)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {dateMode === 'day' && (
              <div className="w-[160px]">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Dia</Label>
                <Input
                  type="date"
                  value={dayDate}
                  onChange={(e) => setDayDate(e.target.value)}
                />
              </div>
            )}

            {dateMode === 'custom' && (
              <>
                <div className="w-[140px]">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">De</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => handleFromDateChange(e.target.value)}
                  />
                </div>
                <div className="w-[140px]">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Ate</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => handleToDateChange(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Store Filter — smart: so mostra lojas com dados */}
            {(smartFilters?.stores?.length ?? 0) > 0 && (
              <div className="w-[200px]">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Loja</Label>
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger>
                    <Store className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as lojas</SelectItem>
                    {smartFilters!.stores.map(store => (
                      <SelectItem key={store.id} value={String(store.id)}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Seller Filter — smart: so mostra vendedores com dados */}
            {(smartFilters?.sellers?.length ?? 0) > 0 && (
              <div className="w-[200px]">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Vendedor</Label>
                <Select value={sellerFilter} onValueChange={setSellerFilter}>
                  <SelectTrigger>
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {smartFilters!.sellers.map((seller) => (
                      <SelectItem key={seller.id} value={String(seller.id)}>
                        {seller.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Shift Filter — smart: so mostra turnos com dados */}
            {(smartFilters?.shifts?.length ?? 0) > 0 && (
              <div className="w-[140px]">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Turno</Label>
                <Select value={shiftFilter} onValueChange={setShiftFilter}>
                  <SelectTrigger>
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {smartFilters!.shifts.map((code) => (
                      <SelectItem key={code} value={code}>
                        {SHIFT_CODES[code as ShiftCode] ?? `${code}º Turno`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status Filter — smart: so mostra status com dados */}
            {(() => {
              // Map API statuses to our UI status keys
              const availableStatuses: HistoryStatusKey[] = smartFilters?.statuses
                ? (() => {
                  const mapped = new Set<HistoryStatusKey>();
                  for (const s of smartFilters.statuses) {
                    if (s === 'submitted') mapped.add('submitted');
                    if (s === 'approved') { mapped.add('approved'); mapped.add('approved_with_divergence'); }
                    if (s === 'rejected') mapped.add('rejected');
                  }
                  return HISTORY_STATUS_FILTER_VALUES.filter(k => mapped.has(k));
                })()
                : HISTORY_STATUS_FILTER_VALUES;
              if (availableStatuses.length === 0) return null;
              return (
                <div className="w-[200px]">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <FileCheck className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {availableStatuses.map((statusKey) => {
                        const statusMeta = HISTORY_STATUS_META[statusKey];
                        const Icon = statusMeta.icon;
                        return (
                          <SelectItem key={statusKey} value={statusKey}>
                            <span className="inline-flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5" />
                              {statusMeta.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              );
            })()}

            {/* Clear Filters */}
            {(storeFilter !== 'all' || sellerFilter !== 'all' || shiftFilter !== 'all' || statusFilter !== 'all' || dateMode !== 'month' || monthFilter !== getCurrentMonth()) && (
              <div className="flex items-end pb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9 px-3 text-muted-foreground hover:text-foreground"
                >
                  Limpar filtros
                </Button>
              </div>
            )}

            {/* View Toggle */}
            <div className="flex items-end pb-1 ml-auto">
              <ViewToggle mode={viewMode} onModeChange={setViewMode} />
            </div>
          </div>

          {/* Active period badge + loading */}
          <div className="mt-3 flex items-center gap-2">
            <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Periodo aplicado: <span className="font-medium text-foreground">{appliedPeriodLabel}</span>
            </span>
            {filtersFetching && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-2" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data View — Table or Kanban */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          shifts={listShifts}
          isLoading={isListLoading}
          onShiftClick={(shift) => setSelectedShift(shift)}
          storeFilter={storeFilter !== 'all' ? parseInt(storeFilter, 10) : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Sortable Header — sticky */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 text-sm font-medium text-muted-foreground sticky top-0 z-10 backdrop-blur-sm bg-muted/80">
            {([
              { id: 'date' as SortColumn, label: 'Data / Turno', align: '' },
              { id: 'store' as SortColumn, label: 'Loja', align: '' },
              { id: 'seller' as SortColumn, label: 'Vendedor', align: '' },
              { id: 'conferente' as SortColumn, label: 'Conferido por', align: '' },
              { id: 'values' as SortColumn, label: 'Sistema | Conferencia', align: 'text-right' },
              { id: 'status' as SortColumn, label: 'Status', align: 'text-right' },
            ] as const).map((col) => {
              const sortEntry = sorting.find(s => s.id === col.id);
              const sortIndex = sorting.length > 1 ? sorting.findIndex(s => s.id === col.id) : -1;
              return (
                <div
                  key={col.id}
                  className={cn(
                    'col-span-2 flex items-center gap-1 cursor-pointer select-none hover:text-foreground transition-colors group',
                    col.align,
                    col.align === 'text-right' && 'justify-end'
                  )}
                  onClick={(e) => handleSort(col.id, e)}
                  title="Clique para ordenar. Shift+clique para multi-sort."
                >
                  <span>{col.label}</span>
                  <span className="inline-flex items-center gap-0.5 text-xs">
                    {sortEntry ? (
                      <>
                        <span className={cn(
                          'transition-transform',
                          sortEntry.direction === 'desc' && 'rotate-180'
                        )}>▲</span>
                        {sortIndex >= 0 && (
                          <span className="text-[10px] font-bold text-primary ml-0.5">
                            {sortIndex + 1}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="opacity-0 group-hover:opacity-30 transition-opacity">▲</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Skeleton Loading */}
          {isListLoading && (
            <div className="divide-y">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 p-4 animate-pulse">
                  <div className="col-span-2 space-y-2">
                    <div className="h-4 bg-muted rounded w-20" />
                    <div className="h-3 bg-muted rounded w-14" />
                  </div>
                  <div className="col-span-2"><div className="h-4 bg-muted rounded w-28" /></div>
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="h-7 w-7 bg-muted rounded-full" />
                    <div className="h-4 bg-muted rounded w-20" />
                  </div>
                  <div className="col-span-2"><div className="h-4 bg-muted rounded w-24" /></div>
                  <div className="col-span-2 space-y-1">
                    <div className="h-3 bg-muted rounded w-16 ml-auto" />
                    <div className="h-4 bg-muted rounded w-20 ml-auto" />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <div className="h-6 bg-muted rounded-full w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isListLoading && sortedShifts.length === 0 && (
            <div className="py-16 text-center">
              <History className="h-14 w-14 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-lg font-medium text-muted-foreground mb-1">
                Nenhum turno encontrado
              </p>
              <p className="text-sm text-muted-foreground/70 mb-4">
                Tente ajustar os filtros ou selecionar outro periodo
              </p>
              {(storeFilter !== 'all' || sellerFilter !== 'all' || shiftFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}

          {/* Rows */}
          {!isListLoading && sortedShifts.map(shift => (
            <ShiftRow
              key={shift.id}
              shift={shift}
              closing={closingByShiftId.get(shift.id) ?? shift.cash_closing ?? null}
              closingLoading={loadingDetailShiftIds.has(shift.id)}
              onClick={() => setSelectedShift(shift)}
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                <Badge variant="secondary" className="mr-2">{total}</Badge>
                registros - Pagina {currentPage} de {totalPages}
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
                  Proxima
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Detail Dialog */}
      <DetailDialog
        shift={selectedShift}
        onClose={() => setSelectedShift(null)}
      />
    </div>
  );
};

export default HistoricoEnvelopesPage;
