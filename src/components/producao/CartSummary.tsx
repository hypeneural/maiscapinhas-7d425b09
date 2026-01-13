/**
 * Cart Summary Component
 * 
 * Summary display for production cart with totals and actions.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Package, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CartSummaryProps {
    totalItens: number;
    totalQtd: number;
    observation?: string;
    onObservationChange?: (value: string) => void;
    children?: React.ReactNode;
    className?: string;
}

export function CartSummary({
    totalItens,
    totalQtd,
    observation = '',
    onObservationChange,
    children,
    className,
}: CartSummaryProps) {
    return (
        <Card className={cn('sticky top-4', className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <ShoppingCart className="h-5 w-5" />
                    Resumo do Carrinho
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border bg-muted/50 p-3 text-center">
                        <p className="text-2xl font-bold">{totalItens}</p>
                        <p className="text-xs text-muted-foreground">
                            {totalItens === 1 ? 'Item' : 'Itens'}
                        </p>
                    </div>
                    <div className="rounded-lg border bg-muted/50 p-3 text-center">
                        <p className="text-2xl font-bold">{totalQtd}</p>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Package className="h-3 w-3" />
                            {totalQtd === 1 ? 'Capa' : 'Capas'}
                        </p>
                    </div>
                </div>

                {/* Observation */}
                {onObservationChange && (
                    <div className="space-y-2">
                        <Label htmlFor="observation">Observação para a fábrica</Label>
                        <Textarea
                            id="observation"
                            placeholder="Instruções especiais, prazo, etc..."
                            value={observation}
                            onChange={(e) => onObservationChange(e.target.value)}
                            maxLength={2000}
                            rows={3}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {observation.length}/2000
                        </p>
                    </div>
                )}
            </CardContent>
            {children && (
                <CardFooter className="flex flex-col gap-2">
                    {children}
                </CardFooter>
            )}
        </Card>
    );
}

export default CartSummary;
