/**
 * Wheel Campaign Detail Page
 * 
 * Detailed view of a single campaign with inventory management.
 * Super Admin only.
 */

import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
    ArrowLeft,
    Gift,
    Calendar,
    Clock,
    Layers,
    Package,
    Play,
    Pause,
    Square,
    Settings,
    Tv,
} from 'lucide-react';
import {
    useWheelCampaign,
    useWheelInventory,
    useActivateCampaign,
    usePauseCampaign,
    useEndCampaign,
} from '@/hooks/api/use-wheel';
import { usePrizeState } from '@/hooks/api/use-prize-rules';
import { useToast } from '@/hooks/use-toast';
import type { CampaignStatus } from '@/types/wheel.types';
import { PrizeRulesTable } from './components/PrizeRulesTable';
import { PrizeStateCards } from './components/PrizeStateCards';

function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
    const config = {
        draft: { label: 'Rascunho', className: 'bg-gray-500/10 text-gray-600', icon: '⚪' },
        active: { label: 'Ativa', className: 'bg-green-500/10 text-green-600', icon: '🟢' },
        paused: { label: 'Pausada', className: 'bg-yellow-500/10 text-yellow-600', icon: '🟡' },
        ended: { label: 'Encerrada', className: 'bg-red-500/10 text-red-600', icon: '🔴' },
    };

    const { label, className, icon } = config[status] || config.draft;

    return (
        <Badge className={className}>
            {icon} {label}
        </Badge>
    );
}

export default function WheelCampaignDetail() {
    const { key } = useParams<{ key: string }>();
    const { toast } = useToast();

    const { data: campaignData, isLoading } = useWheelCampaign(key || '');
    const { data: inventoryData } = useWheelInventory(key || '');
    const activateCampaign = useActivateCampaign();
    const pauseCampaign = usePauseCampaign();
    const endCampaignMutation = useEndCampaign();

    const campaign = campaignData?.data;
    const inventory = inventoryData?.data || [];

    // Prize state for passing to rules table
    const { data: prizeStateData, refetch: refetchPrizeState } = usePrizeState(key || '', {
        enabled: !!key && !!campaign,
        refetchInterval: 15000,
    });
    const prizeStates = prizeStateData?.data || [];

    const handleActivate = async () => {
        if (!key) return;
        try {
            await activateCampaign.mutateAsync(key);
            toast({ title: 'Campanha ativada', description: 'A campanha está agora ativa.' });
        } catch {
            toast({ title: 'Erro', description: 'Não foi possível ativar a campanha.', variant: 'destructive' });
        }
    };

    const handlePause = async () => {
        if (!key) return;
        try {
            await pauseCampaign.mutateAsync(key);
            toast({ title: 'Campanha pausada', description: 'A campanha foi pausada.' });
        } catch {
            toast({ title: 'Erro', description: 'Não foi possível pausar a campanha.', variant: 'destructive' });
        }
    };

    const handleEnd = async () => {
        if (!key) return;
        if (!confirm('Tem certeza que deseja encerrar esta campanha? Esta ação não pode ser desfeita.')) return;
        try {
            await endCampaignMutation.mutateAsync(key);
            toast({ title: 'Campanha encerrada', description: 'A campanha foi encerrada permanentemente.' });
        } catch {
            toast({ title: 'Erro', description: 'Não foi possível encerrar a campanha.', variant: 'destructive' });
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/admin/wheel/campaigns">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">Campanha não encontrada</h1>
                </div>
                <Card>
                    <CardContent className="py-12 text-center">
                        <Gift className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-muted-foreground">
                            A campanha solicitada não foi encontrada.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/admin/wheel/campaigns">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
                            <CampaignStatusBadge status={campaign.status} />
                        </div>
                        <p className="text-muted-foreground">
                            <code className="text-xs bg-muted px-2 py-0.5 rounded">{campaign.campaign_key}</code>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {campaign.can_activate && (
                        <Button onClick={handleActivate} disabled={activateCampaign.isPending}>
                            <Play className="mr-2 h-4 w-4" />
                            Ativar
                        </Button>
                    )}
                    {campaign.can_pause && (
                        <Button variant="outline" onClick={handlePause} disabled={pauseCampaign.isPending}>
                            <Pause className="mr-2 h-4 w-4" />
                            Pausar
                        </Button>
                    )}
                    {campaign.can_end && (
                        <Button variant="destructive" onClick={handleEnd} disabled={endCampaignMutation.isPending}>
                            <Square className="mr-2 h-4 w-4" />
                            {endCampaignMutation.isPending ? 'Encerrando...' : 'Encerrar'}
                        </Button>
                    )}
                    <Button variant="outline" asChild>
                        <Link to={`/admin/wheel/campaigns/${key}/segments`}>
                            <Layers className="mr-2 h-4 w-4" />
                            Configurar Roleta
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5" />
                            Informações
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Período
                            </span>
                            {campaign.starts_at || campaign.ends_at ? (
                                <span>
                                    {campaign.starts_at ? new Date(campaign.starts_at).toLocaleDateString('pt-BR') : '?'}
                                    {' - '}
                                    {campaign.ends_at ? new Date(campaign.ends_at).toLocaleDateString('pt-BR') : '∞'}
                                </span>
                            ) : (
                                <span className="text-muted-foreground">Sem limite</span>
                            )}
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Tv className="h-4 w-4" /> TVs vinculadas
                            </span>
                            <span>{campaign.screens_count ?? 0}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Layers className="h-4 w-4" /> Segmentos ativos
                            </span>
                            <span>{campaign.active_segments_count ?? 0}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Peso total</span>
                            <span>{campaign.total_weight ?? 0}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Settings Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Configurações
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Tempo do QR Code
                            </span>
                            <span>{campaign.settings.qr_ttl_seconds}s</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Duração do Giro</span>
                            <span>{campaign.settings.spin_duration_ms / 1000}s</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Rotações</span>
                            <span>{campaign.settings.min_rotations} - {campaign.settings.max_rotations}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Limite por telefone</span>
                            <span>
                                {campaign.settings.per_phone_limit === '1_per_campaign' && '1 por campanha'}
                                {campaign.settings.per_phone_limit === '1_per_day' && '1 por dia'}
                                {campaign.settings.per_phone_limit === 'unlimited' && 'Ilimitado'}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Inventory */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Estoque de Prêmios
                        </CardTitle>
                        <CardDescription>Controle de limite de prêmios por campanha</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/wheel/campaigns/${key}/segments`}>
                            Gerenciar Estoque
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {inventory.length === 0 ? (
                        <div className="text-center py-8">
                            <Package className="mx-auto h-10 w-10 text-muted-foreground/50" />
                            <p className="mt-2 text-muted-foreground">
                                Nenhum estoque configurado. Configure os segmentos primeiro.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {inventory.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <div className="p-2 rounded-lg bg-muted">
                                        <span className="text-xl">{item.prize?.icon || '🎁'}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{item.prize?.name || 'Prêmio'}</p>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                            <span>
                                                Total: {item.total_limit !== null ? item.total_limit : '∞'}
                                            </span>
                                            <span>
                                                Restante: {item.remaining !== null ? item.remaining : '∞'}
                                            </span>
                                            {item.daily_limit !== null && (
                                                <span>
                                                    Diário: {item.daily_remaining}/{item.daily_limit}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {item.remaining_percentage !== null && (
                                        <div className="w-32">
                                            <Progress value={item.remaining_percentage} className="h-2" />
                                            <p className="text-xs text-center mt-1 text-muted-foreground">
                                                {item.remaining_percentage.toFixed(0)}% restante
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Prize Rules Section */}
            {campaign.status !== 'draft' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Regras de Distribuição de Prêmios
                        </CardTitle>
                        <CardDescription>
                            Configure cooldowns, limites e controles para cada prêmio
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <PrizeRulesTable
                            campaignKey={key!}
                            prizeStates={prizeStates}
                            onRefresh={() => refetchPrizeState()}
                        />

                        <Separator />

                        <PrizeStateCards campaignKey={key!} />
                    </CardContent>
                </Card>
            )}

            {/* Alert for draft campaigns */}
            {campaign.status === 'draft' && (
                <Card className="border-amber-500/50 bg-amber-500/5">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-amber-500/10">
                                <Settings className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="font-medium text-amber-600">Campanha em rascunho</p>
                                <p className="text-sm text-muted-foreground">
                                    Configure os segmentos e ative a campanha quando estiver pronta.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
