/**
 * Lançar Turno Page (Refactored)
 * 
 * Modern interface for recording cash shift closings.
 * Features side-by-side comparison of system vs real values.
 * 
 * Updated: Justification is now per-shift (not per-line) and optional.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar, Store, User, Clock, FileCheck, AlertTriangle, CheckCircle,
  DollarSign, CreditCard, Smartphone, Banknote, Send, Info, Loader2,
  Lock, Unlock, ShieldCheck, Users, History, ListChecks,
  PlusCircle, X, Undo2, Receipt, Paperclip, FileText, Trash2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';
import { getAllPublicStores } from '@/services/stores.service';
import { useCashShifts, useCreateCashShift } from '@/hooks/api/use-cash-shifts';
import { useClosureFilters } from '@/hooks/api/use-closure-filters';
import {
  useCashClosing, useCreateClosing, useUpdateClosing, useSubmitClosing,
  usePdvClosureData, useApproveClosing, useConferencePendingTurns,
  useUploadAttachment, useDeleteAttachment
} from '@/hooks/api/use-cash-closings';
import { uploadAttachment } from '@/services/conference/cash-closings.service';
import {
  extractDateKey,
  formatDateKeyPtBr,
  formatDateTimeSaoPaulo,
  formatTimeSaoPaulo,
  parseApiDateTimeToDate,
} from '@/lib/datetime';
import { getStoreIdentifier } from '@/lib/store-identifiers';
import { cn } from '@/lib/utils';
import { ConferenciaOperacoesTab } from './components/ConferenciaOperacoesTab';
import {
  SHIFT_CODES, DEFAULT_CLOSING_LINES, ALL_PAYMENT_METHODS, sanitizeStorageUrl,
  type ShiftCode, type ClosingLineFormData, type PdvClosureDetail, type ConferencePendingTurn,
  type CashClosingAttachment,
} from '@/types/conference.types';

// ============================================================
// Constants
// ============================================================

const normalizePaymentLabel = (label: string) =>
  label.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/\b(de|do)\b/g, '') // remove prepositions
    .replace(/\s+/g, ' ').trim();

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

const formatCurrency = (value: unknown) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(toNumber(value));
};

const formatDateOption = (value: string): string => {
  return formatDateKeyPtBr(value, 'Data invalida');
};

const formatDecimalValue = (value: unknown): string => {
  return toNumber(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const normalizeShiftCode = (value: unknown): string => {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === 'M' || raw === '1') return '1';
  if (raw === 'T' || raw === '2') return '2';
  if (raw === 'N' || raw === '3') return '3';
  return raw;
};

const formatApiTime = (value: string | null | undefined): string | null => {
  return formatTimeSaoPaulo(value, null);
};

const formatApiDateTime = (value: string | null | undefined): string => {
  return formatDateTimeSaoPaulo(value, '-');
};

const formatRealInputValue = (value: number): string => {
  if (!Number.isFinite(value) || value === 0) return '';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseRealInputValue = (input: string): number => {
  const trimmed = input.trim();
  if (!trimmed) return 0;

  const sanitized = trimmed.replace(/[^\d,.-]/g, '');
  if (!sanitized) return 0;

  if (sanitized.includes(',')) {
    const [rawIntegerPart, rawDecimalPart = ''] = sanitized.split(',');
    const integerPart = rawIntegerPart.replace(/\./g, '').replace(/[^\d]/g, '');
    const decimalPart = rawDecimalPart.replace(/[^\d]/g, '').slice(0, 2);
    const parsed = Number.parseFloat(`${integerPart || '0'}.${decimalPart || '0'}`);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const dotCount = sanitized.match(/\./g)?.length || 0;
  if (dotCount === 1) {
    const [rawIntegerPart, rawDecimalPart = ''] = sanitized.split('.');
    const decimalPart = rawDecimalPart.replace(/[^\d]/g, '');

    if (decimalPart.length > 0 && decimalPart.length <= 2) {
      const integerPart = rawIntegerPart.replace(/[^\d]/g, '');
      const parsed = Number.parseFloat(`${integerPart || '0'}.${decimalPart}`);
      return Number.isFinite(parsed) ? parsed : 0;
    }
  }

  const integerOnly = sanitized.replace(/[^\d]/g, '');
  const parsed = Number.parseFloat(integerOnly);
  return Number.isFinite(parsed) ? parsed : 0;
};

function getPaymentIcon(label: string): React.ReactNode {
  const l = label.toLowerCase();
  if (l.includes('dinheiro')) return <Banknote className="h-5 w-5" />;
  if (l.includes('crédito') || l.includes('credito')) return <CreditCard className="h-5 w-5" />;
  if (l.includes('débito') || l.includes('debito')) return <CreditCard className="h-5 w-5" />;
  if (l.includes('pix')) return <Smartphone className="h-5 w-5" />;
  if (l.includes('devolução') || l.includes('devolucao')) return <Undo2 className="h-5 w-5" />;
  if (l.includes('crediário') || l.includes('crediario')) return <Receipt className="h-5 w-5" />;
  return <DollarSign className="h-5 w-5" />;
}

// ============================================================
// Line Input Component (Simplified - no per-line justification)
// ============================================================

interface LineInputProps {
  line: ClosingLineFormData;
  index: number;
  declaredValue?: number | null;
  onChange: (index: number, field: keyof ClosingLineFormData, value: number) => void;
  disabled?: boolean;
  isAdjustment?: boolean;
  onRemove?: (index: number) => void;
}

function LineInput({ line, index, declaredValue, onChange, disabled, isAdjustment, onRemove }: LineInputProps) {
  const systemValue = toNumber(line.system_value);
  const realValue = toNumber(line.real_value);
  const diff = Number((realValue - systemValue).toFixed(2));
  const hasDiff = diff !== 0;
  const [isRealFocused, setIsRealFocused] = useState(false);
  const [realInputValue, setRealInputValue] = useState<string>(formatRealInputValue(realValue));

  useEffect(() => {
    if (!isRealFocused) {
      setRealInputValue(formatRealInputValue(toNumber(line.real_value)));
    }
  }, [line.real_value, isRealFocused]);

  const declaredLabel = declaredValue !== null && declaredValue !== undefined
    ? `Declarado pelo funcionario: ${formatCurrency(declaredValue)}`
    : 'Nenhum valor declarado pelo funcionario no PDV.';

  const handleRealInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    setRealInputValue(rawValue);
    onChange(index, 'real_value', parseRealInputValue(rawValue));
  };

  const handleRealInputBlur = () => {
    setIsRealFocused(false);
    const parsedValue = parseRealInputValue(realInputValue);
    onChange(index, 'real_value', parsedValue);
    setRealInputValue(formatRealInputValue(parsedValue));
  };

  return (
    <div className={cn(
      'grid grid-cols-12 gap-4 p-4 rounded-lg border transition-colors',
      isAdjustment ? 'border-amber-400/50 bg-amber-500/5' :
        hasDiff ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-muted/30'
    )}>
      {/* Label */}
      <div className={cn('flex items-center gap-3', isAdjustment ? 'col-span-2' : 'col-span-3')}>
        <div className={cn(
          'p-2 rounded-lg',
          isAdjustment ? 'bg-amber-500/10 text-amber-600' :
            hasDiff ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
        )}>
          {getPaymentIcon(line.label)}
        </div>
        <div className="flex flex-col">
          <span className="font-medium">{line.label}</span>
          {isAdjustment && <span className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">Ajuste</span>}
        </div>
      </div>
      {/* Remove button for adjustment lines */}
      {isAdjustment && onRemove && (
        <div className="col-span-1 flex items-center justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(index)}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* System Value */}
      <div className="col-span-3">
        <Label className="text-xs text-muted-foreground mb-1 block">Sistema</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
          <Input
            type="text"
            value={formatDecimalValue(systemValue)}
            readOnly
            className="pl-10 bg-muted/50 cursor-not-allowed"
            disabled
          />
        </div>
      </div>

      {/* Real Value */}
      <div className="col-span-3">
        <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
          Real (Envelope)
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label={declaredLabel}
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-sm">
              {declaredLabel}
            </TooltipContent>
          </Tooltip>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
          <Input
            type="text"
            inputMode="decimal"
            value={realInputValue}
            onFocus={() => setIsRealFocused(true)}
            onBlur={handleRealInputBlur}
            onChange={handleRealInputChange}
            className={cn('pl-10', hasDiff && 'border-destructive focus-visible:ring-destructive')}
            placeholder="0,00"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Difference */}
      <div className="col-span-3 flex flex-col justify-center">
        <Label className="text-xs text-muted-foreground mb-1 block">Diferença</Label>
        <div className={cn(
          'px-3 py-2 rounded-md text-sm font-mono font-bold text-right',
          diff === 0 ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'
        )}>
          {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Attachment Section Component (Staging + Live modes)
// ============================================================

interface AttachmentSectionProps {
  /** Saved attachments from API (live mode) */
  savedAttachments?: CashClosingAttachment[];
  /** Pending local files not yet uploaded (staging mode) */
  pendingFiles: File[];
  /** Callback to add files to staging */
  onAddFiles: (files: File[]) => void;
  /** Callback to remove a staged file by index */
  onRemovePendingFile: (index: number) => void;
  /** Shift ID for live attachment operations */
  shiftId?: number;
  /** Whether editing is disabled */
  disabled?: boolean;
}

function AttachmentSection({
  savedAttachments = [],
  pendingFiles,
  onAddFiles,
  onRemovePendingFile,
  shiftId,
  disabled,
}: AttachmentSectionProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const deleteMutation = useDeleteAttachment();

  const totalCount = savedAttachments.length + pendingFiles.length;
  const canAdd = !disabled && totalCount < 5;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const remaining = 5 - totalCount;

    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (file.size > maxSize) {
        alert(`"${file.name}" é muito grande. Máximo 5MB.`);
        continue;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`"${file.name}" não é um tipo aceito. Use JPG, PNG ou PDF.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) onAddFiles(validFiles);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteSaved = (attachmentId: number) => {
    if (!shiftId || !confirm('Remover este anexo?')) return;
    deleteMutation.mutate({ shiftId, attachmentId });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Paperclip className="h-4 w-4" />
          Documentos Anexados ({totalCount}/5)
        </div>
        {canAdd && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="hidden"
              onChange={handleFileSelect}
              multiple
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <PlusCircle className="h-4 w-4" />
              Anexar Documento
            </Button>
          </>
        )}
      </div>

      {totalCount > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Saved attachments (from API) */}
          {savedAttachments.map(att => (
            <div
              key={`saved-${att.id}`}
              className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 group"
            >
              {att.file_type.startsWith('image/') ? (
                <a href={sanitizeStorageUrl(att.url)} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <img src={sanitizeStorageUrl(att.url)} alt={att.file_name} className="h-12 w-12 rounded-md object-cover border" />
                </a>
              ) : (
                <a href={sanitizeStorageUrl(att.url)} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 h-12 w-12 rounded-md border bg-red-50 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-red-500" />
                </a>
              )}
              <div className="flex-1 min-w-0">
                <a href={sanitizeStorageUrl(att.url)} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium truncate block hover:underline">
                  {att.file_name}
                </a>
                <p className="text-xs text-muted-foreground">{formatFileSize(att.file_size)}</p>
              </div>
              {!disabled && (
                <Button type="button" variant="ghost" size="icon"
                  className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteSaved(att.id)} disabled={deleteMutation.isPending}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {/* Pending files (local, not yet uploaded) */}
          {pendingFiles.map((file, idx) => {
            const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
            return (
              <div
                key={`pending-${idx}-${file.name}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/10 group"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt={file.name} className="h-12 w-12 rounded-md object-cover border shrink-0" />
                ) : (
                  <div className="shrink-0 h-12 w-12 rounded-md border bg-red-50 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-red-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-amber-600">Pendente • {formatFileSize(file.size)}</p>
                </div>
                {!disabled && (
                  <Button type="button" variant="ghost" size="icon"
                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemovePendingFile(idx)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalCount === 0 && (
        <p className="text-xs text-muted-foreground italic">
          Nenhum documento anexado. Você pode anexar imagens (JPG, PNG) ou PDFs.
        </p>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

const LancarTurnoPage: React.FC = () => {

  // Selection state
  const [storeId, setStoreId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [shiftCode, setShiftCode] = useState<ShiftCode | ''>('');
  const [sellerId, setSellerId] = useState<string>('');
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [confirmActionOpen, setConfirmActionOpen] = useState(false);
  const [preferredSellerGuid, setPreferredSellerGuid] = useState<string | null>(null);

  // Form state
  const [lines, setLines] = useState<ClosingLineFormData[]>(DEFAULT_CLOSING_LINES);
  const [existingShiftId, setExistingShiftId] = useState<number | null>(null);

  // Justification state (per-shift, not per-line)
  const [justificationText, setJustificationText] = useState<string>('');
  const [observerNotes, setObserverNotes] = useState<string>('');

  // Attachment staging state
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const handleAddPendingFiles = (files: File[]) => setPendingFiles(prev => [...prev, ...files]);
  const handleRemovePendingFile = (index: number) => setPendingFiles(prev => prev.filter((_, i) => i !== index));

  const { data: publicStoresData } = useQuery({
    queryKey: ['public-stores-for-operacoes-link'],
    queryFn: () => getAllPublicStores({ per_page: 200 }),
    staleTime: 1000 * 60 * 10,
  });

  // Queries
  // Smart Filters
  const { data: filters, isFetching: filtersFetching } = useClosureFilters(
    storeId ? parseInt(storeId) : undefined,
    date || undefined,
    shiftCode ? normalizeShiftCode(shiftCode) : undefined
  );

  const { data: pendingTurnsData, isLoading: pendingTurnsLoading } = useConferencePendingTurns(
    {
      limit: 200,
      store_id: storeId ? parseInt(storeId, 10) : undefined,
      date: date || undefined,
      shift_code: shiftCode ? normalizeShiftCode(shiftCode) : undefined,
    },
    true
  );

  const availableDates = useMemo(() => {
    const normalized = (filters?.dates ?? [])
      .map((raw) => extractDateKey(raw))
      .filter((raw): raw is string => Boolean(raw));
    return Array.from(new Set(normalized)).sort();
  }, [filters?.dates]);

  // Auto-select Store or Reset if invalid
  useEffect(() => {
    if (filtersFetching || !filters?.stores) return;

    // 1. If currently selected store is no longer in the list, reset it
    if (storeId) {
      const exists = filters.stores.find(s => String(s.id) === storeId);
      if (!exists) setStoreId('');
    }

    // 2. If no store selected and only one available, auto-select
    if (filters.stores.length === 1 && !storeId) {
      setStoreId(String(filters.stores[0].id));
    }
  }, [filters?.stores, storeId, filtersFetching]);

  // Auto-select Date or Reset if invalid
  useEffect(() => {
    if (filtersFetching) return;

    if (availableDates.length === 0) {
      if (date) setDate('');
      return;
    }

    // 1. If currently selected date is no longer in the list, reset it
    if (date) {
      const normalizedSelectedDate = extractDateKey(date);
      const exists = normalizedSelectedDate ? availableDates.includes(normalizedSelectedDate) : false;
      if (!exists) setDate('');
    }

    // 2. If no date selected and only one available, auto-select
    if (availableDates.length === 1 && !date) {
      setDate(availableDates[0]);
    }
  }, [availableDates, date, filtersFetching]);

  // Auto-select Shift or Reset if invalid
  useEffect(() => {
    if (filtersFetching || !filters?.shifts) return;

    // 1. If currently selected shift is no longer in the list, reset it
    if (shiftCode) {
      const exists = filters.shifts.map((code) => normalizeShiftCode(code)).includes(normalizeShiftCode(shiftCode));
      if (!exists) setShiftCode('');
    }

    // 2. If no shift selected and only one available, auto-select
    if (filters.shifts.length === 1 && !shiftCode) {
      setShiftCode(normalizeShiftCode(filters.shifts[0]) as ShiftCode);
    }
  }, [filters?.shifts, shiftCode, filtersFetching]);

  // Auto-select Seller
  const sellers = useMemo(() => {
    if (!filters?.sellers) return [];
    const { suggested, all } = filters.sellers;
    if (suggested) {
      return [suggested, ...all.filter(s => s.id !== suggested.id)];
    }
    return all;
  }, [filters?.sellers]);

  useEffect(() => {
    if (filters?.sellers.suggested && !sellerId) {
      setSellerId(String(filters.sellers.suggested.id));
    }
  }, [filters?.sellers.suggested, sellerId]);

  useEffect(() => {
    if (filtersFetching) return;
    if (!sellerId || sellers.length === 0) return;
    const exists = sellers.some((seller) => String(seller.id) === sellerId);
    if (!exists) {
      setSellerId('');
    }
  }, [sellerId, sellers, filtersFetching]);

  useEffect(() => {
    if (!preferredSellerGuid || sellers.length === 0) return;
    const normalizedGuid = preferredSellerGuid.trim().toLowerCase();
    const matchedSeller = sellers.find((seller) => seller.guid?.trim().toLowerCase() === normalizedGuid);
    if (matchedSeller) {
      setSellerId(String(matchedSeller.id));
    }
    setPreferredSellerGuid(null);
  }, [preferredSellerGuid, sellers]);

  // Get existing shift
  const { data: shiftsData } = useCashShifts({
    store_id: storeId ? parseInt(storeId) : undefined,
    date: date || undefined,
    shift_code: shiftCode ? normalizeShiftCode(shiftCode) : undefined,
    seller_id: sellerId ? parseInt(sellerId) : undefined,
    per_page: 100,
  });

  // Get existing closing if shift exists
  const { data: closingData, isLoading: closingLoading } = useCashClosing(existingShiftId || 0, !!existingShiftId);

  // Mutations
  const updateClosingMutation = useUpdateClosing();
  const createClosingMutation = useCreateClosing();
  const createShiftMutation = useCreateCashShift();
  const submitClosingMutation = useSubmitClosing();
  const approveClosingMutation = useApproveClosing();

  // PDV Data (Real-time integration)
  const { data: pdvData } = usePdvClosureData(
    storeId ? parseInt(storeId) : 0,
    date,
    shiftCode ? normalizeShiftCode(shiftCode) : '',
    !!storeId && !!date && !!shiftCode
  );

  const declaredValuesByLabel = useMemo(() => {
    const map = new Map<string, number>();
    const declaredPayments = pdvData?.data?.payments_declarado || [];
    declaredPayments.forEach((payment: { label: string; value: number }) => {
      map.set(normalizePaymentLabel(payment.label), toNumber(payment.value));
    });
    return map;
  }, [pdvData]);

  // Find sellers (vendedores only)


  // Derive PDV turno info (responsavel, status)
  const pdvDetail: PdvClosureDetail | null = useMemo(() => {
    if (!pdvData?.data?.details?.length) return null;
    return pdvData.data.details[0];
  }, [pdvData]);

  const hasClosedUnifiedTurn = useMemo(
    () => Boolean(pdvData?.data && pdvData.data.closures_found > 0),
    [pdvData]
  );

  const turnoFechado = useMemo(() => {
    if (!pdvDetail) return null;
    return !!parseApiDateTimeToDate(pdvDetail.data_hora_termino);
  }, [pdvDetail]);

  const historyStoreIdentifier = useMemo(() => {
    if (!storeId) return undefined;
    const storeNumericId = parseInt(storeId, 10);
    if (Number.isNaN(storeNumericId)) return storeId;

    const matchedStore = publicStoresData?.data?.find((store) => store.id === storeNumericId);
    if (!matchedStore) return storeId;

    return getStoreIdentifier(matchedStore);
  }, [storeId, publicStoresData]);



  const pendingTurns = useMemo(
    () => pendingTurnsData?.data?.turns || [],
    [pendingTurnsData]
  );

  const pendingTurnsCount = pendingTurnsData?.data?.total_pending ?? 0;

  const pendingCountLabel = useMemo(() => {
    const unit = pendingTurnsCount === 1 ? 'turno' : 'turnos';

    if (storeId && date && shiftCode) {
      return `${pendingTurnsCount} ${unit} para conferencia com loja, data e turno selecionados`;
    }

    if (storeId && date) {
      return `${pendingTurnsCount} ${unit} para conferencia com loja e data selecionadas`;
    }

    if (storeId) {
      return `${pendingTurnsCount} ${unit} para conferencia na loja selecionada`;
    }

    return `${pendingTurnsCount} ${unit} pendentes de conferencia no total`;
  }, [pendingTurnsCount, storeId, date, shiftCode]);

  const handleSelectPendingTurn = (turn: ConferencePendingTurn) => {
    setStoreId(String(turn.store.id));
    setDate(turn.date);
    setShiftCode(normalizeShiftCode(turn.shift_code) as ShiftCode);
    setSellerId('');

    if (turn.responsavel?.guid) {
      setPreferredSellerGuid(String(turn.responsavel.guid).toLowerCase());
    } else {
      setPreferredSellerGuid(null);
    }

    setPendingModalOpen(false);
  };

  // Find existing shift when selection changes
  useEffect(() => {
    if (!shiftsData?.data || !sellerId || !shiftCode) {
      setExistingShiftId(null);
      return;
    }

    const selectedSellerId = Number.parseInt(sellerId, 10);
    if (Number.isNaN(selectedSellerId)) {
      setExistingShiftId(null);
      return;
    }

    const existing = shiftsData.data.find((shift) => {
      const isSameSeller = shift.seller_id === selectedSellerId;
      const isSameShift = normalizeShiftCode(shift.shift_code) === normalizeShiftCode(shiftCode);
      return isSameSeller && isSameShift;
    });

    setExistingShiftId(existing?.id || null);
  }, [shiftsData, sellerId, shiftCode]);

  // Load existing closing data into form
  useEffect(() => {
    if (closingData?.data) {
      // Load lines
      if (closingData.data.lines && closingData.data.lines.length > 0) {
        const existingLines = closingData.data.lines.map(l => ({
          label: l.label,
          system_value: toNumber(l.system_value),
          real_value: toNumber(l.real_value),
        }));
        setLines(existingLines);
      } else {
        setLines(DEFAULT_CLOSING_LINES);
      }

      // Load justification (now at closing level)
      setJustificationText(closingData.data.justification_text || '');
      setObserverNotes(closingData.data.observer_notes || '');
    } else {
      setLines(DEFAULT_CLOSING_LINES);
      setJustificationText('');
      setObserverNotes('');
    }
  }, [closingData]);

  // Build dynamic payment lines from PDV data
  useEffect(() => {
    if (!hasClosedUnifiedTurn || !pdvData?.data?.payments_sistema) return;

    // If there's existing closing data with lines, load those
    if (closingData?.data?.lines && closingData.data.lines.length > 0) return;

    const apiPayments = pdvData.data.payments_sistema;
    if (apiPayments.length === 0) {
      setLines(DEFAULT_CLOSING_LINES);
      return;
    }

    // Dynamically build lines from what the API returned
    const dynamicLines: ClosingLineFormData[] = apiPayments.map(p => ({
      label: p.label,
      system_value: toNumber(p.value),
      real_value: 0,
    }));

    setLines(dynamicLines);
  }, [pdvData, closingData, hasClosedUnifiedTurn]);

  // Calculate totals
  const totals = useMemo(() => {
    const systemTotal = lines.reduce((sum, l) => sum + toNumber(l.system_value), 0);
    const realTotal = lines.reduce((sum, l) => sum + toNumber(l.real_value), 0);
    const diff = Number((realTotal - systemTotal).toFixed(2));
    const hasValues = lines.some((line) => toNumber(line.real_value) !== 0);
    const hasDivergence = Math.abs(diff) >= 0.01;

    return { systemTotal, realTotal, diff, hasValues, hasDivergence };
  }, [lines]);

  const hasConferenceJustification = useMemo(() => {
    return Boolean(justificationText.trim()) || Boolean(observerNotes.trim());
  }, [justificationText, observerNotes]);

  // Handle line change
  const handleLineChange = (index: number, field: keyof ClosingLineFormData, value: number) => {
    setLines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Available payment methods (not yet in the lines list)
  const availablePaymentMethods = useMemo(() => {
    const usedLabels = new Set(lines.map(l => normalizePaymentLabel(l.label)));
    return ALL_PAYMENT_METHODS.filter(label => !usedLabels.has(normalizePaymentLabel(label)));
  }, [lines]);

  // Add adjustment line
  const handleAddAdjustmentLine = (label: string) => {
    setLines(prev => [...prev, { label, system_value: 0, real_value: 0 }]);
  };

  // Remove adjustment line
  const handleRemoveAdjustmentLine = (index: number) => {
    setLines(prev => {
      const line = prev[index];
      // Only allow removing lines with system_value === 0 (adjustment lines)
      if (toNumber(line.system_value) !== 0) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  // Handle action (submit or approve, depending on current status)
  const handleSubmit = async () => {
    if (!storeId || !date || !shiftCode || !sellerId || !hasClosedUnifiedTurn) return;

    try {
      if (existingShiftId && closingData?.data?.status === 'submitted') {
        await approveClosingMutation.mutateAsync(existingShiftId);
        return;
      }

      const closingPayload = {
        lines: lines.map(l => ({
          label: l.label,
          system_value: toNumber(l.system_value),
          real_value: toNumber(l.real_value),
        })),
        justification_text: justificationText.trim() || null,
        justified: hasConferenceJustification,
        observer_notes: observerNotes.trim() || null,
      };

      let targetShiftId = existingShiftId;

      if (!targetShiftId) {
        const createdShift = await createShiftMutation.mutateAsync({
          store_id: Number.parseInt(storeId, 10),
          date,
          shift_code: normalizeShiftCode(shiftCode) as ShiftCode,
          seller_id: Number.parseInt(sellerId, 10),
        });
        targetShiftId = createdShift.data.id;
        setExistingShiftId(targetShiftId);
      }

      if (closingData?.data) {
        await updateClosingMutation.mutateAsync({
          shiftId: targetShiftId,
          data: closingPayload,
        });
      } else {
        await createClosingMutation.mutateAsync({
          shiftId: targetShiftId,
          data: closingPayload,
        });
      }

      // Upload pending attachment files sequentially
      if (pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          await uploadAttachment(targetShiftId, file);
        }
        setPendingFiles([]);
      }

      await submitClosingMutation.mutateAsync(targetShiftId);
    } catch (error) {
      // Error handled by mutations
    }
  };

  const isLoading =
    createShiftMutation.isPending ||
    createClosingMutation.isPending ||
    updateClosingMutation.isPending ||
    submitClosingMutation.isPending ||
    approveClosingMutation.isPending;

  const closingStatus = closingData?.data?.status;

  const actionMode = useMemo<'submit' | 'approve' | 'readonly' | 'unavailable'>(() => {
    if (!storeId || !date || !shiftCode || !sellerId || !hasClosedUnifiedTurn) return 'unavailable';
    if (closingStatus === 'submitted') return 'approve';
    if (closingStatus === 'rejected') return 'unavailable';
    if (closingStatus === 'draft') return 'submit';
    if (closingStatus === 'approved') return 'readonly';
    return 'submit';
  }, [storeId, date, shiftCode, sellerId, hasClosedUnifiedTurn, closingStatus]);

  const actionLabel = useMemo(() => {
    if (actionMode === 'approve') return 'Validar conferencia';
    if (actionMode === 'submit') {
      return totals.hasDivergence && hasConferenceJustification
        ? 'Enviar para aprovacao'
        : 'Validar conferencia';
    }
    if (actionMode === 'readonly') return 'Conferencia validada';
    return 'Acao indisponivel';
  }, [actionMode, totals.hasDivergence, hasConferenceJustification]);

  const closingStatusLabel = useMemo(() => {
    if (!closingStatus || closingStatus === 'draft') return 'Pendente de conferencia';
    if (closingStatus === 'submitted') return 'Aguardando aprovacao';
    if (closingStatus === 'approved') {
      return totals.hasDivergence && !hasConferenceJustification
        ? 'Aprovado Justificado'
        : 'Aprovado';
    }
    if (closingStatus === 'rejected') return 'Reprovado';
    return closingStatus;
  }, [closingStatus, totals.hasDivergence, hasConferenceJustification]);

  const shouldShowConferenceCard = Boolean(storeId && date && shiftCode && sellerId);
  const canRenderConferenceDetails = Boolean(
    shouldShowConferenceCard &&
    hasClosedUnifiedTurn
  );
  const canEditConferenceValues = Boolean(
    canRenderConferenceDetails &&
    actionMode === 'submit'
  );

  const isActionDisabled = actionMode === 'submit'
    ? isLoading || !canEditConferenceValues || lines.length === 0 || closingLoading
    : actionMode !== 'approve' || isLoading;

  const confirmDialogConfig = useMemo(() => {
    if (actionMode === 'approve') {
      return {
        title: 'Validar conferencia?',
        description: 'Tem certeza que deseja validar esta conferencia? Esta acao nao pode ser desfeita.',
        confirmLabel: 'Confirmar validacao',
        destructive: false,
        icon: CheckCircle,
        iconContainerClass: 'bg-emerald-500/15 text-emerald-600 ring-emerald-500/30',
        impactTitle: 'Acao definitiva',
        impactDescription: 'Depois de validar, este fechamento segue para o historico como aprovado.',
      };
    }

    if (totals.hasDivergence && !hasConferenceJustification) {
      return {
        title: 'Validar divergencia sem justificativa?',
        description: 'Tem certeza que deseja validar essa divergencia sem justificativa? Ela vai afetar diretamente o bonus do vendedor.',
        confirmLabel: 'Validar com divergencia',
        destructive: true,
        icon: AlertTriangle,
        iconContainerClass: 'bg-destructive/15 text-destructive ring-destructive/30',
        impactTitle: 'Impacto em bonus e comissao',
        impactDescription: 'Esta validacao registra divergencia sem justificativa vinculada ao vendedor selecionado.',
      };
    }

    if (totals.hasDivergence && hasConferenceJustification) {
      const parts: string[] = [];
      if (justificationText.trim()) parts.push(`Justificativa do Vendedor: ${justificationText.trim()}`);
      if (observerNotes.trim()) parts.push(`Observacoes do Conferente: ${observerNotes.trim()}`);
      return {
        title: 'Enviar para aprovacao?',
        description: 'Existe divergencia com justificativa. O fechamento sera enviado para aprovacao do gestor.',
        confirmLabel: 'Enviar para aprovacao',
        destructive: false,
        icon: ShieldCheck,
        iconContainerClass: 'bg-amber-500/15 text-amber-600 ring-amber-500/30',
        impactTitle: 'Justificativa',
        impactDescription: parts.join('\n'),
      };
    }

    return {
      title: 'Concluir conferencia?',
      description: 'Tem certeza que deseja concluir esta conferencia sem divergencias?',
      confirmLabel: 'Concluir conferencia',
      destructive: false,
      icon: FileCheck,
      iconContainerClass: 'bg-primary/15 text-primary ring-primary/30',
      impactTitle: 'Conferencia sem divergencias',
      impactDescription: 'Os valores conferem e o turno sera aprovado no historico.',
    };
  }, [actionMode, totals.hasDivergence, hasConferenceJustification, justificationText, observerNotes]);

  const handleActionClick = () => {
    if (isActionDisabled) return;
    setConfirmActionOpen(true);
  };

  const handleConfirmAction = async () => {
    setConfirmActionOpen(false);
    await handleSubmit();
  };

  const ConfirmIcon = confirmDialogConfig.icon;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader
        title="Conferir Caixa"
        description="Compare os valores do sistema com os valores reais do envelope"
        icon={FileCheck}
      />

      {/* Selection Card */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Selecionar Turno
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setPendingModalOpen(true)}
          >
            <ListChecks className="h-4 w-4" />
            Visualizar pendentes
            {pendingTurnsCount > 0 ? ` (${pendingTurnsCount})` : ''}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Store */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Loja
              </Label>
              <Select value={storeId || 'all'} onValueChange={(v) => setStoreId(v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a loja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as lojas</SelectItem>
                  {[...(filters?.stores ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true })).map(store => (
                    <SelectItem key={store.id} value={String(store.id)}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data
              </Label>
              <Select
                value={date || 'all'}
                onValueChange={(value) => setDate(value === 'all' ? '' : (extractDateKey(value) ?? value))}
                disabled={!storeId || !availableDates.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as datas</SelectItem>
                  {availableDates.map(d => (
                    <SelectItem key={d} value={d}>
                      {formatDateOption(d)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Shift */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Turno
              </Label>
              <Select value={shiftCode || 'all'} onValueChange={(v) => setShiftCode(v === 'all' ? '' : v as ShiftCode)} disabled={!date}>
                <SelectTrigger>
                  <SelectValue placeholder="Turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os turnos</SelectItem>
                  {filters?.shifts?.map(code => (
                    <SelectItem key={code} value={normalizeShiftCode(code)}>
                      {SHIFT_CODES[normalizeShiftCode(code) as ShiftCode] || `Turno ${code}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seller */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Vendedor
              </Label>
              <Select
                value={sellerId}
                onValueChange={setSellerId}
                disabled={!storeId || !date || !shiftCode || sellers.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!shiftCode ? 'Selecione o turno' : 'Selecione'} />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map(seller => (
                    <SelectItem key={seller.id} value={String(seller.id)}>
                      {seller.name} {filters?.sellers.suggested?.id === seller.id ? '(Sugerido)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {pendingCountLabel}
          </p>

          {filters && filters.stores.length === 0 && (
            <Alert className="mt-4 border-amber-300/50 bg-amber-50/70">
              <Info className="h-4 w-4" />
              <AlertTitle>Nenhum turno pendente para conferencia</AlertTitle>
              <AlertDescription>
                No momento nao existem turnos fechados/unificados sem status de conferencia para as lojas disponiveis.
              </AlertDescription>
            </Alert>
          )}

          {/* PDV Turno Info Bar */}
          {hasClosedUnifiedTurn && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* Turno open/closed */}
              {turnoFechado !== null && (
                <Badge
                  variant={turnoFechado ? 'default' : 'secondary'}
                  className={cn(
                    'gap-1.5 px-3 py-1',
                    turnoFechado
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300'
                  )}
                >
                  {turnoFechado ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  Turno {turnoFechado ? 'Fechado' : 'Aberto'}
                </Badge>
              )}



              {/* Responsavel */}
              {pdvDetail?.responsavel?.nome && (
                <Badge variant="outline" className="gap-1.5 px-3 py-1 border-violet-200 bg-violet-50/50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Responsável: {pdvDetail.responsavel.nome}
                </Badge>
              )}

              {/* Operador */}
              {pdvDetail?.operador && (
                <Badge variant="outline" className="gap-1.5 px-3 py-1">
                  <Users className="h-3.5 w-3.5" />
                  Operador: {pdvDetail.operador}
                </Badge>
              )}

              {/* Time range */}
              {pdvDetail?.data_hora_inicio && (
                <Badge variant="outline" className="gap-1.5 px-3 py-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatApiTime(pdvDetail.data_hora_inicio)}
                  {formatApiTime(pdvDetail.data_hora_termino) && (
                    <>{' -> '}{formatApiTime(pdvDetail.data_hora_termino)}</>
                  )}
                </Badge>
              )}

              {/* Canais */}
              {pdvData.data.canais_presentes?.length > 0 && (
                <Badge variant="outline" className="gap-1 px-3 py-1 text-xs text-muted-foreground">
                  {pdvData.data.canais_presentes.join(' + ')}
                </Badge>
              )}


            </div>
          )}

          {storeId && date && shiftCode && pdvData?.data && !hasClosedUnifiedTurn && (
            <Alert className="mt-4 border-destructive/40 bg-destructive/5">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Turno indisponivel para conferencia</AlertTitle>
              <AlertDescription>
                Nenhum fechamento unificado e fechado foi encontrado para esta loja, data e turno.
                A conferencia so pode ocorrer com turno fechado.
              </AlertDescription>
            </Alert>
          )}

          {/* Existing shift status */}
          {existingShiftId && closingStatus && (
            <div className="mt-3">
              <Badge variant={
                closingStatus === 'approved' ? 'default' :
                  closingStatus === 'rejected' ? 'destructive' :
                    'secondary'
              }>
                Status: {closingStatusLabel}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={pendingModalOpen} onOpenChange={setPendingModalOpen}>
        <DialogContent className="max-w-6xl max-h-[88vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Pendentes de conferencia
            </DialogTitle>
            <DialogDescription>
              Turnos fechados/unificados sem status de conferencia, ordenados por data e hora.
              {storeId || date || shiftCode ? ` Filtros ativos: ${pendingCountLabel}.` : ''}
              {' '}Selecione um turno para abrir o lancamento.
            </DialogDescription>
          </DialogHeader>

          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data e hora</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Responsavel</TableHead>
                  <TableHead className="text-right">Valor total</TableHead>
                  <TableHead className="text-right">Acao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTurnsLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando pendentes...
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {!pendingTurnsLoading && pendingTurns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      Nenhum turno pendente encontrado.
                    </TableCell>
                  </TableRow>
                )}

                {!pendingTurnsLoading && [...pendingTurns].sort((a, b) => {
                  const dateA = a.reference_datetime || '';
                  const dateB = b.reference_datetime || '';
                  return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
                }).map((turn) => {
                  const normalizedShift = normalizeShiftCode(turn.shift_code) as ShiftCode;
                  return (
                    <TableRow key={turn.closure_uuid}>
                      <TableCell className="font-mono text-xs">
                        {formatApiDateTime(turn.reference_datetime)}
                      </TableCell>
                      <TableCell>{turn.store.name}</TableCell>
                      <TableCell>{SHIFT_CODES[normalizedShift] || `Turno ${turn.shift_code}`}</TableCell>
                      <TableCell>{turn.responsavel.nome || '-'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(turn.total_value)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSelectPendingTurn(turn)}
                        >
                          Conferir
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs: Conference + Operations */}
      {shouldShowConferenceCard && (
        <Tabs defaultValue="conferencia" className="animate-fade-in">
          {hasClosedUnifiedTurn && (
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="conferencia" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Conferência de Valores
              </TabsTrigger>
              <TabsTrigger value="operacoes" className="gap-2">
                <History className="h-4 w-4" />
                Operações do Turno
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="conferencia">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Conferência de Valores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!hasClosedUnifiedTurn && (
                  <Alert className="border-destructive/40 bg-destructive/5">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Sem turno fechado para conferencia</AlertTitle>
                    <AlertDescription>
                      Essa combinacao nao possui fechamento unificado fechado no PDV.
                    </AlertDescription>
                  </Alert>
                )}

                {hasClosedUnifiedTurn && !existingShiftId && (
                  <Alert className="border-amber-300/50 bg-amber-50/70">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Vendedor sem vinculacao previa neste fechamento</AlertTitle>
                    <AlertDescription>
                      O turno fechado existe no PDV. Ao validar esta conferencia, o sistema cria e vincula automaticamente o lancamento para o vendedor selecionado.
                    </AlertDescription>
                  </Alert>
                )}

                {hasClosedUnifiedTurn && existingShiftId && closingLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {hasClosedUnifiedTurn && existingShiftId && !closingLoading && !closingData?.data && (
                  <Alert className="border-amber-300/50 bg-amber-50/70">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Lancamento sera criado no envio</AlertTitle>
                    <AlertDescription>
                      Este vendedor ainda nao possui fechamento de caixa nessa combinacao. O lancamento sera criado ao validar a conferencia.
                    </AlertDescription>
                  </Alert>
                )}

                {canRenderConferenceDetails && (
                  <>
                    {/* Info Alert */}
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Como preencher</AlertTitle>
                      <AlertDescription>
                        Os meios de pagamento são carregados automaticamente do PDV.
                        Preencha os valores <strong>Reais</strong> (contados no envelope).
                      </AlertDescription>
                    </Alert>

                    {/* PDV Totals Summary */}
                    {pdvData?.data && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-lg border p-3 text-center bg-muted/30">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Sistema</p>
                          <p className="text-base font-bold font-mono">{formatCurrency(toNumber(pdvData.data.system_total))}</p>
                        </div>
                        <div className="rounded-lg border p-3 text-center bg-muted/30">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Declarado</p>
                          <p className="text-base font-bold font-mono">{formatCurrency(toNumber(pdvData.data.declared_total))}</p>
                        </div>
                        {toNumber(pdvData.data.falta_total) > 0 && (
                          <div className="rounded-lg border p-3 text-center border-red-200 bg-red-50/50 dark:bg-red-950/20">
                            <p className="text-[10px] text-red-600 uppercase tracking-wider font-medium">Falta</p>
                            <p className="text-base font-bold font-mono text-red-600">{formatCurrency(toNumber(pdvData.data.falta_total))}</p>
                          </div>
                        )}
                        {toNumber(pdvData.data.sobra_total) > 0 && (
                          <div className="rounded-lg border p-3 text-center border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                            <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-medium">Sobra</p>
                            <p className="text-base font-bold font-mono text-emerald-600">{formatCurrency(toNumber(pdvData.data.sobra_total))}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lines */}
                    <div className="space-y-3">
                      {lines.map((line, index) => {
                        const isAdj = toNumber(line.system_value) === 0 && !declaredValuesByLabel.has(normalizePaymentLabel(line.label));
                        return (
                          <LineInput
                            key={`${line.label}-${index}`}
                            line={line}
                            index={index}
                            declaredValue={declaredValuesByLabel.get(normalizePaymentLabel(line.label))}
                            onChange={handleLineChange}
                            disabled={!canEditConferenceValues}
                            isAdjustment={isAdj}
                            onRemove={isAdj ? handleRemoveAdjustmentLine : undefined}
                          />
                        );
                      })}
                    </div>

                    {/* Add adjustment line button */}
                    {canEditConferenceValues && availablePaymentMethods.length > 0 && (
                      <div className="flex items-center gap-3">
                        <Select onValueChange={handleAddAdjustmentLine}>
                          <SelectTrigger className="w-auto gap-2 border-dashed border-amber-400/50 text-amber-700 hover:bg-amber-50/50">
                            <PlusCircle className="h-4 w-4" />
                            <SelectValue placeholder="Inserir outro meio de pagamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePaymentMethods.map(label => (
                              <SelectItem key={label} value={label}>
                                <span className="flex items-center gap-2">
                                  {getPaymentIcon(label)}
                                  {label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">
                          Linhas de ajuste não possuem valor Sistema
                        </span>
                      </div>
                    )}

                    <Separator />

                    {/* Totals */}
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="bg-muted/50">
                        <CardContent className="pt-4 text-center">
                          <p className="text-sm text-muted-foreground">Total Sistema</p>
                          <p className="text-2xl font-bold font-mono">{formatCurrency(totals.systemTotal)}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/50">
                        <CardContent className="pt-4 text-center">
                          <p className="text-sm text-muted-foreground">Total Real</p>
                          <p className="text-2xl font-bold font-mono">{formatCurrency(totals.realTotal)}</p>
                        </CardContent>
                      </Card>
                      <Card className={cn(
                        totals.diff === 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-destructive/10 border-destructive/30'
                      )}>
                        <CardContent className="pt-4 text-center">
                          <p className="text-sm text-muted-foreground">Diferença</p>
                          <p className={cn(
                            'text-2xl font-bold font-mono',
                            totals.diff === 0 ? 'text-green-600' : 'text-destructive'
                          )}>
                            {totals.diff >= 0 ? '+' : ''}{formatCurrency(totals.diff)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Justification Section (per-shift, optional) */}
                    {canEditConferenceValues && totals.hasDivergence && (
                      <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-4">
                        <div className="flex items-center gap-2 text-amber-600">
                          <AlertTriangle className="h-5 w-5" />
                          <span className="font-medium">Divergência Detectada</span>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="justification">Justificativa do Vendedor (opcional)</Label>
                          <Textarea
                            id="justification"
                            value={justificationText}
                            onChange={(e) => setJustificationText(e.target.value)}
                            placeholder="Justificativa do vendedor sobre a divergência..."
                            className="min-h-[80px]"
                            disabled={!canEditConferenceValues}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="observer-notes">Observações do Conferente (opcional)</Label>
                          <Textarea
                            id="observer-notes"
                            value={observerNotes}
                            onChange={(e) => setObserverNotes(e.target.value)}
                            placeholder="Observações do conferente sobre a divergência..."
                            className="min-h-[80px]"
                            disabled={!canEditConferenceValues}
                          />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Se houver justificativa em qualquer campo, o turno segue para aprovação do gestor. Sem justificativa, um eventual bônus será anulado.
                        </p>
                      </div>
                    )}

                    {/* Attachments Section */}
                    <Separator />
                    <AttachmentSection
                      savedAttachments={closingData?.data?.attachments ?? []}
                      pendingFiles={pendingFiles}
                      onAddFiles={handleAddPendingFiles}
                      onRemovePendingFile={handleRemovePendingFile}
                      shiftId={existingShiftId ?? undefined}
                      disabled={!canEditConferenceValues}
                    />

                    {/* Status Indicator */}
                    {totals.hasValues && !totals.hasDivergence && (
                      <div className="p-4 rounded-lg border bg-green-500/5 border-green-500/30 flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="font-medium text-green-600">Caixa Batendo!</p>
                          <p className="text-sm text-muted-foreground">Os valores conferem. Pronto para enviar.</p>
                        </div>
                      </div>
                    )}

                    {/* Submit/Approve Button */}
                    {actionMode !== 'readonly' && actionMode !== 'unavailable' && (
                      <div className="flex justify-end pt-4">
                        <Button
                          size="lg"
                          onClick={handleActionClick}
                          disabled={isActionDisabled}
                          className="gap-2"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              {actionMode === 'approve' ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : (
                                <Send className="h-5 w-5" />
                              )}
                              {actionLabel}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {hasClosedUnifiedTurn && historyStoreIdentifier && (
            <TabsContent value="operacoes">
              <ConferenciaOperacoesTab
                storeIdentifier={String(historyStoreIdentifier)}
                date={date}
                shiftCode={normalizeShiftCode(shiftCode)}
              />
            </TabsContent>
          )}
        </Tabs>
      )}

      <AlertDialog open={confirmActionOpen} onOpenChange={setConfirmActionOpen}>
        <AlertDialogContent className="sm:max-w-xl overflow-hidden p-0">
          <div className={cn(
            'h-1.5 w-full',
            confirmDialogConfig.destructive ? 'bg-destructive' : 'bg-primary/70'
          )} />

          <div className="space-y-5 p-6">
            <AlertDialogHeader className="space-y-3 text-center">
              <div className="flex justify-center">
                <div className={cn(
                  'relative flex h-16 w-16 items-center justify-center rounded-full ring-4',
                  confirmDialogConfig.iconContainerClass
                )}>
                  <ConfirmIcon className={cn(
                    'h-8 w-8',
                    confirmDialogConfig.destructive ? 'animate-pulse' : 'animate-bounce'
                  )} />
                  {confirmDialogConfig.destructive && (
                    <span className="absolute inset-0 rounded-full border-2 border-destructive/40 animate-ping" />
                  )}
                </div>
              </div>

              <AlertDialogTitle className="text-xl">{confirmDialogConfig.title}</AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-relaxed">
                {confirmDialogConfig.description}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Impact / Justification boxes */}
            {totals.hasDivergence && hasConferenceJustification ? (
              <div className="space-y-2">
                {justificationText.trim() && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                    <p className="font-semibold text-amber-700">Justificativa do Vendedor</p>
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{justificationText.trim()}</p>
                  </div>
                )}
                {observerNotes.trim() && (
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-sm">
                    <p className="font-semibold text-blue-700">Observacoes do Conferente</p>
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{observerNotes.trim()}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className={cn(
                'rounded-lg border p-3 text-sm',
                confirmDialogConfig.destructive
                  ? 'border-destructive/30 bg-destructive/5'
                  : 'border-primary/30 bg-primary/5'
              )}>
                <p className="font-semibold">{confirmDialogConfig.impactTitle}</p>
                <p className="text-muted-foreground mt-1">{confirmDialogConfig.impactDescription}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-3 text-center">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Sistema</p>
                <p className="font-mono font-semibold">{formatCurrency(totals.systemTotal)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Conferencia</p>
                <p className="font-mono font-semibold">{formatCurrency(totals.realTotal)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Diferenca</p>
                <p className={cn(
                  'font-mono font-semibold',
                  totals.diff === 0 ? 'text-emerald-600' : 'text-destructive'
                )}>
                  {totals.diff >= 0 ? '+' : ''}{formatCurrency(totals.diff)}
                </p>
              </div>
            </div>
          </div>

          <AlertDialogFooter className="border-t bg-muted/20 px-6 py-4">
            <AlertDialogCancel disabled={isLoading} className="min-w-[120px]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isLoading}
              className={cn(
                'min-w-[180px] gap-2',
                confirmDialogConfig.destructive && 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              )}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmDialogConfig.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LancarTurnoPage;
