/**
 * Opening Hours Editor
 * 
 * Component for editing weekly store opening hours.
 * Supports multiple time slots per day and timezone selection.
 */

import React from 'react';
import { Clock, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OpeningHours, TimeSlot, WeeklySchedule } from '@/types/admin.types';

// ============================================================
// Constants
// ============================================================

const DAYS: { key: keyof WeeklySchedule; label: string; short: string }[] = [
    { key: 'mon', label: 'Segunda-feira', short: 'Seg' },
    { key: 'tue', label: 'Terça-feira', short: 'Ter' },
    { key: 'wed', label: 'Quarta-feira', short: 'Qua' },
    { key: 'thu', label: 'Quinta-feira', short: 'Qui' },
    { key: 'fri', label: 'Sexta-feira', short: 'Sex' },
    { key: 'sat', label: 'Sábado', short: 'Sáb' },
    { key: 'sun', label: 'Domingo', short: 'Dom' },
];

const TIMEZONES = [
    { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
    { value: 'America/Manaus', label: 'Manaus (AMT)' },
    { value: 'America/Cuiaba', label: 'Cuiabá (AMT)' },
    { value: 'America/Fortaleza', label: 'Fortaleza (BRT)' },
    { value: 'America/Recife', label: 'Recife (BRT)' },
    { value: 'America/Belem', label: 'Belém (BRT)' },
];

const DEFAULT_SLOT: TimeSlot = { start: '09:00', end: '18:00' };

const EMPTY_WEEKLY: WeeklySchedule = {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
};

// ============================================================
// Props
// ============================================================

interface OpeningHoursEditorProps {
    value: OpeningHours | null;
    onChange: (hours: OpeningHours) => void;
}

// ============================================================
// Component
// ============================================================

export function OpeningHoursEditor({ value, onChange }: OpeningHoursEditorProps) {
    // Initialize with defaults if null
    const hours: OpeningHours = value || {
        tz: 'America/Sao_Paulo',
        weekly: EMPTY_WEEKLY,
    };

    const handleTimezoneChange = (tz: string) => {
        onChange({ ...hours, tz });
    };

    const handleDayChange = (dayKey: keyof WeeklySchedule, slots: TimeSlot[]) => {
        onChange({
            ...hours,
            weekly: {
                ...hours.weekly,
                [dayKey]: slots,
            },
        });
    };

    const handleToggleDay = (dayKey: keyof WeeklySchedule) => {
        const currentSlots = hours.weekly[dayKey] || [];
        if (currentSlots.length === 0) {
            // Open with default hours
            handleDayChange(dayKey, [{ ...DEFAULT_SLOT }]);
        } else {
            // Close
            handleDayChange(dayKey, []);
        }
    };

    const handleSlotChange = (
        dayKey: keyof WeeklySchedule,
        index: number,
        field: 'start' | 'end',
        value: string
    ) => {
        const slots = [...(hours.weekly[dayKey] || [])];
        slots[index] = { ...slots[index], [field]: value };
        handleDayChange(dayKey, slots);
    };

    const handleAddSlot = (dayKey: keyof WeeklySchedule) => {
        const slots = hours.weekly[dayKey] || [];
        handleDayChange(dayKey, [...slots, { start: '14:00', end: '18:00' }]);
    };

    const handleRemoveSlot = (dayKey: keyof WeeklySchedule, index: number) => {
        const slots = hours.weekly[dayKey] || [];
        handleDayChange(dayKey, slots.filter((_, i) => i !== index));
    };

    const handleCopyToAll = (dayKey: keyof WeeklySchedule) => {
        const slots = hours.weekly[dayKey] || [];
        if (slots.length === 0) return;

        const newWeekly = { ...hours.weekly };
        DAYS.forEach(({ key }) => {
            if (key !== dayKey) {
                newWeekly[key] = slots.map(s => ({ ...s }));
            }
        });
        onChange({ ...hours, weekly: newWeekly });
    };

    const getOpenDaysCount = () => {
        return DAYS.filter(({ key }) => (hours.weekly[key] || []).length > 0).length;
    };

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Horários de Funcionamento
                        </CardTitle>
                        <CardDescription>
                            {getOpenDaysCount()} dias com horário definido
                        </CardDescription>
                    </div>
                    <Select value={hours.tz} onValueChange={handleTimezoneChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Timezone" />
                        </SelectTrigger>
                        <SelectContent>
                            {TIMEZONES.map(tz => (
                                <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {DAYS.map(({ key, label, short }) => {
                    const slots = hours.weekly[key] || [];
                    const isOpen = slots.length > 0;

                    return (
                        <div
                            key={key}
                            className={cn(
                                'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                                isOpen ? 'bg-card' : 'bg-muted/50'
                            )}
                        >
                            {/* Day label + toggle */}
                            <div className="w-28 flex items-center gap-2 pt-1">
                                <Switch
                                    checked={isOpen}
                                    onCheckedChange={() => handleToggleDay(key)}
                                />
                                <span className={cn(
                                    'text-sm font-medium',
                                    isOpen ? '' : 'text-muted-foreground'
                                )}>
                                    {short}
                                </span>
                            </div>

                            {/* Time slots or Closed label */}
                            <div className="flex-1">
                                {isOpen ? (
                                    <div className="space-y-2">
                                        {slots.map((slot, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <Input
                                                    type="time"
                                                    value={slot.start}
                                                    onChange={(e) => handleSlotChange(key, idx, 'start', e.target.value)}
                                                    className="w-[120px]"
                                                />
                                                <span className="text-muted-foreground">às</span>
                                                <Input
                                                    type="time"
                                                    value={slot.end}
                                                    onChange={(e) => handleSlotChange(key, idx, 'end', e.target.value)}
                                                    className="w-[120px]"
                                                />
                                                {slots.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleRemoveSlot(key, idx)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => handleAddSlot(key)}
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Adicionar intervalo
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs text-muted-foreground"
                                                onClick={() => handleCopyToAll(key)}
                                            >
                                                Copiar para todos
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Badge variant="secondary" className="mt-1">
                                        Fechado
                                    </Badge>
                                )}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

export default OpeningHoursEditor;
