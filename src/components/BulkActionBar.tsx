/**
 * Bulk Action Bar Component
 * 
 * Floating action bar that appears when items are selected.
 * Used for bulk operations like status change and send to production.
 */

import React, { useState } from 'react';
import { X, RefreshCw, Send, Loader2, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    PEDIDO_STATUS_OPTIONS,
    CAPA_STATUS_OPTIONS,
    getStatusColorClasses,
} from '@/lib/constants/status.constants';

type StatusOption = typeof PEDIDO_STATUS_OPTIONS[number] | typeof CAPA_STATUS_OPTIONS[number];

interface BulkActionBarProps {
    selectedIds: number[];
    onClearSelection: () => void;
    onStatusChange?: (ids: number[], status: number) => Promise<void>;
    onSendToProduction?: (ids: number[], date: string) => Promise<void>;
    onAddToCart?: (ids: number[]) => Promise<{ added: number; blocked: number }>;
    eligibleForCart?: number; // Count of items eligible for cart
    statusOptions?: readonly StatusOption[];
    type?: 'pedido' | 'capa';
    className?: string;
}

export function BulkActionBar({
    selectedIds,
    onClearSelection,
    onStatusChange,
    onSendToProduction,
    onAddToCart,
    eligibleForCart = 0,
    statusOptions,
    type = 'pedido',
    className,
}: BulkActionBarProps) {
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [isProductionDialogOpen, setIsProductionDialogOpen] = useState(false);
    const [isCartDialogOpen, setIsCartDialogOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [productionDate, setProductionDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cartResult, setCartResult] = useState<{ added: number; blocked: number } | null>(null);

    const options = statusOptions || (type === 'capa' ? CAPA_STATUS_OPTIONS : PEDIDO_STATUS_OPTIONS);

    const handleStatusChange = async () => {
        if (!selectedStatus || !onStatusChange) return;

        setIsLoading(true);
        try {
            await onStatusChange(selectedIds, parseInt(selectedStatus, 10));
            setIsStatusDialogOpen(false);
            setSelectedStatus('');
            onClearSelection();
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendToProduction = async () => {
        if (!productionDate || !onSendToProduction) return;

        setIsLoading(true);
        try {
            await onSendToProduction(selectedIds, productionDate);
            setIsProductionDialogOpen(false);
            setProductionDate('');
            onClearSelection();
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!onAddToCart) return;

        setIsLoading(true);
        try {
            const result = await onAddToCart(selectedIds);
            setCartResult(result);
            if (result.added > 0) {
                setIsCartDialogOpen(false);
                onClearSelection();
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (selectedIds.length === 0) {
        return null;
    }

    return (
        <>
            {/* Floating bar */}
            <div
                className={cn(
                    'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
                    'flex items-center gap-4 px-6 py-3 rounded-xl',
                    'bg-background border shadow-lg',
                    'animate-in fade-in slide-in-from-bottom-4 duration-300',
                    className
                )}
            >
                {/* Selection count */}
                <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
                        {selectedIds.length}
                    </span>
                    <span className="text-muted-foreground">
                        {selectedIds.length === 1 ? 'item selecionado' : 'itens selecionados'}
                    </span>
                </div>

                {/* Separator */}
                <div className="h-6 w-px bg-border" />

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {onStatusChange && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsStatusDialogOpen(true)}
                            className="gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Alterar Status
                        </Button>
                    )}

                    {onSendToProduction && type === 'capa' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsProductionDialogOpen(true)}
                            className="gap-2"
                        >
                            <Send className="h-4 w-4" />
                            Enviar para Produção
                        </Button>
                    )}

                    {onAddToCart && type === 'capa' && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                                setCartResult(null);
                                setIsCartDialogOpen(true);
                            }}
                            className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all shadow-md hover:shadow-lg"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            Adicionar ao Carrinho
                            {eligibleForCart < selectedIds.length && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-amber-500 text-white">
                                    {eligibleForCart}/{selectedIds.length}
                                </span>
                            )}
                        </Button>
                    )}
                </div>

                {/* Clear selection */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClearSelection}
                    className="ml-2 h-8 w-8"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Status change dialog */}
            <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Alterar Status em Lote</DialogTitle>
                        <DialogDescription>
                            Esta ação irá alterar o status de {selectedIds.length}{' '}
                            {selectedIds.length === 1 ? 'item' : 'itens'} selecionados.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Label htmlFor="status">Novo Status</Label>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Selecione o novo status" />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((option) => (
                                    <SelectItem key={option.value} value={option.value.toString()}>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    'inline-block h-2 w-2 rounded-full',
                                                    getStatusColorClasses(option.color).split(' ')[0]
                                                )}
                                            />
                                            {option.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsStatusDialogOpen(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleStatusChange}
                            disabled={!selectedStatus || isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Send to production dialog */}
            <Dialog open={isProductionDialogOpen} onOpenChange={setIsProductionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enviar para Produção</DialogTitle>
                        <DialogDescription>
                            Esta ação irá enviar {selectedIds.length}{' '}
                            {selectedIds.length === 1 ? 'capa' : 'capas'} para produção e atualizar
                            o status para "Enviado para Produção".
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Label htmlFor="production-date">Data de Envio</Label>
                        <Input
                            id="production-date"
                            type="date"
                            value={productionDate}
                            onChange={(e) => setProductionDate(e.target.value)}
                            className="mt-2"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsProductionDialogOpen(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSendToProduction}
                            disabled={!productionDate || isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enviar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add to Cart dialog */}
            <Dialog open={isCartDialogOpen} onOpenChange={setIsCartDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            Adicionar ao Carrinho de Produção
                        </DialogTitle>
                        <DialogDescription>
                            {eligibleForCart === selectedIds.length ? (
                                <span className="flex items-center gap-2 text-emerald-600">
                                    <CheckCircle className="h-4 w-4" />
                                    Todas as {selectedIds.length} capas podem ser adicionadas ao carrinho.
                                </span>
                            ) : eligibleForCart === 0 ? (
                                <span className="flex items-center gap-2 text-destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    Nenhuma capa pode ser adicionada. Somente capas com status
                                    "Encomenda Solicitada" e com foto são elegíveis.
                                </span>
                            ) : (
                                <div className="space-y-2">
                                    <span className="flex items-center gap-2 text-amber-600">
                                        <AlertCircle className="h-4 w-4" />
                                        {eligibleForCart} de {selectedIds.length} capas podem ser adicionadas.
                                    </span>
                                    <p className="text-xs text-muted-foreground">
                                        Capas bloqueadas: status diferente de "Encomenda Solicitada",
                                        sem foto, já no carrinho ou já enviadas.
                                    </p>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {cartResult && cartResult.blocked > 0 && (
                        <div className="py-2 px-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                {cartResult.added > 0 ? (
                                    <>{cartResult.added} adicionadas, {cartResult.blocked} bloqueadas.</>
                                ) : (
                                    <>Todas as {cartResult.blocked} capas foram bloqueadas.</>
                                )}
                            </p>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsCartDialogOpen(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAddToCart}
                            disabled={eligibleForCart === 0 || isLoading}
                            className="gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ShoppingCart className="h-4 w-4" />
                            )}
                            Adicionar {eligibleForCart > 0 && `(${eligibleForCart})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default BulkActionBar;
