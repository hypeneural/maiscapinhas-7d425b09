/**
 * Currency Input Component
 * 
 * Masked input for Brazilian Real currency values.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps {
    value: number | null | undefined;
    onChange: (value: number | null) => void;
    id?: string;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

/**
 * Format a number to BRL currency display
 */
export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

/**
 * Format a number for display in the input (without R$ prefix)
 */
function formatInputValue(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) return '';
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/**
 * Parse user input to number
 */
function parseInputValue(input: string): number | null {
    if (!input.trim()) return null;
    // Remove everything except numbers
    const numericOnly = input.replace(/[^\d]/g, '');
    if (!numericOnly) return null;
    // Convert to decimal (last 2 digits are cents)
    const cents = parseInt(numericOnly, 10);
    return cents / 100;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
    value,
    onChange,
    id,
    placeholder = 'R$ 0,00',
    className,
    disabled,
}) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Sync display value with external value changes
    useEffect(() => {
        if (!isFocused && value !== undefined) {
            setDisplayValue(formatInputValue(value));
        }
    }, [value, isFocused]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const parsed = parseInputValue(input);
        setDisplayValue(formatInputValue(parsed));
        onChange(parsed);
    }, [onChange]);

    const handleFocus = useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        setDisplayValue(formatInputValue(value));
    }, [value]);

    return (
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                R$
            </span>
            <Input
                id={id}
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder.replace('R$ ', '')}
                className={cn('pl-10', className)}
                disabled={disabled}
            />
        </div>
    );
};

export default CurrencyInput;
