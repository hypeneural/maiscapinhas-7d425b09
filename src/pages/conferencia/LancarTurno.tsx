/**
 * Lançar Turno Page (Refactored)
 * 
 * Modern interface for recording cash shift closings.
 * Features side-by-side comparison of system vs real values.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar, Store, User, Clock, FileCheck, AlertTriangle, CheckCircle,
  DollarSign, CreditCard, Smartphone, Banknote, Send, Info, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/PageHeader';
import { useAdminStores, useStoreUsers } from '@/hooks/api/use-admin-stores';
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
// Line Input Component
// ============================================================

interface LineInputProps {
  line: ClosingLineFormData;
  index: number;
  onChange: (index: number, field: keyof ClosingLineFormData, value: string | number) => void;
  disabled?: boolean;
}

function LineInput({ line, index, onChange, disabled }: LineInputProps) {
  const diff = line.real_value - line.system_value;
  const hasDiff = diff !== 0;
  const needsJustification = hasDiff && !line.justification_text.trim();

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

      {/* Justification (if needed) */}
      {hasDiff && (
        <div className="col-span-12 mt-2">
          <Label className={cn('text-xs mb-1 block', needsJustification && 'text-destructive')}>
            Justificativa {needsJustification && '*'}
          </Label>
          <Input
            value={line.justification_text}
            onChange={(e) => onChange(index, 'justification_text', e.target.value)}
            placeholder="Explique a divergência..."
            className={cn(needsJustification && 'border-destructive')}
            disabled={disabled}
          />
        </div>
      )}
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
  const [shiftCode, setShiftCode] = useState<ShiftCode>('M');
  const [sellerId, setSellerId] = useState<string>('');

  // Form state
  const [lines, setLines] = useState<ClosingLineFormData[]>(DEFAULT_CLOSING_LINES);
  const [existingShiftId, setExistingShiftId] = useState<number | null>(null);

  // Queries
  const { data: storesData } = useAdminStores({ per_page: 100 });
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
    if (closingData?.data?.lines) {
      const existingLines = closingData.data.lines.map(l => ({
        label: l.label,
        system_value: l.system_value,
        real_value: l.real_value,
        justification_text: l.justification_text || '',
      }));
      setLines(existingLines.length > 0 ? existingLines : DEFAULT_CLOSING_LINES);
    } else {
      setLines(DEFAULT_CLOSING_LINES);
    }
  }, [closingData]);

  // Calculate totals
  const totals = useMemo(() => {
    const systemTotal = lines.reduce((sum, l) => sum + (l.system_value || 0), 0);
    const realTotal = lines.reduce((sum, l) => sum + (l.real_value || 0), 0);
    const diff = realTotal - systemTotal;
    const hasValues = realTotal > 0;

    const unjustifiedDiffs = lines.filter(l => {
      const lineDiff = l.real_value - l.system_value;
      return lineDiff !== 0 && !l.justification_text.trim();
    });

    return { systemTotal, realTotal, diff, hasValues, unjustifiedDiffs };
  }, [lines]);

  // Handle line change
  const handleLineChange = (index: number, field: keyof ClosingLineFormData, value: string | number) => {
    setLines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Handle submit
  const handleSubmit = async () => {
    // Validate
    if (totals.unjustifiedDiffs.length > 0) {
      return; // Validation is shown in UI
    }

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

      // Create or update closing
      const closingLines = lines.map(l => ({
        label: l.label,
        system_value: l.system_value,
        real_value: l.real_value,
        justification_text: l.justification_text || undefined,
      }));

      if (closingData?.data) {
        await updateClosingMutation.mutateAsync({
          shiftId: shiftId!,
          data: { lines: closingLines },
        });
      } else {
        await createClosingMutation.mutateAsync({
          shiftId: shiftId!,
          data: { lines: closingLines },
        });
      }

      // Submit for approval
      await submitClosingMutation.mutateAsync(shiftId!);

      // Reset form
      setLines(DEFAULT_CLOSING_LINES);
      setSellerId('');
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
                Divergências devem ser justificadas.
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

            {/* Status Indicator */}
            {totals.hasValues && (
              <div className={cn(
                'p-4 rounded-lg border flex items-center gap-3',
                totals.diff === 0
                  ? 'bg-green-500/5 border-green-500/30'
                  : 'bg-destructive/5 border-destructive/30'
              )}>
                {totals.diff === 0 ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-600">Caixa Batendo!</p>
                      <p className="text-sm text-muted-foreground">Os valores conferem. Pronto para enviar.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">Divergência Detectada</p>
                      <p className="text-sm text-muted-foreground">
                        {totals.unjustifiedDiffs.length > 0
                          ? `${totals.unjustifiedDiffs.length} divergência(s) sem justificativa.`
                          : 'Todas as divergências estão justificadas.'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={
                  !totals.hasValues ||
                  totals.unjustifiedDiffs.length > 0 ||
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
