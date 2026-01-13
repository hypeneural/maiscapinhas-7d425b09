/**
 * Customer Select Component
 * 
 * Searchable dropdown for selecting a customer with option to create new.
 * Uses combobox pattern with debounced search.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Check, ChevronsUpDown, Plus, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useCustomers } from '@/hooks/api/use-customers';
import type { Customer } from '@/types/customers.types';

interface CustomerSelectProps {
    value: number | null;
    onChange: (customerId: number | null, customer?: Customer) => void;
    onCreateNew?: () => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function CustomerSelect({
    value,
    onChange,
    onCreateNew,
    placeholder = 'Selecionar cliente...',
    disabled = false,
    className,
}: CustomerSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    // Debounced search query
    const debouncedSearch = useDebounce(search, 300);

    // Fetch customers with search
    const { data: customersData, isLoading } = useCustomers({
        name: debouncedSearch || undefined,
        per_page: 20,
    });

    const customers = customersData?.data || [];

    // Find selected customer
    const selectedCustomer = useMemo(() => {
        if (!value) return null;
        return customers.find((c) => c.id === value) || null;
    }, [value, customers]);

    const handleSelect = useCallback(
        (customerId: string) => {
            const id = parseInt(customerId, 10);
            const customer = customers.find((c) => c.id === id);
            onChange(id, customer);
            setOpen(false);
            setSearch('');
        },
        [customers, onChange]
    );

    const handleClear = useCallback(() => {
        onChange(null);
        setSearch('');
    }, [onChange]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        'w-full justify-between font-normal',
                        !value && 'text-muted-foreground',
                        className
                    )}
                >
                    <div className="flex items-center gap-2 truncate">
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {selectedCustomer ? (
                            <span className="truncate">
                                {selectedCustomer.name}
                                {selectedCustomer.email && (
                                    <span className="text-muted-foreground ml-1">
                                        ({selectedCustomer.email})
                                    </span>
                                )}
                            </span>
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Buscar cliente por nome..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                <CommandEmpty>
                                    <div className="py-6 text-center text-sm">
                                        Nenhum cliente encontrado.
                                    </div>
                                </CommandEmpty>
                                <CommandGroup>
                                    {customers.map((customer) => (
                                        <CommandItem
                                            key={customer.id}
                                            value={customer.id.toString()}
                                            onSelect={handleSelect}
                                        >
                                            <Check
                                                className={cn(
                                                    'mr-2 h-4 w-4',
                                                    value === customer.id ? 'opacity-100' : 'opacity-0'
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span>{customer.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {customer.email}
                                                    {customer.phone && ` • ${customer.phone}`}
                                                </span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}

                        {/* Create new option */}
                        {onCreateNew && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={() => {
                                            setOpen(false);
                                            onCreateNew();
                                        }}
                                        className="text-primary"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Criar novo cliente
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}

                        {/* Clear selection */}
                        {value && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={handleClear}
                                        className="text-muted-foreground"
                                    >
                                        Limpar seleção
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

/**
 * Simple debounce hook
 */
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default CustomerSelect;
