/**
 * RichTextEditor
 * 
 * Simple rich text editor using contenteditable with basic formatting buttons.
 * Outputs HTML content.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Link2,
    RemoveFormatting,
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

interface ToolbarButton {
    icon: React.ElementType;
    command: string;
    label: string;
    value?: string;
}

const toolbarButtons: ToolbarButton[] = [
    { icon: Bold, command: 'bold', label: 'Negrito (Ctrl+B)' },
    { icon: Italic, command: 'italic', label: 'Itálico (Ctrl+I)' },
    { icon: Underline, command: 'underline', label: 'Sublinhado (Ctrl+U)' },
    { icon: List, command: 'insertUnorderedList', label: 'Lista com marcadores' },
    { icon: ListOrdered, command: 'insertOrderedList', label: 'Lista numerada' },
    { icon: RemoveFormatting, command: 'removeFormat', label: 'Remover formatação' },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = 'Digite aqui...',
    className,
    minHeight = '200px',
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const isInternalChange = useRef(false);

    // Sync value to editor
    useEffect(() => {
        if (editorRef.current && !isInternalChange.current) {
            if (editorRef.current.innerHTML !== value) {
                editorRef.current.innerHTML = value;
            }
        }
        isInternalChange.current = false;
    }, [value]);

    const execCommand = useCallback((command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput();
    }, []);

    const handleInput = useCallback(() => {
        if (editorRef.current) {
            isInternalChange.current = true;
            onChange(editorRef.current.innerHTML);
        }
    }, [onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        // Keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    execCommand('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    execCommand('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    execCommand('underline');
                    break;
            }
        }
    }, [execCommand]);

    const insertLink = useCallback(() => {
        const url = prompt('Digite a URL do link:');
        if (url) {
            execCommand('createLink', url);
        }
    }, [execCommand]);

    return (
        <div className={cn('border rounded-lg overflow-hidden', className)}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 bg-muted/50 border-b flex-wrap">
                {toolbarButtons.map((btn) => (
                    <Tooltip key={btn.command}>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => execCommand(btn.command, btn.value)}
                            >
                                <btn.icon className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{btn.label}</TooltipContent>
                    </Tooltip>
                ))}

                <div className="w-px h-6 bg-border mx-1" />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={insertLink}
                        >
                            <Link2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Inserir link</TooltipContent>
                </Tooltip>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                className={cn(
                    'p-4 focus:outline-none prose prose-sm dark:prose-invert max-w-none',
                    'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none'
                )}
                style={{ minHeight }}
                data-placeholder={placeholder}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onBlur={handleInput}
            />
        </div>
    );
};
