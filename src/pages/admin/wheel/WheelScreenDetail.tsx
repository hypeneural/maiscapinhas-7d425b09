/**
 * Wheel Screen Detail Page
 * 
 * Detailed view of a single screen with health check and campaign management.
 * Super Admin only.
 */

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    Tv,
    MapPin,
    Clock,
    Monitor,
    Gift,
    Play,
    Pause,
    RefreshCw,
    Settings,
} from 'lucide-react';
import {
    useWheelScreen,
    useWheelScreenHealth,
    useWheelScreenCampaigns,
    useActivateCampaignOnScreen,
} from '@/hooks/api/use-wheel';
import { useToast } from '@/hooks/use-toast';
import type { ScreenStatus, WheelScreen } from '@/types/wheel.types';
import { EditScreenDialog } from './components/WheelEditDialogs';

function StatusBadge({ isOnline, status }: { isOnline: boolean; status: ScreenStatus }) {
    if (status === 'maintenance') {
        return (
            <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                🟡 Manutenção
            </Badge>
        );
    }
    if (status === 'inactive') {
        return (
            <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                ⚫ Inativo
            </Badge>
        );
    }

    return isOnline ? (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            🟢 Online
        </Badge>
    ) : (
        <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            🔴 Offline
        </Badge>
    );
}

export default function WheelScreenDetail() {
    const { key } = useParams<{ key: string }>();
    const { toast } = useToast();

    const { data: screenData, isLoading } = useWheelScreen(key || '');
    const { data: healthData, isLoading: healthLoading } = useWheelScreenHealth(key || '');
    const { data: campaignsData } = useWheelScreenCampaigns(key || '');
    const activateCampaign = useActivateCampaignOnScreen();

    const [editingScreen, setEditingScreen] = useState<WheelScreen | null>(null);

    const screen = screenData?.data;
    const health = healthData?.data;
    const campaigns = campaignsData?.data || [];

    const handleActivateCampaign = async (campaignKey: string) => {
        if (!key) return;
        try {
            await activateCampaign.mutateAsync({ screenKey: key, campaignKey });
            toast({
                title: 'Campanha ativada',
                description: 'A campanha foi ativada nesta TV.',
            });
        } catch {
            toast({
                title: 'Erro',
                description: 'Não foi possível ativar a campanha.',
                variant: 'destructive',
            });
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

    if (!screen) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/admin/wheel/screens">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">TV não encontrada</h1>
                </div>
                <Card>
                    <CardContent className="py-12 text-center">
                        <Tv className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-muted-foreground">
                            A TV solicitada não foi encontrada.
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
                        <Link to="/admin/wheel/screens">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{screen.name}</h1>
                            <StatusBadge isOnline={screen.is_online} status={screen.status} />
                        </div>
                        <p className="text-muted-foreground">
                            {screen.store?.name || 'Sem loja'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => screen && setEditingScreen(screen)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Editar
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tv className="h-5 w-5" />
                            Informações
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Chave</span>
                            <code className="text-sm bg-muted px-2 py-1 rounded">{screen.screen_key}</code>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> Loja
                            </span>
                            <span>{screen.store?.name || '-'}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant="outline">{screen.status_label}</Badge>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Criada em
                            </span>
                            <span>{new Date(screen.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Health Check Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Monitor className="h-5 w-5" />
                            Health Check
                        </CardTitle>
                        <CardDescription>Informações de conectividade</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {healthLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ) : health ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <StatusBadge isOnline={health.is_online} status={health.status} />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Último Heartbeat</span>
                                    <span className="text-sm">{health.last_seen_ago || 'Nunca'}</span>
                                </div>
                                {health.device_info && (
                                    <>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Resolução</span>
                                            <span className="text-sm">{health.device_info.resolution || '-'}</span>
                                        </div>
                                        <Separator />
                                        <div>
                                            <span className="text-muted-foreground text-sm">User Agent</span>
                                            <p className="text-xs mt-1 text-muted-foreground/70 truncate">
                                                {health.device_info.user_agent || '-'}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">
                                Dados de saúde não disponíveis
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Active Campaign */}
            {screen.active_campaign && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5" />
                            Campanha Ativa
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-green-500/10">
                                    <Gift className="h-6 w-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="font-medium">{screen.active_campaign.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Status: {screen.active_campaign.status}
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" asChild>
                                <Link to={`/admin/wheel/campaigns/${screen.active_campaign.campaign_key}`}>
                                    Ver Campanha
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Linked Campaigns */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Campanhas Vinculadas</CardTitle>
                        <CardDescription>Campanhas disponíveis para esta TV</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/admin/wheel/campaigns">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Gerenciar
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {campaigns.length === 0 ? (
                        <div className="text-center py-8">
                            <Gift className="mx-auto h-10 w-10 text-muted-foreground/50" />
                            <p className="mt-2 text-muted-foreground">
                                Nenhuma campanha vinculada a esta TV.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {campaigns.map((campaign) => (
                                <div
                                    key={campaign.id}
                                    className="flex items-center justify-between p-3 rounded-lg border"
                                >
                                    <div className="flex items-center gap-3">
                                        {campaign.is_active_on_screen ? (
                                            <Badge className="bg-green-500 text-white">Ativa</Badge>
                                        ) : (
                                            <Badge variant="outline">Inativa</Badge>
                                        )}
                                        <span className="font-medium">{campaign.name}</span>
                                    </div>
                                    <div>
                                        {campaign.is_active_on_screen ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toast({
                                                    title: 'Dica',
                                                    description: 'Para desativar, ative outra campanha nesta TV ou pause a campanha na página de campanhas.',
                                                })}
                                            >
                                                <Pause className="mr-2 h-4 w-4" />
                                                Desativar
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleActivateCampaign(campaign.campaign_key)}
                                                disabled={activateCampaign.isPending}
                                            >
                                                <Play className="mr-2 h-4 w-4" />
                                                Ativar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Screen Dialog */}
            <EditScreenDialog
                screen={editingScreen}
                open={!!editingScreen}
                onOpenChange={(open) => !open && setEditingScreen(null)}
            />
        </div>
    );
}
