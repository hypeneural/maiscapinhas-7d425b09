/**
 * Glossary Tooltip Component
 * 
 * Reusable tooltip that shows glossary text for a field.
 */

import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PRIZE_RULES_GLOSSARY, type GlossaryKey } from '@/lib/config/prize-rules-glossary';

interface GlossaryTooltipProps {
    /** The glossary key to look up */
    term: GlossaryKey;
    /** Optional custom size */
    size?: 'sm' | 'md';
    /** Optional additional class */
    className?: string;
}

export function GlossaryTooltip({ term, size = 'sm', className = '' }: GlossaryTooltipProps) {
    const text = PRIZE_RULES_GLOSSARY[term];

    if (!text) return null;

    const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

    return (
        <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    className={`inline-flex items-center text-muted-foreground hover:text-foreground transition-colors ${className}`}
                    onClick={(e) => e.preventDefault()}
                >
                    <Info className={iconSize} />
                </button>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className="max-w-xs text-sm font-normal"
                sideOffset={5}
            >
                {text}
            </TooltipContent>
        </Tooltip>
    );
}

interface LabelWithTooltipProps {
    /** Label text */
    label: string;
    /** The glossary key */
    term: GlossaryKey;
    /** If true, label is required field */
    required?: boolean;
    /** HTML for attribute */
    htmlFor?: string;
}

export function LabelWithTooltip({ label, term, required, htmlFor }: LabelWithTooltipProps) {
    return (
        <div className="flex items-center gap-1.5">
            <label htmlFor={htmlFor} className="text-sm font-medium">
                {label}
                {required && <span className="text-destructive ml-0.5">*</span>}
            </label>
            <GlossaryTooltip term={term} />
        </div>
    );
}
