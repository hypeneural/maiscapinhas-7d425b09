/**
 * ModuleTextsDialog Component
 * 
 * Dialog for editing module display texts (labels, titles, etc).
 * Allows customizing how the module appears in the UI.
 */

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Loader2,
    Save,
    RefreshCw,
    Type,
    HelpCircle,
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useModuleTexts, useUpdateModuleTexts } from '@/hooks/api/use-modules';

interface ModuleTextsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    moduleId: string;
    moduleName: string;
}

// Text field display names in Portuguese
const TEXT_LABELS: Record<string, { label: string; description: string }> = {
    menu_label: { label: 'Label do Menu', description: 'Texto exibido no menu lateral' },
    menu_tooltip: { label: 'Tooltip do Menu', description: 'Texto ao passar o mouse no menu' },
    page_title: { label: 'Título da Página', description: 'Título principal da página' },
    page_description: { label: 'Descrição da Página', description: 'Subtítulo abaixo do título' },
    create_button: { label: 'Botão Criar', description: 'Texto do botão de criar novo registro' },
    empty_state: { label: 'Estado Vazio', description: 'Mensagem quando não há registros' },
    loading_title: { label: 'Título Loading', description: 'Título durante carregamento' },
    loading_description: { label: 'Descrição Loading', description: 'Descrição durante carregamento' },
    error_title: { label: 'Título de Erro', description: 'Título quando ocorre erro' },
    error_description: { label: 'Descrição de Erro', description: 'Descrição quando ocorre erro' },
};

export const ModuleTextsDialog: React.FC<ModuleTextsDialogProps> = ({
    open,
    onOpenChange,
    moduleId,
    moduleName,
}) => {
    const { data, isLoading } = useModuleTexts(moduleId);
    const updateMutation = useUpdateModuleTexts();

    const [localTexts, setLocalTexts] = useState<Record<string, string>>({});
    const [hasChanges, setHasChanges] = useState(false);

    // Sync local texts with server
    useEffect(() => {
        if (data?.texts) {
            // Merge defaults with custom texts
            const merged = { ...data.defaults, ...data.texts };
            setLocalTexts(merged);
            setHasChanges(false);
        }
    }, [data]);

    // Handle text change
    const handleTextChange = (key: string, value: string) => {
        setLocalTexts((prev) => ({
            ...prev,
            [key]: value,
        }));
        setHasChanges(true);
    };

    // Handle save
    const handleSave = async () => {
        await updateMutation.mutateAsync({
            moduleId,
            texts: localTexts,
        });
        setHasChanges(false);
    };

    // Handle restore defaults
    const handleRestore = () => {
        if (data?.defaults) {
            setLocalTexts({ ...data.defaults });
            setHasChanges(true);
        }
    };

    // Get the list of text fields to show
    // Priority: schema keys > localTexts keys > DEFAULT_FIELDS
    const DEFAULT_FIELDS = Object.keys(TEXT_LABELS);
    const textFields = data?.schema && Object.keys(data.schema).length > 0
        ? Object.keys(data.schema)
        : Object.keys(localTexts).length > 0
            ? Object.keys(localTexts)
            : DEFAULT_FIELDS;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5" />
                        Editar Textos
                    </DialogTitle>
                    <DialogDescription>
                        Personalize como o módulo "{moduleName}" aparece na interface
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {isLoading ? (
                        // Loading state
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-9 w-full" />
                            </div>
                        ))
                    ) : textFields.length === 0 ? (
                        // Empty state
                        <div className="text-center py-8 text-muted-foreground">
                            <Type className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>Nenhum texto configurável disponível</p>
                        </div>
                    ) : (
                        // Text fields
                        textFields.map((key) => {
                            const fieldInfo = TEXT_LABELS[key] || { label: key, description: '' };
                            const schema = data?.schema?.[key];
                            const maxLength = schema?.max || 255;

                            return (
                                <div key={key} className="space-y-1.5">
                                    <Label
                                        htmlFor={key}
                                        className="flex items-center gap-2"
                                    >
                                        {fieldInfo.label}
                                        {fieldInfo.description && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger type="button">
                                                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {fieldInfo.description}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </Label>
                                    <Input
                                        id={key}
                                        value={localTexts[key] || ''}
                                        onChange={(e) => handleTextChange(key, e.target.value)}
                                        maxLength={maxLength}
                                        placeholder={data?.defaults?.[key] || ''}
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>
                                            {data?.defaults?.[key] && localTexts[key] !== data.defaults[key] && (
                                                <span className="text-amber-600">Personalizado</span>
                                            )}
                                        </span>
                                        <span>{(localTexts[key] || '').length}/{maxLength}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleRestore}
                        disabled={updateMutation.isPending || isLoading}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Restaurar Padrões
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || updateMutation.isPending}
                    >
                        {updateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ModuleTextsDialog;
