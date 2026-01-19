/**
 * Wheel Rules Page
 * 
 * Dedicated page for managing Prize Rules across all campaigns.
 * Provides easy access without needing to navigate to campaign detail.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Settings,
    ChevronRight,
    Gift,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import { useWheelCampaigns } from '@/hooks/api/use-wheel';
import { usePrizeRules, usePrizeState } from '@/hooks/api/use-prize-rules';
import { PrizeRulesTable } from './components/PrizeRulesTable';
import { PrizeStateCards } from './components/PrizeStateCards';
import type { CampaignStatus } from '@/types/wheel.types';

function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
    const config = {
        draft: { label: 'Rascunho', className: 'bg-gray-500/10 text-gray-600' },
        active: { label: 'Ativa', className: 'bg-green-500/10 text-green-600' },
        paused: { label: 'Pausada', className: 'bg-yellow-500/10 text-yellow-600' },
        ended: { label: 'Encerrada', className: 'bg-red-500/10 text-red-600' },
    };
    const { label, className } = config[status] || config.draft;
    return <Badge className={className}>{label}</Badge>;
}

export default function WheelRules() {
    const [selectedCampaignKey, setSelectedCampaignKey] = useState<string>('');

    const { data: campaignsData, isLoading: campaignsLoading } = useWheelCampaigns({
        status: 'active', // Only show active/paused campaigns
    });

    const campaigns = campaignsData?.data || [];

    // Auto-select first active campaign
    const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'paused');
    const selectedKey = selectedCampaignKey || activeCampaigns[0]?.campaign_key || '';

    const { data: prizeStateData, refetch: refetchState, isFetching } = usePrizeState(selectedKey, {
        enabled: !!selectedKey,
        refetchInterval: 15000,
    });

    if (campaignsLoading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Settings className="h-8 w-8" />
                        Regras de Distribuição
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Configure cooldowns, limites e controles de prêmios por campanha
                    </p>
                </div>

                {activeCampaigns.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Select
                            value={selectedKey}
                            onValueChange={setSelectedCampaignKey}
                        >
                            <SelectTrigger className="w-[280px]">
                                <SelectValue placeholder="Selecione uma campanha" />
                            </SelectTrigger>
                            <SelectContent>
                                {activeCampaigns.map((campaign) => (
                                    <SelectItem key={campaign.campaign_key} value={campaign.campaign_key}>
                                        <div className="flex items-center gap-2">
                                            <Gift className="h-4 w-4" />
                                            {campaign.name}
                                            <CampaignStatusBadge status={campaign.status} />
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => refetchState()}
                            disabled={isFetching || !selectedKey}
                        >
                            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                )}
            </div>

            {/* No Active Campaigns */}
            {activeCampaigns.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-medium">Nenhuma campanha ativa</h3>
                        <p className="mt-2 text-muted-foreground">
                            Ative uma campanha para configurar as regras de distribuição de prêmios.
                        </p>
                        <Button asChild className="mt-4">
                            <Link to="/admin/wheel/campaigns">
                                Ver Campanhas
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : selectedKey ? (
                <>
                    {/* Selected Campaign Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Gift className="h-5 w-5" />
                                        {activeCampaigns.find(c => c.campaign_key === selectedKey)?.name}
                                    </CardTitle>
                                    <CardDescription>
                                        <code className="text-xs">{selectedKey}</code>
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link to={`/admin/wheel/campaigns/${selectedKey}`}>
                                        Ver Detalhes
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Rules Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Regras Configuradas</CardTitle>
                            <CardDescription>
                                Defina quando e com que frequência cada prêmio pode sair
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PrizeRulesTable
                                campaignKey={selectedKey}
                                prizeStates={prizeStateData?.data || []}
                                onRefresh={() => refetchState()}
                            />
                        </CardContent>
                    </Card>

                    {/* Real-time State */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Status em Tempo Real</CardTitle>
                            <CardDescription>
                                Monitoramento de elegibilidade com atualização automática
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PrizeStateCards campaignKey={selectedKey} />
                        </CardContent>
                    </Card>
                </>
            ) : null}

            {/* Legend */}
            <Card className="bg-muted/30">
                <CardContent className="py-4">
                    <h4 className="font-medium mb-2">Legenda de Status</h4>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500" /> Elegível - pode sair
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" /> Cooldown - aguardando
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500" /> Bloqueado - limite atingido
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-gray-500" /> Sem estoque
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
