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
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, User, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserMapping } from '@/types/pdv-mapping.types';
import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePdvUserMapping } from '@/services/pdv-mapping.service';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MappedUsersTableProps {
    data: UserMapping[];
    isLoading: boolean;
}

export const MappedUsersTable: React.FC<MappedUsersTableProps> = ({ data, isLoading }) => {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [mappingToDelete, setMappingToDelete] = useState<UserMapping | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: deletePdvUserMapping,
        onSuccess: () => {
            toast({
                title: "Mapeamento removido",
                description: "O vínculo foi desfeito com sucesso.",
            });
            queryClient.invalidateQueries({ queryKey: ['pdv-mappings'] });
            setDeleteDialogOpen(false);
            setMappingToDelete(null);
        },
        onError: () => {
            toast({
                title: "Erro ao remover",
                description: "Não foi possível remover o mapeamento.",
                variant: "destructive",
            });
        }
    });

    const handleDeleteClick = (mapping: UserMapping) => {
        setMappingToDelete(mapping);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (mappingToDelete) {
            deleteMutation.mutate(mappingToDelete.id);
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Usuário ERP (Real)</TableHead>
                        <TableHead>Identidade PDV (Origem)</TableHead>
                        <TableHead>Loja</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                Carregando mapeamentos...
                            </TableCell>
                        </TableRow>
                    ) : data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                Nenhum mapeamento encontrado.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={row.mapped_to?.avatar_url || undefined} />
                                            <AvatarFallback>
                                                <User className="h-4 w-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium text-sm">{row.mapped_to?.name || 'Usuário Desconhecido'}</div>
                                            <div className="text-xs text-muted-foreground">ID: {row.mapped_to?.id || '?'}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium text-sm">
                                        {row.pdv_identity.original_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        ID PDV: {row.pdv_identity.user_pdv_id}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        {row.store_mapping?.alias || `Loja PDV ${row.pdv_identity.store_pdv_id}`}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Store ID: {row.store_mapping?.store_id || '-'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                        {row.source === 'manual_api' ? 'Manual' : 'Automático'}
                                    </Badge>
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
                                            <DropdownMenuItem onClick={() => window.open(`/config/usuarios/${row.mapped_to.id}`, '_blank')}>
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                Ver Usuário
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeleteClick(row)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Remover Vínculo
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover vínculo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isso fará com que o usuário do PDV <strong>{mappingToDelete?.pdv_identity.original_name}</strong> volte a aparecer como "Não Mapeado" (Ghost) nas vendas futuras. O histórico passado não será alterado.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Sim, remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
