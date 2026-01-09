/**
 * TierBuilder Component
 * 
 * A component for building tiered rules (bonus, commission, etc).
 * Allows adding, editing, and removing tiers with custom fields.
 */

import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

export interface TierField {
    /** Field key */
    key: string;
    /** Display label */
    label: string;
    /** Input type */
    type?: 'number' | 'text';
    /** Placeholder text */
    placeholder?: string;
    /** Prefix (e.g., "R$") */
    prefix?: string;
    /** Suffix (e.g., "%") */
    suffix?: string;
    /** Minimum value */
    min?: number;
    /** Maximum value */
    max?: number;
    /** Step for number inputs */
    step?: number;
}

export interface TierBuilderProps<T extends Record<string, unknown>> {
    /** Current tiers */
    value: T[];
    /** Callback when tiers change */
    onChange: (tiers: T[]) => void;
    /** Field definitions */
    fields: TierField[];
    /** Label for add button */
    addLabel?: string;
    /** Empty state message */
    emptyMessage?: string;
    /** Whether to auto-sort by first numeric field */
    autoSort?: boolean;
    /** Maximum number of tiers */
    maxTiers?: number;
    /** Custom class name */
    className?: string;
    /** Default values for new tier */
    defaultTier?: Partial<T>;
}

// ============================================================
// Component
// ============================================================

export function TierBuilder<T extends Record<string, unknown>>({
    value,
    onChange,
    fields,
    addLabel = 'Adicionar Faixa',
    emptyMessage = 'Nenhuma faixa configurada',
    autoSort = true,
    maxTiers,
    className,
    defaultTier,
}: TierBuilderProps<T>) {
    // Add new tier
    const handleAdd = () => {
        const newTier = {
            ...Object.fromEntries(fields.map((f) => [f.key, f.type === 'number' ? 0 : ''])),
            ...defaultTier,
        } as T;
        onChange([...value, newTier]);
    };

    // Update a tier field
    const handleFieldChange = (index: number, key: string, fieldValue: unknown) => {
        const newTiers = [...value];
        newTiers[index] = { ...newTiers[index], [key]: fieldValue };

        // Auto-sort by first numeric field if enabled
        if (autoSort) {
            const firstNumericField = fields.find((f) => f.type === 'number');
            if (firstNumericField) {
                newTiers.sort((a, b) => {
                    const aVal = Number(a[firstNumericField.key]) || 0;
                    const bVal = Number(b[firstNumericField.key]) || 0;
                    return aVal - bVal;
                });
            }
        }

        onChange(newTiers);
    };

    // Remove a tier
    const handleRemove = (index: number) => {
        const newTiers = value.filter((_, i) => i !== index);
        onChange(newTiers);
    };

    const canAdd = !maxTiers || value.length < maxTiers;

    return (
        <div className={cn('space-y-4', className)}>
            {/* Tier list */}
            {value.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    {emptyMessage}
                </div>
            ) : (
                <div className="space-y-3">
                    {value.map((tier, index) => (
                        <Card key={index} className="relative group">
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-start gap-3">
                                    {/* Drag handle (visual only for now) */}
                                    <div className="pt-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                        <GripVertical className="h-4 w-4" />
                                    </div>

                                    {/* Fields */}
                                    <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {fields.map((field) => (
                                            <div key={field.key} className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">
                                                    {field.label}
                                                </Label>
                                                <div className="relative">
                                                    {field.prefix && (
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                            {field.prefix}
                                                        </span>
                                                    )}
                                                    <Input
                                                        type={field.type || 'text'}
                                                        value={String(tier[field.key] ?? '')}
                                                        onChange={(e) =>
                                                            handleFieldChange(
                                                                index,
                                                                field.key,
                                                                field.type === 'number'
                                                                    ? parseFloat(e.target.value) || 0
                                                                    : e.target.value
                                                            )
                                                        }
                                                        placeholder={field.placeholder}
                                                        min={field.min}
                                                        max={field.max}
                                                        step={field.step}
                                                        className={cn(
                                                            field.prefix && 'pl-8',
                                                            field.suffix && 'pr-8'
                                                        )}
                                                    />
                                                    {field.suffix && (
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                            {field.suffix}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Remove button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                        onClick={() => handleRemove(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add button */}
            {canAdd && (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={handleAdd}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {addLabel}
                </Button>
            )}
        </div>
    );
}

export default TierBuilder;
