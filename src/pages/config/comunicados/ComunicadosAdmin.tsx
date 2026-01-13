/**
 * ComunicadosAdmin Page
 * 
 * Admin listing page for managing announcements.
 * Available to gerentes and admins.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AnnouncementStatusBadge,
    AnnouncementSeverityBadge
} from '@/components/announcements';
import {
    useAnnouncements,
    usePublishAnnouncement,
    useArchiveAnnouncement,
    useDeleteAnnouncement
} from '@/hooks/api/use-announcements';
import { useToast } from '@/hooks/use-toast';
import {
    Megaphone,
    Plus,
    MoreHorizontal,
    Eye,
    Pencil,
    Send,
    Archive,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Inbox,
} from 'lucide-react';
import type { AnnouncementFilters, AnnouncementDetail } from '@/types/announcements.types';

const ComunicadosAdmin: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    // Filter state
    const [filters, setFilters] = useState<AnnouncementFilters>({
        status: 'all',
        page: 1,
        per_page: 15,
        sort: 'created_at_desc',
    });

    // Fetch data
    const { data, isLoading, refetch } = useAnnouncements(filters);

    // Mutations
    const publishMutation = usePublishAnnouncement();
    const archiveMutation = useArchiveAnnouncement();
    const deleteMutation = useDeleteAnnouncement();

    const announcements = data?.data || [];
    const pagination = data?.meta;

    // Handle filter changes
    const updateFilter = (key: keyof AnnouncementFilters, value: string | number | undefined) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: key !== 'page' ? 1 : (typeof value === 'number' ? value : 1),
        }));
    };

    // Actions
    const handlePublish = async (id: number) => {
        try {
            await publishMutation.mutateAsync(id);
            toast({
                title: 'Comunicado publicado',
                description: 'O comunicado está ativo agora.',
            });
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível publicar o comunicado.',
                variant: 'destructive',
            });
        }
    };

    const handleArchive = async (id: number) => {
        try {
            await archiveMutation.mutateAsync(id);
            toast({
                title: 'Comunicado arquivado',
                description: 'O comunicado foi arquivado com sucesso.',
            });
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível arquivar o comunicado.',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este comunicado?')) return;

        try {
            await deleteMutation.mutateAsync(id);
            toast({
                title: 'Comunicado excluído',
                description: 'O comunicado foi excluído com sucesso.',
            });
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível excluir o comunicado.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Gerenciar Comunicados"
                    description="Crie e gerencie comunicados para sua equipe"
                    icon={Megaphone}
                />
                <Link to="/config/comunicados/novo">
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Novo Comunicado
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-40">
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="draft">Rascunho</SelectItem>
                                    <SelectItem value="scheduled">Agendado</SelectItem>
                                    <SelectItem value="active">Ativo</SelectItem>
                                    <SelectItem value="expired">Expirado</SelectItem>
                                    <SelectItem value="archived">Arquivado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full sm:w-40">
                            <Select
                                value={filters.type || 'all'}
                                onValueChange={(value) => updateFilter('type', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os tipos</SelectItem>
                                    <SelectItem value="recado">Recado</SelectItem>
                                    <SelectItem value="advertencia">Advertência</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full sm:w-40">
                            <Select
                                value={filters.scope || 'all'}
                                onValueChange={(value) => updateFilter('scope', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Escopo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="global">Global</SelectItem>
                                    <SelectItem value="store">Lojas</SelectItem>
                                    <SelectItem value="user">Usuários</SelectItem>
                                    <SelectItem value="role">Cargos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            {isLoading ? (
                <Card>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : announcements.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Inbox className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum comunicado encontrado</h3>
                        <p className="text-muted-foreground mb-4">
                            Crie seu primeiro comunicado para começar.
                        </p>
                        <Link to="/config/comunicados/novo">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Criar Comunicado
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Escopo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Criado em</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {announcements.map((announcement: AnnouncementDetail) => (
                                <TableRow key={announcement.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{announcement.title}</p>
                                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                                                {announcement.excerpt}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <AnnouncementSeverityBadge severity={announcement.severity.value} />
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm capitalize">{announcement.scope.label}</span>
                                    </TableCell>
                                    <TableCell>
                                        <AnnouncementStatusBadge status={announcement.status.value} />
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(announcement.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => navigate(`/config/comunicados/${announcement.id}`)}>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Visualizar
                                                </DropdownMenuItem>
                                                {announcement.status.value === 'draft' && (
                                                    <DropdownMenuItem onClick={() => navigate(`/config/comunicados/${announcement.id}`)}>
                                                        <Pencil className="w-4 h-4 mr-2" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                {announcement.status.value === 'draft' && (
                                                    <DropdownMenuItem onClick={() => handlePublish(announcement.id)}>
                                                        <Send className="w-4 h-4 mr-2" />
                                                        Publicar
                                                    </DropdownMenuItem>
                                                )}
                                                {['active', 'scheduled'].includes(announcement.status.value) && (
                                                    <DropdownMenuItem onClick={() => handleArchive(announcement.id)}>
                                                        <Archive className="w-4 h-4 mr-2" />
                                                        Arquivar
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(announcement.id)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {pagination.from} a {pagination.to} de {pagination.total}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFilter('page', pagination.current_page - 1)}
                            disabled={pagination.current_page <= 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm">
                            {pagination.current_page} / {pagination.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFilter('page', pagination.current_page + 1)}
                            disabled={pagination.current_page >= pagination.last_page}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComunicadosAdmin;
