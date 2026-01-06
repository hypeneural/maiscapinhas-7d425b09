import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  placeholder = 'R$ 0,00',
  disabled = false,
  className,
  error = false,
}) => {
  const [focused, setFocused] = useState(false);

  const formatCurrency = (val: number): string => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo que não é número
    const rawValue = e.target.value.replace(/\D/g, '');
    const numericValue = parseInt(rawValue, 10) / 100 || 0;
    onChange(numericValue);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={focused ? formatCurrency(value) : value ? formatCurrency(value) : ''}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'font-mono text-right text-lg pr-4',
          error && 'border-destructive focus-visible:ring-destructive',
          disabled && 'bg-muted cursor-not-allowed',
          className
        )}
      />
    </div>
  );
};
