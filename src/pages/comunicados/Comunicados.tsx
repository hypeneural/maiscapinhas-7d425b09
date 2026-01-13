/**
 * Comunicados Page
 * 
 * User's announcement history page with filters and pagination.
 */

import React, { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AnnouncementCard, AnnouncementReadModal } from '@/components/announcements';
import { useAnnouncementHistory } from '@/hooks/api/use-announcements';
import { usePermissions } from '@/hooks/usePermissions';
import {
    MessageSquare,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Inbox,
} from 'lucide-react';
import type { AnnouncementSummary, AnnouncementFilters } from '@/types/announcements.types';

const Comunicados: React.FC = () => {
    const { currentStore } = usePermissions();

    // Filter state
    const [filters, setFilters] = useState<AnnouncementFilters>({
        status: 'all',
        page: 1,
        per_page: 10,
    });

    // Modal state
    const [readModalOpen, setReadModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementSummary | null>(null);

    // Fetch data
    const { data, isLoading } = useAnnouncementHistory(filters);

    const announcements = data?.data || [];
    const pagination = data?.meta;

    // Handle filter changes
    const updateFilter = (key: keyof AnnouncementFilters, value: string | boolean | number) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: key !== 'page' ? 1 : (typeof value === 'number' ? value : 1),
        }));
    };

    // Handle card click
    const handleCardClick = (announcement: AnnouncementSummary) => {
        setSelectedAnnouncement(announcement);
        setReadModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Comunicados"
                description="Histórico de comunicados e avisos recebidos"
                icon={MessageSquare}
            />

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Status filter */}
                        <div className="w-full sm:w-48">
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => updateFilter('status', value)}
                            >
                                <SelectTrigger>
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="active">Ativos</SelectItem>
                                    <SelectItem value="expired">Expirados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Type filter */}
                        <div className="w-full sm:w-48">
                            <Select
                                value={filters.type || 'all'}
                                onValueChange={(value) => updateFilter('type', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os tipos</SelectItem>
                                    <SelectItem value="recado">Recados</SelectItem>
                                    <SelectItem value="advertencia">Advertências</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Severity filter */}
                        <div className="w-full sm:w-48">
                            <Select
                                value={filters.severity || 'all'}
                                onValueChange={(value) => updateFilter('severity', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Severidade" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="info">Informativo</SelectItem>
                                    <SelectItem value="warning">Atenção</SelectItem>
                                    <SelectItem value="danger">Urgente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Pending only toggle */}
                        <Button
                            variant={filters.only_unacknowledged ? 'default' : 'outline'}
                            onClick={() => updateFilter('only_unacknowledged', !filters.only_unacknowledged)}
                            className="shrink-0"
                        >
                            Pendentes
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
            ) : announcements.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Inbox className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum comunicado encontrado</h3>
                        <p className="text-muted-foreground">
                            {filters.only_unacknowledged
                                ? 'Você não tem comunicados pendentes.'
                                : 'Não há comunicados que correspondam aos filtros selecionados.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {announcements.map((announcement) => (
                        <AnnouncementCard
                            key={announcement.id}
                            announcement={announcement}
                            onClick={() => handleCardClick(announcement)}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {pagination.from} a {pagination.to} de {pagination.total} comunicados
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
                            Página {pagination.current_page} de {pagination.last_page}
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

            {/* Read Modal */}
            <AnnouncementReadModal
                announcement={selectedAnnouncement}
                open={readModalOpen}
                onClose={() => {
                    setReadModalOpen(false);
                    setSelectedAnnouncement(null);
                }}
                storeId={currentStore?.id}
            />
        </div>
    );
};

export default Comunicados;
