/**
 * Wheel Logs Page
 * 
 * Event logs for the wheel module.
 * Super Admin only.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    ArrowLeft,
    ScrollText,
    Eye,
    RefreshCw,
    Tv,
    Gift,
    RotateCw,
    Award,
    Settings,
    Wifi,
    WifiOff,
    Play,
    Pause,
    Square,
    AlertCircle,
} from 'lucide-react';
import { useWheelEvents, useWheelScreens, useWheelCampaigns } from '@/hooks/api/use-wheel';
import type { WheelEventType, WheelEvent } from '@/types/wheel.types';

const EVENT_TYPE_CONFIG: Record<WheelEventType, { label: string; icon: React.ReactNode; color: string }> = {
    screen_connected: { label: 'TV Conectou', icon: <Wifi className="h-4 w-4" />, color: 'bg-green-500/10 text-green-600' },
    screen_disconnected: { label: 'TV Desconectou', icon: <WifiOff className="h-4 w-4" />, color: 'bg-red-500/10 text-red-600' },
    campaign_activated: { label: 'Campanha Ativada', icon: <Play className="h-4 w-4" />, color: 'bg-green-500/10 text-green-600' },
    campaign_paused: { label: 'Campanha Pausada', icon: <Pause className="h-4 w-4" />, color: 'bg-yellow-500/10 text-yellow-600' },
    campaign_ended: { label: 'Campanha Encerrada', icon: <Square className="h-4 w-4" />, color: 'bg-red-500/10 text-red-600' },
    spin_started: { label: 'Giro Iniciado', icon: <RotateCw className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600' },
    spin_completed: { label: 'Giro Completo', icon: <RotateCw className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600' },
    prize_won: { label: 'Prêmio Ganho', icon: <Award className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-600' },
    inventory_depleted: { label: 'Estoque Zerado', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-red-500/10 text-red-600' },
    config_changed: { label: 'Config Alterada', icon: <Settings className="h-4 w-4" />, color: 'bg-gray-500/10 text-gray-600' },
};

function EventTypeBadge({ type }: { type: WheelEventType }) {
    const config = EVENT_TYPE_CONFIG[type] || { label: type, icon: <Settings className="h-4 w-4" />, color: 'bg-gray-500/10 text-gray-600' };

    return (
        <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
            {config.icon}
            <span>{config.label}</span>
        </Badge>
    );
}

interface PayloadModalProps {
    event: WheelEvent | null;
    onClose: () => void;
}

function PayloadModal({ event, onClose }: PayloadModalProps) {
    return (
        <Dialog open={!!event} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Detalhes do Evento</DialogTitle>
                    <DialogDescription>
                        {event?.created_at_human}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Tipo:</span>
                        {event && <EventTypeBadge type={event.type} />}
                    </div>
                    {event?.screen && (
                        <div className="flex items-center gap-2">
                            <Tv className="h-4 w-4 text-muted-foreground" />
                            <span>{event.screen.name} ({event.screen.screen_key})</span>
                        </div>
                    )}
                    {event?.campaign && (
                        <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-muted-foreground" />
                            <span>{event.campaign.name} ({event.campaign.campaign_key})</span>
                        </div>
                    )}
                    <div className="space-y-2">
                        <span className="text-sm font-medium">Payload:</span>
                        <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto max-h-64">
                            {JSON.stringify(event?.payload || {}, null, 2)}
                        </pre>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function WheelLogs() {
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [screenFilter, setScreenFilter] = useState<string>('all');
    const [campaignFilter, setCampaignFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [selectedEvent, setSelectedEvent] = useState<WheelEvent | null>(null);

    const { data: eventsData, isLoading, refetch } = useWheelEvents({
        type: typeFilter !== 'all' ? typeFilter as WheelEventType : undefined,
        screen_key: screenFilter !== 'all' ? screenFilter : undefined,
        campaign_key: campaignFilter !== 'all' ? campaignFilter : undefined,
        page,
        per_page: 20,
    });

    const { data: screensData } = useWheelScreens();
    const { data: campaignsData } = useWheelCampaigns();

    const events = eventsData?.data || [];
    const meta = eventsData?.meta;
    const screens = screensData?.data || [];
    const campaigns = campaignsData?.data || [];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/admin/wheel">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Logs de Eventos</h1>
                    <p className="text-muted-foreground">
                        Histórico de eventos do sistema de roleta
                    </p>
                </div>
                <Button variant="outline" onClick={() => refetch()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setPage(1); }}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Tipo de Evento" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os tipos</SelectItem>
                                {Object.entries(EVENT_TYPE_CONFIG).map(([key, { label }]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={screenFilter} onValueChange={(value) => { setScreenFilter(value); setPage(1); }}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="TV" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as TVs</SelectItem>
                                {screens.map((screen) => (
                                    <SelectItem key={screen.screen_key} value={screen.screen_key}>
                                        {screen.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={campaignFilter} onValueChange={(value) => { setCampaignFilter(value); setPage(1); }}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Campanha" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as campanhas</SelectItem>
                                {campaigns.map((campaign) => (
                                    <SelectItem key={campaign.campaign_key} value={campaign.campaign_key}>
                                        {campaign.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Eventos</CardTitle>
                    <CardDescription>
                        {meta ? `${meta.total} evento(s) encontrado(s)` : 'Carregando...'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <Skeleton className="h-8 w-24 rounded" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            ))}
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-12">
                            <ScrollText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-lg font-medium">Nenhum evento encontrado</p>
                            <p className="text-muted-foreground">
                                {typeFilter !== 'all' || screenFilter !== 'all' || campaignFilter !== 'all'
                                    ? 'Tente ajustar os filtros.'
                                    : 'Eventos aparecerão aqui quando ocorrerem.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>TV</TableHead>
                                        <TableHead>Campanha</TableHead>
                                        <TableHead>Data/Hora</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {events.map((event) => (
                                        <TableRow key={event.id}>
                                            <TableCell>
                                                <EventTypeBadge type={event.type} />
                                            </TableCell>
                                            <TableCell>
                                                {event.screen ? (
                                                    <div className="flex items-center gap-2">
                                                        <Tv className="h-4 w-4 text-muted-foreground" />
                                                        <span>{event.screen.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {event.campaign ? (
                                                    <div className="flex items-center gap-2">
                                                        <Gift className="h-4 w-4 text-muted-foreground" />
                                                        <span>{event.campaign.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{event.created_at_human}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setSelectedEvent(event)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {meta && meta.last_page > 1 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        Página {meta.current_page} de {meta.last_page}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={meta.current_page <= 1}
                                        >
                                            Anterior
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={meta.current_page >= meta.last_page}
                                        >
                                            Próxima
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Payload Modal */}
            <PayloadModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        </div>
    );
}
