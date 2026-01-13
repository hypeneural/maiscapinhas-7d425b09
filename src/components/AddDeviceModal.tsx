/**
 * AddDeviceModal Component
 * 
 * Reusable modal to add a device to a customer.
 * Shows the customer name prominently to make it clear which customer is getting the device.
 */

import React, { useState, useEffect } from 'react';
import {
    Smartphone,
    Loader2,
    User,
    Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePhoneBrands, usePhoneModels } from '@/hooks/api/use-phone-catalog';
import { useAddDevice } from '@/hooks/api/use-customers';

// ============================================================
// Types
// ============================================================

export interface AddDeviceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customerId: number;
    customerName: string;
    onSuccess?: () => void;
}

// ============================================================
// Component
// ============================================================

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
    open,
    onOpenChange,
    customerId,
    customerName,
    onSuccess,
}) => {
    const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
    const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
    const [deviceNickname, setDeviceNickname] = useState('');
    const [isPrimary, setIsPrimary] = useState(false);

    const { data: brandsData } = usePhoneBrands({ per_page: 100 });
    const { data: modelsData } = usePhoneModels({
        brand_id: selectedBrandId || undefined,
        per_page: 100,
    });

    const addDeviceMutation = useAddDevice();

    const brands = brandsData?.data || [];
    const models = modelsData?.data || [];

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!open) {
            setSelectedBrandId(null);
            setSelectedModelId(null);
            setDeviceNickname('');
            setIsPrimary(false);
        }
    }, [open]);

    const handleAddDevice = async () => {
        if (!selectedModelId) return;

        await addDeviceMutation.mutateAsync({
            customerId,
            data: {
                phone_model_id: selectedModelId,
                nickname: deviceNickname || undefined,
                is_primary: isPrimary,
            },
        });

        onOpenChange(false);
        onSuccess?.();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-primary" />
                        Adicionar Aparelho
                    </DialogTitle>
                    <DialogDescription>
                        Vincule um novo aparelho ao cliente
                    </DialogDescription>
                </DialogHeader>

                {/* Customer highlight */}
                <Alert className="border-primary/20 bg-primary/5">
                    <User className="h-4 w-4" />
                    <AlertDescription className="flex items-center gap-2">
                        <span className="text-muted-foreground">Cliente:</span>
                        <Badge variant="secondary" className="font-medium text-sm">
                            {customerName}
                        </Badge>
                    </AlertDescription>
                </Alert>

                <div className="space-y-4 py-2">
                    {/* Brand */}
                    <div className="space-y-2">
                        <Label>Marca *</Label>
                        <Select
                            value={selectedBrandId?.toString() || ''}
                            onValueChange={(v) => {
                                setSelectedBrandId(parseInt(v, 10));
                                setSelectedModelId(null);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a marca" />
                            </SelectTrigger>
                            <SelectContent>
                                {brands.map((brand) => (
                                    <SelectItem key={brand.id} value={brand.id.toString()}>
                                        {brand.brand_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Model */}
                    <div className="space-y-2">
                        <Label>Modelo *</Label>
                        <Select
                            value={selectedModelId?.toString() || ''}
                            onValueChange={(v) => setSelectedModelId(parseInt(v, 10))}
                            disabled={!selectedBrandId}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        selectedBrandId
                                            ? 'Selecione o modelo'
                                            : 'Selecione a marca primeiro'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {models.map((model) => (
                                    <SelectItem key={model.id} value={model.id.toString()}>
                                        {model.marketing_name}
                                        {model.release_year && ` (${model.release_year})`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Nickname */}
                    <div className="space-y-2">
                        <Label>Apelido (opcional)</Label>
                        <Input
                            value={deviceNickname}
                            onChange={(e) => setDeviceNickname(e.target.value)}
                            placeholder="Ex: Celular do Trabalho"
                        />
                    </div>

                    {/* Primary checkbox */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="is_primary"
                            checked={isPrimary}
                            onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
                        />
                        <Label htmlFor="is_primary" className="font-normal flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-500" />
                            Definir como aparelho principal
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={addDeviceMutation.isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleAddDevice}
                        disabled={!selectedModelId || addDeviceMutation.isPending}
                        className="gap-2"
                    >
                        {addDeviceMutation.isPending && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <Smartphone className="h-4 w-4" />
                        Adicionar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddDeviceModal;
