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
  DollarSign, CreditCard, Smartphone, Banknote, Send, Info, Loader2
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
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/PageHeader';
import { useStoreUsers } from '@/hooks/api/use-admin-stores';
import { getAllPublicStores } from '@/services/stores.service';
import { useCashShifts, useCreateCashShift } from '@/hooks/api/use-cash-shifts';
import { useCashClosing, useCreateClosing, useUpdateClosing, useSubmitClosing } from '@/hooks/api/use-cash-closings';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  SHIFT_CODES, PAYMENT_LABELS, DEFAULT_CLOSING_LINES,
  type ShiftCode, type ClosingLineFormData
} from '@/types/conference.types';

// ============================================================
// Constants
// ============================================================

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  [PAYMENT_LABELS.CASH]: <Banknote className="h-5 w-5" />,
  [PAYMENT_LABELS.CREDIT_CARD]: <CreditCard className="h-5 w-5" />,
  [PAYMENT_LABELS.DEBIT_CARD]: <CreditCard className="h-5 w-5" />,
  [PAYMENT_LABELS.PIX]: <Smartphone className="h-5 w-5" />,
  [PAYMENT_LABELS.OTHER]: <DollarSign className="h-5 w-5" />,
};

// ============================================================
// Line Input Component (Simplified - no per-line justification)
// ============================================================

interface LineInputProps {
  line: ClosingLineFormData;
  index: number;
  onChange: (index: number, field: keyof ClosingLineFormData, value: number) => void;
  disabled?: boolean;
}

function LineInput({ line, index, onChange, disabled }: LineInputProps) {
  const diff = line.real_value - line.system_value;
  const hasDiff = diff !== 0;

  return (
    <div className={cn(
      'grid grid-cols-12 gap-4 p-4 rounded-lg border transition-colors',
      hasDiff ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-muted/30'
    )}>
      {/* Label */}
      <div className="col-span-3 flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-lg',
          hasDiff ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
        )}>
          {PAYMENT_ICONS[line.label] || <DollarSign className="h-5 w-5" />}
        </div>
        <span className="font-medium">{line.label}</span>
      </div>

      {/* System Value */}
      <div className="col-span-3">
        <Label className="text-xs text-muted-foreground mb-1 block">Sistema</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
          <Input
            type="number"
            value={line.system_value || ''}
            onChange={(e) => onChange(index, 'system_value', parseFloat(e.target.value) || 0)}
            className="pl-10 bg-background"
            step="0.01"
            min="0"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Real Value */}
      <div className="col-span-3">
        <Label className="text-xs text-muted-foreground mb-1 block">Real (Envelope)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
          <Input
            type="number"
            value={line.real_value || ''}
            onChange={(e) => onChange(index, 'real_value', parseFloat(e.target.value) || 0)}
            className={cn('pl-10', hasDiff && 'border-destructive focus-visible:ring-destructive')}
            step="0.01"
            min="0"
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
// Main Component
// ============================================================

const LancarTurnoPage: React.FC = () => {
  const { user } = useAuth();

  // Selection state
  const [storeId, setStoreId] = useState<string>('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [shiftCode, setShiftCode] = useState<ShiftCode>('1');
  const [sellerId, setSellerId] = useState<string>('');

  // Form state
  const [lines, setLines] = useState<ClosingLineFormData[]>(DEFAULT_CLOSING_LINES);
  const [existingShiftId, setExistingShiftId] = useState<number | null>(null);

  // Justification state (per-shift, not per-line)
  const [justificationText, setJustificationText] = useState<string>('');
  const [justified, setJustified] = useState<boolean>(false);

  // Queries
  const { data: storesData } = useQuery({
    queryKey: ['stores', 'public', { per_page: 100 }],
    queryFn: () => getAllPublicStores({ per_page: 100 }),
  });
  const { data: storeUsersData } = useStoreUsers(storeId ? parseInt(storeId) : 0);

  // Get existing shift
  const { data: shiftsData } = useCashShifts({
    store_id: storeId ? parseInt(storeId) : undefined,
    date: date,
    per_page: 100,
  });

  // Get existing closing if shift exists
  const { data: closingData } = useCashClosing(existingShiftId || 0, !!existingShiftId);

  // Mutations
  const createShiftMutation = useCreateCashShift();
  const createClosingMutation = useCreateClosing();
  const updateClosingMutation = useUpdateClosing();
  const submitClosingMutation = useSubmitClosing();

  // Find sellers (vendedores only)
  const sellers = useMemo(() => {
    return storeUsersData?.filter(u => u.role === 'vendedor') || [];
  }, [storeUsersData]);

  // Find existing shift when selection changes
  useEffect(() => {
    if (!shiftsData?.data || !sellerId || !shiftCode) {
      setExistingShiftId(null);
      return;
    }

    const existing = shiftsData.data.find(s =>
      s.seller_id === parseInt(sellerId) &&
      s.shift_code === shiftCode
    );

    setExistingShiftId(existing?.id || null);
  }, [shiftsData, sellerId, shiftCode]);

  // Load existing closing data into form
  useEffect(() => {
    if (closingData?.data) {
      // Load lines
      if (closingData.data.lines && closingData.data.lines.length > 0) {
        const existingLines = closingData.data.lines.map(l => ({
          label: l.label,
          system_value: l.system_value,
          real_value: l.real_value,
        }));
        setLines(existingLines);
      } else {
        setLines(DEFAULT_CLOSING_LINES);
      }

      // Load justification (now at closing level)
      setJustificationText(closingData.data.justification_text || '');
      setJustified(closingData.data.justified || false);
    } else {
      setLines(DEFAULT_CLOSING_LINES);
      setJustificationText('');
      setJustified(false);
    }
  }, [closingData]);

  // Calculate totals
  const totals = useMemo(() => {
    const systemTotal = lines.reduce((sum, l) => sum + (l.system_value || 0), 0);
    const realTotal = lines.reduce((sum, l) => sum + (l.real_value || 0), 0);
    const diff = realTotal - systemTotal;
    const hasValues = realTotal > 0;
    const hasDivergence = diff !== 0;

    return { systemTotal, realTotal, diff, hasValues, hasDivergence };
  }, [lines]);

  // Handle line change
  const handleLineChange = (index: number, field: keyof ClosingLineFormData, value: number) => {
    setLines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      let shiftId = existingShiftId;

      // Create shift if doesn't exist
      if (!shiftId) {
        const result = await createShiftMutation.mutateAsync({
          store_id: parseInt(storeId),
          date,
          shift_code: shiftCode,
          seller_id: parseInt(sellerId),
        });
        shiftId = result.data.id;
      }

      // Prepare closing data with per-shift justification
      const closingPayload = {
        lines: lines.map(l => ({
          label: l.label,
          system_value: l.system_value,
          real_value: l.real_value,
        })),
        justification_text: justificationText.trim() || null,
        justified: justified,
      };

      // Create or update closing
      if (closingData?.data) {
        await updateClosingMutation.mutateAsync({
          shiftId: shiftId!,
          data: closingPayload,
        });
      } else {
        await createClosingMutation.mutateAsync({
          shiftId: shiftId!,
          data: closingPayload,
        });
      }

      // Submit for approval
      await submitClosingMutation.mutateAsync(shiftId!);

      // Reset form
      setLines(DEFAULT_CLOSING_LINES);
      setSellerId('');
      setJustificationText('');
      setJustified(false);
    } catch (error) {
      // Error handled by mutations
    }
  };

  const isLoading = createShiftMutation.isPending ||
    createClosingMutation.isPending ||
    updateClosingMutation.isPending ||
    submitClosingMutation.isPending;

  const closingStatus = closingData?.data?.status;
  const isEditable = !closingStatus || closingStatus === 'draft' || closingStatus === 'rejected';

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader
        title="Lançar Turno"
        description="Compare os valores do sistema com os valores reais do envelope"
        icon={FileCheck}
      />

      {/* Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Selecionar Turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Store */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Loja
              </Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a loja" />
                </SelectTrigger>
                <SelectContent>
                  {storesData?.data.map(store => (
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
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Shift */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Turno
              </Label>
              <Select value={shiftCode} onValueChange={(v) => setShiftCode(v as ShiftCode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SHIFT_CODES).map(([code, label]) => (
                    <SelectItem key={code} value={code}>
                      {label}
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
                disabled={!storeId || sellers.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!storeId ? 'Selecione a loja' : 'Selecione'} />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map(seller => (
                    <SelectItem key={seller.user_id} value={String(seller.user_id)}>
                      {seller.user_name || `Usuário #${seller.user_id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Existing shift status */}
          {existingShiftId && closingStatus && (
            <div className="mt-4">
              <Badge variant={
                closingStatus === 'approved' ? 'default' :
                  closingStatus === 'rejected' ? 'destructive' :
                    'secondary'
              }>
                Status: {closingStatus === 'draft' ? 'Rascunho' :
                  closingStatus === 'submitted' ? 'Aguardando Aprovação' :
                    closingStatus === 'approved' ? 'Aprovado' : 'Rejeitado'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Values Card */}
      {storeId && sellerId && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Conferência de Valores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Como preencher</AlertTitle>
              <AlertDescription>
                Preencha os valores do <strong>Sistema</strong> (registrados nas vendas)
                e os valores <strong>Reais</strong> (contados no envelope).
              </AlertDescription>
            </Alert>

            {/* Lines */}
            <div className="space-y-3">
              {lines.map((line, index) => (
                <LineInput
                  key={line.label}
                  line={line}
                  index={index}
                  onChange={handleLineChange}
                  disabled={!isEditable}
                />
              ))}
            </div>

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
            {totals.hasDivergence && (
              <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-4">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Divergência Detectada</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="justification">Justificativa (opcional)</Label>
                  <Textarea
                    id="justification"
                    value={justificationText}
                    onChange={(e) => setJustificationText(e.target.value)}
                    placeholder="Explique a divergência encontrada..."
                    className="min-h-[80px]"
                    disabled={!isEditable}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="justified"
                    checked={justified}
                    onCheckedChange={(checked) => setJustified(checked === true)}
                    disabled={!isEditable}
                  />
                  <Label
                    htmlFor="justified"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Marcar como justificado (afeta cálculo de bônus)
                  </Label>
                </div>
              </div>
            )}

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

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={
                  !totals.hasValues ||
                  isLoading ||
                  !isEditable
                }
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Enviar para Conferência
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LancarTurnoPage;
