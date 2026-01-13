/**
 * Production Cart Page
 * 
 * Admin page to manage the production cart and send orders to factory.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Send, X, ArrowLeft, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
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
import { CartItemCard, CartSummary, CapasNavTabs } from '@/components/producao';
import {
    useCarrinho,
    useRemoveFromCart,
    useCloseCart,
    useCancelCart,
} from '@/hooks/api/use-producao';

export function ProducaoCarrinho() {
    const navigate = useNavigate();
    const [observation, setObservation] = useState('');

    const { data: carrinho, isLoading, error } = useCarrinho();
    const removeFromCart = useRemoveFromCart();
    const closeCart = useCloseCart();
    const cancelCart = useCancelCart();

    const handleRemoveItem = async (itemId: number) => {
        await removeFromCart.mutateAsync(itemId);
    };

    const handleCloseCart = async () => {
        const result = await closeCart.mutateAsync({ observation });
        navigate(`/capas/pedidos/${result.id}`);
    };

    const handleCancelCart = async () => {
        await cancelCart.mutateAsync();
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">Erro ao carregar carrinho</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Tentar novamente
                </Button>
            </div>
        );
    }

    // Empty cart state
    const isEmpty = !carrinho?.items || carrinho.items.length === 0;

    if (isEmpty) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Capas Personalizadas"
                    icon={ShoppingCart}
                />
                <CapasNavTabs />
                <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-center">
                    <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                    <div className="space-y-2">
                        <h3 className="text-lg font-medium">Carrinho vazio</h3>
                        <p className="text-muted-foreground max-w-md">
                            Adicione capas personalizadas ao carrinho para enviar à fábrica.
                            Apenas capas com status "Encomenda Solicitada" e foto podem ser adicionadas.
                        </p>
                    </div>
                    <Button asChild>
                        <Link to="/capas">
                            <Package className="h-4 w-4 mr-2" />
                            Ver Lista de Capas
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Capas Personalizadas"
                icon={ShoppingCart}
            />
            <CapasNavTabs />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Items List */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        Itens no Carrinho ({carrinho.items?.length || 0})
                    </h3>
                    <div className="space-y-3">
                        {carrinho.items?.map((item) => (
                            <CartItemCard
                                key={item.id}
                                item={item}
                                onRemove={handleRemoveItem}
                                isRemoving={removeFromCart.isPending}
                            />
                        ))}
                    </div>
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                    <CartSummary
                        totalItens={carrinho.total_itens}
                        totalQtd={carrinho.total_qtd}
                        observation={observation}
                        onObservationChange={setObservation}
                    >
                        {/* Close Cart Button */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    className="w-full"
                                    disabled={closeCart.isPending}
                                >
                                    {closeCart.isPending ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4 mr-2" />
                                    )}
                                    Fechar e Enviar
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Enviar para a fábrica?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação irá criar um pedido de produção com {carrinho.total_itens} item(ns)
                                        ({carrinho.total_qtd} capas) e enviar para a fábrica.
                                        Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleCloseCart}>
                                        Confirmar Envio
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* Cancel Cart Button */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    disabled={cancelCart.isPending}
                                >
                                    {cancelCart.isPending ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <X className="h-4 w-4 mr-2" />
                                    )}
                                    Cancelar Carrinho
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Cancelar carrinho?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação irá remover todos os itens do carrinho.
                                        As capas voltarão ao status "Encomenda Solicitada".
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleCancelCart}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Cancelar Carrinho
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CartSummary>
                </div>
            </div>
        </div>
    );
}

export default ProducaoCarrinho;
