/**
 * FilterPanel Component
 * 
 * Advanced filters sidebar/dropdown for list pages.
 * Supports date ranges, status filters, and other common filter patterns.
 */

import React, { useState } from 'react';
import {
    Filter,
    X,
    Calendar,
    Store,
    User,
    Tag,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

export interface FilterOption {
    value: string | number;
    label: string;
}

export interface FilterConfig {
    id: string;
    label: string;
    type: 'select' | 'date' | 'date-range' | 'text';
    options?: FilterOption[];
    icon?: React.ReactNode;
    placeholder?: string;
}

export interface FilterValues {
    [key: string]: string | number | null | undefined;
}

export interface FilterPanelProps {
    filters: FilterConfig[];
    values: FilterValues;
    onChange: (values: FilterValues) => void;
    onClear?: () => void;
    variant?: 'dropdown' | 'sheet';
    className?: string;
}

// ============================================================
// Component
// ============================================================

export const FilterPanel: React.FC<FilterPanelProps> = ({
    filters,
    values,
    onChange,
    onClear,
    variant = 'dropdown',
    className,
}) => {
    const [open, setOpen] = useState(false);
    const [localValues, setLocalValues] = useState<FilterValues>(values);

    // Count active filters
    const activeCount = Object.values(values).filter(
        (v) => v !== null && v !== undefined && v !== ''
    ).length;

    // Update local values when external values change
    React.useEffect(() => {
        setLocalValues(values);
    }, [values]);

    const handleChange = (id: string, value: string | number | null) => {
        const newValues = { ...localValues, [id]: value };
        setLocalValues(newValues);

        // For dropdown variant, apply immediately
        if (variant === 'dropdown') {
            onChange(newValues);
        }
    };

    const handleApply = () => {
        onChange(localValues);
        setOpen(false);
    };

    const handleClear = () => {
        const clearedValues: FilterValues = {};
        filters.forEach((f) => {
            clearedValues[f.id] = null;
        });
        setLocalValues(clearedValues);
        onChange(clearedValues);
        onClear?.();
    };

    const renderFilter = (filter: FilterConfig) => {
        const value = localValues[filter.id];

        switch (filter.type) {
            case 'select':
                return (
                    <div key={filter.id} className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            {filter.icon}
                            {filter.label}
                        </Label>
                        <Select
                            value={value?.toString() || ''}
                            onValueChange={(v) =>
                                handleChange(filter.id, v === 'all' ? null : v)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={filter.placeholder || 'Selecionar'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {filter.options?.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value.toString()}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );

            case 'date':
                return (
                    <div key={filter.id} className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {filter.label}
                        </Label>
                        <Input
                            type="date"
                            value={(value as string) || ''}
                            onChange={(e) => handleChange(filter.id, e.target.value || null)}
                        />
                    </div>
                );

            case 'date-range':
                return (
                    <div key={filter.id} className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {filter.label}
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                type="date"
                                placeholder="De"
                                value={(localValues[`${filter.id}_from`] as string) || ''}
                                onChange={(e) =>
                                    handleChange(`${filter.id}_from`, e.target.value || null)
                                }
                            />
                            <Input
                                type="date"
                                placeholder="Até"
                                value={(localValues[`${filter.id}_to`] as string) || ''}
                                onChange={(e) =>
                                    handleChange(`${filter.id}_to`, e.target.value || null)
                                }
                            />
                        </div>
                    </div>
                );

            case 'text':
                return (
                    <div key={filter.id} className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            {filter.icon}
                            {filter.label}
                        </Label>
                        <Input
                            type="text"
                            placeholder={filter.placeholder}
                            value={(value as string) || ''}
                            onChange={(e) => handleChange(filter.id, e.target.value || null)}
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    const filterContent = (
        <div className="space-y-4">
            {filters.map(renderFilter)}
            <Separator />
            <div className="flex justify-between gap-2">
                <Button variant="ghost" size="sm" onClick={handleClear} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Limpar
                </Button>
                {variant === 'sheet' && (
                    <Button size="sm" onClick={handleApply}>
                        Aplicar Filtros
                    </Button>
                )}
            </div>
        </div>
    );

    const triggerButton = (
        <Button variant="outline" className={cn('gap-2', className)}>
            <Filter className="h-4 w-4" />
            Filtros
            {activeCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                    {activeCount}
                </Badge>
            )}
        </Button>
    );

    if (variant === 'sheet') {
        return (
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>{triggerButton}</SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtros Avançados
                        </SheetTitle>
                        <SheetDescription>
                            Configure os filtros para refinar sua busca
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-6">{filterContent}</div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filtros
                    </h4>
                    {activeCount > 0 && (
                        <Badge variant="secondary">{activeCount} ativos</Badge>
                    )}
                </div>
                {filterContent}
            </PopoverContent>
        </Popover>
    );
};

export default FilterPanel;
