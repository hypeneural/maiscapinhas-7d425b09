/**
 * Add to Cart Button
 * 
 * Button for adding selected capas to the production cart.
 */

import React from 'react';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAddToCart } from '@/hooks/api/use-producao';

interface AddToCartButtonProps {
    selectedIds: number[];
    onSuccess?: () => void;
    disabled?: boolean;
    className?: string;
}

export function AddToCartButton({
    selectedIds,
    onSuccess,
    disabled = false,
    className,
}: AddToCartButtonProps) {
    const addToCart = useAddToCart();

    const handleClick = async () => {
        if (selectedIds.length === 0) return;

        try {
            await addToCart.mutateAsync(selectedIds);
            onSuccess?.();
        } catch {
            // Error handling is done in the hook
        }
    };

    const isDisabled = disabled || selectedIds.length === 0 || addToCart.isPending;

    return (
        <Button
            onClick={handleClick}
            disabled={isDisabled}
            className={className}
        >
            {addToCart.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
            )}
            Adicionar ao Carrinho ({selectedIds.length})
        </Button>
    );
}

export default AddToCartButton;
