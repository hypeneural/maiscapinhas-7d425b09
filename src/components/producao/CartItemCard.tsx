/**
 * Cart Item Card
 * 
 * Card component for displaying items in the production cart.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Trash2, User, Package, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { ProducaoPedidoItem } from '@/types/producao.types';

interface CartItemCardProps {
    item: ProducaoPedidoItem;
    onRemove?: (itemId: number) => void;
    isRemoving?: boolean;
    showRemove?: boolean;
    className?: string;
}

export function CartItemCard({
    item,
    onRemove,
    isRemoving = false,
    showRemove = true,
    className,
}: CartItemCardProps) {
    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardContent className="p-4">
                <div className="flex gap-4">
                    {/* Photo thumbnail */}
                    <div className="flex-shrink-0">
                        {item.photo_url ? (
                            <img
                                src={item.photo_url}
                                alt="Foto da capa"
                                className="h-20 w-20 rounded-lg object-cover border"
                            />
                        ) : (
                            <div className="h-20 w-20 rounded-lg border bg-muted flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                        {/* Product info */}
                        <div>
                            <h4 className="font-medium text-sm truncate">
                                {item.selected_product || 'Capa Personalizada'}
                            </h4>
                            {(item.phone_brand || item.phone_model) && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Package className="h-3 w-3" />
                                    {[item.phone_brand, item.phone_model].filter(Boolean).join(' ')}
                                </p>
                            )}
                        </div>

                        {/* Customer */}
                        {item.customer && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {item.customer.name}
                            </p>
                        )}

                        {/* Quantity and observation */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="font-medium">
                                Qtd: {item.qty}
                            </span>
                            {item.observation && (
                                <span className="text-muted-foreground italic truncate">
                                    Obs: {item.observation}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Remove button */}
                    {showRemove && onRemove && (
                        <div className="flex-shrink-0">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive"
                                        disabled={isRemoving}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Remover item do carrinho?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação irá remover o item do carrinho de produção.
                                            A capa voltará ao status anterior.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => onRemove(item.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Remover
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default CartItemCard;
