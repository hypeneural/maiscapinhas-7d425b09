/**
 * MonthPicker Component
 * 
 * A date picker that only allows selecting months (YYYY-MM format).
 * Used in management pages for filtering data by period.
 */

import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface MonthPickerProps {
    value: string;           // Format: YYYY-MM
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril',
    'Maio', 'Junho', 'Julho', 'Agosto',
    'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const SHORT_MONTHS = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const MonthPicker: React.FC<MonthPickerProps> = ({
    value,
    onChange,
    className,
    placeholder = 'Selecionar mês'
}) => {
    const [isOpen, setIsOpen] = React.useState(false);

    // Parse current value or use current date
    const [year, month] = value
        ? value.split('-').map(Number)
        : [new Date().getFullYear(), new Date().getMonth() + 1];

    const [displayYear, setDisplayYear] = React.useState(year);

    // Format for display
    const displayText = value
        ? `${SHORT_MONTHS[month - 1]} ${year}`
        : placeholder;

    const handleMonthSelect = (monthIndex: number) => {
        const newMonth = String(monthIndex + 1).padStart(2, '0');
        onChange(`${displayYear}-${newMonth}`);
        setIsOpen(false);
    };

    const handlePrevYear = () => setDisplayYear(prev => prev - 1);
    const handleNextYear = () => setDisplayYear(prev => prev + 1);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'w-[160px] justify-start text-left font-normal',
                        !value && 'text-muted-foreground',
                        className
                    )}
                >
                    <Calendar className="mr-2 h-4 w-4" />
                    {displayText}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-3" align="start">
                {/* Year navigation */}
                <div className="flex items-center justify-between mb-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handlePrevYear}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold text-sm">{displayYear}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleNextYear}
                        disabled={displayYear >= new Date().getFullYear()}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Month grid */}
                <div className="grid grid-cols-3 gap-2">
                    {MONTHS.map((monthName, index) => {
                        const isCurrentSelection =
                            displayYear === year && index + 1 === month;
                        const isFuture =
                            displayYear === new Date().getFullYear() &&
                            index > new Date().getMonth();

                        return (
                            <Button
                                key={monthName}
                                variant={isCurrentSelection ? 'default' : 'ghost'}
                                size="sm"
                                className={cn(
                                    'h-8 text-xs',
                                    isCurrentSelection && 'bg-primary text-primary-foreground'
                                )}
                                disabled={isFuture}
                                onClick={() => handleMonthSelect(index)}
                            >
                                {SHORT_MONTHS[index]}
                            </Button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default MonthPicker;
