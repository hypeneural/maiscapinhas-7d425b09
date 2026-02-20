import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserPlus, Check, Sparkles, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserSuggestion, UserMappingPayload, BulkUserMappingPayload } from '@/types/pdv-mapping.types';
import { UserMappingModal } from './UserMappingModal';
import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPdvUserMapping, bulkCreatePdvUserMappings } from '@/services/pdv-mapping.service';

interface UnmappedUsersTableProps {
    data: UserSuggestion[];
    isLoading: boolean;
}

export const UnmappedUsersTable: React.FC<UnmappedUsersTableProps> = ({ data, isLoading }) => {
    const [selectedRows, setSelectedRows] = useState<number[]>([]); // Store index of selected rows
    const [mappingModalOpen, setMappingModalOpen] = useState(false);
    const [targetUserForMapping, setTargetUserForMapping] = useState<UserSuggestion | null>(null);
    const [isBulkMapping, setIsBulkMapping] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const createMappingMutation = useMutation({
        mutationFn: createPdvUserMapping,
        onSuccess: () => {
            toast({
                title: "Mapeamento criado com sucesso",
                description: "O usuário do PDV foi vinculado ao usuário do ERP.",
            });
            queryClient.invalidateQueries({ queryKey: ['pdv-suggestions'] });
        },
        onError: (error: any) => {
            console.error("Erro ao criar mapeamento:", error);
            const errorMessage = error?.response?.data?.message || "Ocorreu um erro ao tentar vincular o usuário.";

            // Handle duplicate entry specifically if possible, otherwise generic error
            if (errorMessage.includes("Duplicate entry") || errorMessage.includes("Integrity constraint violation")) {
                toast({
                    title: "Usuário já vinculado",
                    description: "Este usuário do PDV já possui um vínculo. A lista será atualizada.",
                    variant: "destructive",
                });
                // Build robust refresh logic
                queryClient.invalidateQueries({ queryKey: ['pdv-suggestions'] });
                queryClient.invalidateQueries({ queryKey: ['pdv-mappings'] });
            } else {
                toast({
                    title: "Erro ao criar mapeamento",
                    description: errorMessage,
                    variant: "destructive",
                });
            }
        }
    });

    const bulkMappingMutation = useMutation({
        mutationFn: bulkCreatePdvUserMappings,
        onSuccess: (data) => {
            toast({
                title: "Mapeamento em massa concluído",
                description: `${data.data.count} usuários foram vinculados com sucesso.`,
            });
            queryClient.invalidateQueries({ queryKey: ['pdv-suggestions'] });
            setSelectedRows([]);
        },
        onError: () => {
            toast({
                title: "Erro no mapeamento em massa",
                description: "Não foi possível concluir a operação.",
                variant: "destructive",
            });
        }
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedRows(data.map((_, index) => index));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (index: number, checked: boolean) => {
        if (checked) {
            setSelectedRows(prev => [...prev, index]);
        } else {
            setSelectedRows(prev => prev.filter(i => i !== index));
        }
    };

    const openMappingModal = (suggestion: UserSuggestion) => {
        setTargetUserForMapping(suggestion);
        setIsBulkMapping(false);
        setMappingModalOpen(true);
    };

    const openBulkMappingModal = () => {
        setIsBulkMapping(true);
        setMappingModalOpen(true);
    };

    const handleUserSelected = (erpUser: any) => {
        if (isBulkMapping) {
            const mappings = selectedRows.map(index => ({
                store_pdv_id: data[index].identity.store_pdv_id,
                pdv_user_id: data[index].identity.user_pdv_id,
            }));

            bulkMappingMutation.mutate({
                user_id: erpUser.id,
                mappings: mappings
            });
        } else if (targetUserForMapping) {
            createMappingMutation.mutate({
                store_pdv_id: targetUserForMapping.identity.store_pdv_id,
                pdv_user_id: targetUserForMapping.identity.user_pdv_id,
                user_id: erpUser.id,
            });
        }
    };

    const handleAutoMatch = (suggestion: UserSuggestion) => {
        if (!suggestion.suggestion) return;

        createMappingMutation.mutate({
            store_pdv_id: suggestion.identity.store_pdv_id,
            pdv_user_id: suggestion.identity.user_pdv_id,
            user_id: suggestion.suggestion.user_id,
        });
    };

    return (
        <div className="space-y-4">
            {selectedRows.length > 0 && (
                <div className="bg-muted/50 p-2 rounded-md flex items-center justify-between">
                    <span className="text-sm font-medium px-2">
                        {selectedRows.length} item(s) selecionado(s)
                    </span>
                    <Button size="sm" onClick={openBulkMappingModal}>
                        Vincular Selecionados
                    </Button>
                </div>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={data.length > 0 && selectedRows.length === data.length}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Identidade PDV</TableHead>
                            <TableHead>Loja</TableHead>
                            <TableHead>Visto por último</TableHead>
                            <TableHead>Sugestão (IA)</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Carregando sugestões...
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Nenhum usuário não mapeado encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, index) => (
                                <TableRow key={`${row.identity.store_pdv_id}-${row.identity.user_pdv_id}`}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedRows.includes(index)}
                                            onCheckedChange={(checked) => handleSelectRow(index, checked as boolean)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">
                                            {row.identity.original_name}
                                        </div>
                                        {row.identity.original_login && (
                                            <div className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded w-fit mt-1">
                                                {row.identity.original_login}
                                            </div>
                                        )}
                                        <div className="text-[10px] text-muted-foreground mt-0.5">
                                            ID: {row.identity.user_pdv_id}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col">
                                                <Badge variant="outline" className="w-fit">
                                                    Loja {row.identity.store_pdv_id}
                                                </Badge>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="text-sm font-medium">
                                                {row.sales_count} vendas
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Visto: {format(new Date(row.last_seen_at), "dd/MM HH:mm", { locale: ptBR })}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {row.suggestion ? (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={`border-opacity-50 ${row.suggestion.confidence >= 80
                                                            ? "border-green-500 bg-green-50 text-green-700"
                                                            : "border-yellow-500 bg-yellow-50 text-yellow-700"
                                                            }`}
                                                    >
                                                        <Sparkles className="h-3 w-3 mr-1" />
                                                        {row.suggestion.confidence}% Match
                                                    </Badge>
                                                </div>
                                                <span className="text-sm font-medium">{row.suggestion.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Sem sugestão</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                {row.suggestion && row.suggestion.confidence > 80 && (
                                                    <DropdownMenuItem onClick={() => handleAutoMatch(row)}>
                                                        <Check className="mr-2 h-4 w-4" />
                                                        Confirmar Sugestão
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => openMappingModal(row)}>
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Vincular Manualmente
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <UserMappingModal
                open={mappingModalOpen}
                onOpenChange={setMappingModalOpen}
                onSelectUser={handleUserSelected}
                isLoading={createMappingMutation.isPending || bulkMappingMutation.isPending}
                initialSearch={targetUserForMapping?.suggestion?.name || ''}
                title={isBulkMapping ? `Vincular ${selectedRows.length} usuários` : "Vincular Usuário"}
                description={isBulkMapping
                    ? "Selecione o usuário do ERP que corresponde a TODAS as identidades selecionadas."
                    : `Selecione o usuário do ERP que corresponde a "${targetUserForMapping?.identity.original_name}".`
                }
            />
        </div>
    );
};
