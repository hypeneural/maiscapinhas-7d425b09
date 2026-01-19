/**
 * Wheel Analytics Page
 * 
 * Detailed analytics dashboard for the Wheel module.
 * Super Admin only.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowLeft,
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    RotateCw,
    Award,
    AlertTriangle,
    Tv,
    Calendar,
    RefreshCw,
    Store,
    Clock,
    MapPin,
    DollarSign,
    HelpCircle,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import {
    useWheelAnalyticsDetailed,
    useWheelAnalyticsByStore,
    useWheelAnalyticsPeakHours,
    useWheelAnalyticsGeographic,
    useWheelAnalyticsRoi,
    useWheelCampaigns,
} from '@/hooks/api/use-wheel';
import type { AnalyticsPeriod, StorePerformance } from '@/types/wheel.types';

// ============================================
// Tooltip Helper Component
// ============================================

interface InfoTooltipProps {
    text: string;
}

function InfoTooltip({ text }: InfoTooltipProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help inline-block ml-1" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
                <p className="text-sm">{text}</p>
            </TooltipContent>
        </Tooltip>
    );
}

// ============================================
// Stat Card Component
// ============================================

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: number;
    loading?: boolean;
    tooltip?: string;
}

function StatCard({ title, value, subtitle, icon, trend, loading, tooltip }: StatCardProps) {
    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-12 w-12 rounded-lg" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                            {title}
                            {tooltip && <InfoTooltip text={tooltip} />}
                        </p>
                        <p className="text-3xl font-bold">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                {trend !== undefined && (
                                    trend >= 0 ? (
                                        <TrendingUp className="h-3 w-3 text-green-500" />
                                    ) : (
                                        <TrendingDown className="h-3 w-3 text-red-500" />
                                    )
                                )}
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10">
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================
// Store Performance Row Component
// ============================================

interface StoreRowProps {
    store: StorePerformance;
}

function StoreRow({ store }: StoreRowProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <tr className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                        {store.screens.length > 0 ? (
                            expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                        ) : (
                            <span className="w-4" />
                        )}
                        <span className="font-medium">{store.store_name}</span>
                        <Badge variant="secondary" className="text-xs">{store.screens_count} TVs</Badge>
                    </div>
                </td>
                <td className="text-right py-3 px-4">{(store.totals.spins ?? 0).toLocaleString()}</td>
                <td className="text-right py-3 px-4">{(store.totals.prizes_won ?? 0).toLocaleString()}</td>
                <td className="text-right py-3 px-4">{(store.totals.players_joined ?? 0).toLocaleString()}</td>
                <td className="text-right py-3 px-4">{(store.totals.redeemed ?? 0).toLocaleString()}</td>
            </tr>
            {expanded && store.screens.map((screen) => (
                <tr key={screen.screen_key} className="border-b bg-muted/30">
                    <td className="py-2 px-4 pl-12 text-sm text-muted-foreground">
                        <Link to={`/admin/wheel/screens/${screen.screen_key}`} className="hover:text-primary">
                            📺 {screen.screen_name}
                        </Link>
                    </td>
                    <td className="text-right py-2 px-4 text-sm">{(screen.metrics.spins ?? 0).toLocaleString()}</td>
                    <td className="text-right py-2 px-4 text-sm">{(screen.metrics.prizes_won ?? 0).toLocaleString()}</td>
                    <td className="text-right py-2 px-4 text-sm">{(screen.metrics.players_joined ?? 0).toLocaleString()}</td>
                    <td className="text-right py-2 px-4 text-sm">
                        <span>{(screen.metrics.redeemed ?? 0).toLocaleString()}</span>
                        <span className="text-muted-foreground ml-2">
                            ({(screen.metrics.redemption_rate ?? 0).toFixed(1)}%)
                        </span>
                    </td>
                </tr>
            ))}
        </>
    );
}

// ============================================
// Main Component
// ============================================

export default function WheelAnalytics() {
    const [period, setPeriod] = useState<AnalyticsPeriod>('week');
    const [campaignFilter, setCampaignFilter] = useState<string>('all');
    const [activeTab, setActiveTab] = useState('overview');

    // Data fetching
    const { data: analyticsData, isLoading, refetch } = useWheelAnalyticsDetailed({
        period,
        campaign_key: campaignFilter !== 'all' ? campaignFilter : undefined,
    });
    const { data: byStoreData, isLoading: isLoadingByStore } = useWheelAnalyticsByStore({ period });
    const { data: peakHoursData, isLoading: isLoadingPeakHours } = useWheelAnalyticsPeakHours({ period });
    const { data: geoData, isLoading: isLoadingGeo } = useWheelAnalyticsGeographic({ period });
    const { data: roiData, isLoading: isLoadingRoi } = useWheelAnalyticsRoi({
        period,
        campaign_key: campaignFilter !== 'all' ? campaignFilter : undefined,
    });
    const { data: campaignsData } = useWheelCampaigns();

    const analytics = analyticsData?.data;
    const byStore = byStoreData?.data;
    const peakHours = peakHoursData?.data;
    const geo = geoData?.data;
    const roi = roiData?.data;
    const campaigns = campaignsData?.data || [];

    // Calculate max values for charts
    const maxHourSpins = Math.max(...(peakHours?.by_hour?.map(h => h.spins) || [1]));
    const maxDaySpins = Math.max(...(peakHours?.by_day_of_week?.map(d => d.spins) || [1]));

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
                    <h1 className="text-3xl font-bold tracking-tight">📊 Analytics Detalhado</h1>
                    <p className="text-muted-foreground">
                        Métricas completas do sistema de roleta
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
                        <Select value={period} onValueChange={(value) => setPeriod(value as AnalyticsPeriod)}>
                            <SelectTrigger className="w-[180px]">
                                <Calendar className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Período" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Hoje</SelectItem>
                                <SelectItem value="week">Última Semana</SelectItem>
                                <SelectItem value="month">Último Mês</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                            <SelectTrigger className="w-[220px]">
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

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Visão Geral</span>
                    </TabsTrigger>
                    <TabsTrigger value="stores" className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        <span className="hidden sm:inline">Por Loja</span>
                    </TabsTrigger>
                    <TabsTrigger value="peak" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">Horários</span>
                    </TabsTrigger>
                    <TabsTrigger value="geo" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="hidden sm:inline">Geográfico</span>
                    </TabsTrigger>
                    <TabsTrigger value="roi" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="hidden sm:inline">ROI</span>
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                    {/* Main Stats */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Total de Giros"
                            value={analytics?.totals.spins ?? '-'}
                            subtitle={analytics?.period ? `${analytics.period.from} a ${analytics.period.to}` : undefined}
                            icon={<RotateCw className="h-6 w-6 text-primary" />}
                            loading={isLoading}
                            tooltip="Total de giros realizados neste período"
                        />
                        <StatCard
                            title="Prêmios Ganhos"
                            value={analytics?.totals.prizes_won ?? '-'}
                            subtitle={analytics?.totals.conversion_rate ? `${analytics.totals.conversion_rate.toFixed(1)}% taxa de conversão` : undefined}
                            icon={<Award className="h-6 w-6 text-amber-500" />}
                            trend={analytics?.totals.conversion_rate}
                            loading={isLoading}
                            tooltip="Quantidade de prêmios ganhos (exclui 'Nada' e 'Tente Novamente')"
                        />
                        <StatCard
                            title="Participantes Únicos"
                            value={analytics?.totals.unique_phones ?? '-'}
                            subtitle="Telefones únicos"
                            icon={<Users className="h-6 w-6 text-blue-500" />}
                            loading={isLoading}
                            tooltip="Jogadores únicos que participaram"
                        />
                        <StatCard
                            title="Taxa de Conversão"
                            value={analytics?.totals.conversion_rate ? `${analytics.totals.conversion_rate.toFixed(1)}%` : '-'}
                            subtitle="Prêmios / Giros"
                            icon={<TrendingUp className="h-6 w-6 text-green-500" />}
                            loading={isLoading}
                            tooltip="Porcentagem de giros que resultaram em prêmio"
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* By Day Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Giros por Dia
                                </CardTitle>
                                <CardDescription>Distribuição diária de giros e prêmios</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <Skeleton className="h-4 w-20" />
                                                <Skeleton className="h-6 flex-1 rounded" />
                                            </div>
                                        ))}
                                    </div>
                                ) : analytics?.by_day && analytics.by_day.length > 0 ? (
                                    <div className="space-y-3">
                                        {analytics.by_day.slice(-7).map((day) => {
                                            const maxSpins = Math.max(...analytics.by_day.map(d => d.spins));
                                            const percentage = maxSpins > 0 ? (day.spins / maxSpins) * 100 : 0;
                                            return (
                                                <div key={day.date} className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">{new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}</span>
                                                        <span className="font-medium">{day.spins} giros • {day.prizes} prêmios</span>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full transition-all"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">Sem dados para o período</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* By Prize */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5" />
                                    Distribuição por Prêmio
                                </CardTitle>
                                <CardDescription>Quantidade de cada prêmio sorteado</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-6 w-16" />
                                            </div>
                                        ))}
                                    </div>
                                ) : analytics?.by_prize && analytics.by_prize.length > 0 ? (
                                    <div className="space-y-2">
                                        {analytics.by_prize.map((prize) => (
                                            <div key={prize.prize_key} className="flex items-center justify-between p-3 border rounded-lg">
                                                <span className="font-medium">{prize.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary">{prize.count}x</Badge>
                                                    <span className="text-sm text-muted-foreground">({(prize.percentage ?? 0).toFixed(1)}%)</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">Sem dados para o período</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Inventory Alerts */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    Alertas de Estoque
                                </CardTitle>
                                <CardDescription>Prêmios com estoque baixo</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2].map((i) => (
                                            <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                        ))}
                                    </div>
                                ) : analytics?.inventory_alerts && analytics.inventory_alerts.length > 0 ? (
                                    <div className="space-y-2">
                                        {analytics.inventory_alerts.map((alert) => (
                                            <div
                                                key={`${alert.campaign_key}-${alert.prize_key}`}
                                                className={`p-3 border rounded-lg ${alert.alert_level === 'critical'
                                                    ? 'border-red-500/50 bg-red-500/5'
                                                    : 'border-yellow-500/50 bg-yellow-500/5'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">{alert.prize_name}</p>
                                                        <p className="text-sm text-muted-foreground">Campanha: {alert.campaign_key}</p>
                                                    </div>
                                                    <Badge
                                                        variant={alert.alert_level === 'critical' ? 'destructive' : 'outline'}
                                                        className={alert.alert_level === 'critical' ? '' : 'bg-yellow-500/10 text-yellow-600'}
                                                    >
                                                        {alert.remaining} restantes
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Badge variant="outline" className="bg-green-500/10 text-green-600">
                                            ✓ Todos os estoques OK
                                        </Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Screens Needing Attention */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Tv className="h-5 w-5 text-red-500" />
                                    TVs Precisando Atenção
                                </CardTitle>
                                <CardDescription>Dispositivos offline ou com problemas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2].map((i) => (
                                            <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                        ))}
                                    </div>
                                ) : analytics?.screens_needing_attention && analytics.screens_needing_attention.length > 0 ? (
                                    <div className="space-y-2">
                                        {analytics.screens_needing_attention.map((screen) => (
                                            <Link
                                                key={screen.screen_key}
                                                to={`/admin/wheel/screens/${screen.screen_key}`}
                                                className="flex items-center justify-between p-3 border border-red-500/50 bg-red-500/5 rounded-lg hover:bg-red-500/10 transition-colors"
                                            >
                                                <div>
                                                    <p className="font-medium">{screen.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Último sinal: {new Date(screen.last_seen).toLocaleString('pt-BR')}
                                                    </p>
                                                </div>
                                                <Badge variant="destructive">
                                                    {screen.issue === 'offline_24h' ? 'Offline 24h+' : screen.issue}
                                                </Badge>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Badge variant="outline" className="bg-green-500/10 text-green-600">
                                            ✓ Todas as TVs OK
                                        </Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* By Campaign Table */}
                    {analytics?.by_campaign && analytics.by_campaign.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Desempenho por Campanha</CardTitle>
                                <CardDescription>Comparativo de giros e prêmios por campanha</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 font-medium">Campanha</th>
                                                <th className="text-right py-3 px-4 font-medium">Giros</th>
                                                <th className="text-right py-3 px-4 font-medium">Prêmios</th>
                                                <th className="text-right py-3 px-4 font-medium">Conversão</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.by_campaign.map((campaign) => {
                                                const spins = campaign.spins ?? 0;
                                                const prizes = campaign.prizes ?? 0;
                                                const conversion = spins > 0 ? (prizes / spins) * 100 : 0;
                                                return (
                                                    <tr key={campaign.campaign_key} className="border-b last:border-0">
                                                        <td className="py-3 px-4">
                                                            <Link
                                                                to={`/admin/wheel/campaigns/${campaign.campaign_key}`}
                                                                className="font-medium hover:text-primary"
                                                            >
                                                                {campaign.name ?? 'Campanha sem nome'}
                                                            </Link>
                                                        </td>
                                                        <td className="text-right py-3 px-4">{spins.toLocaleString()}</td>
                                                        <td className="text-right py-3 px-4">{prizes.toLocaleString()}</td>
                                                        <td className="text-right py-3 px-4">
                                                            <Badge variant="outline">{conversion.toFixed(1)}%</Badge>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* By Store Tab */}
                <TabsContent value="stores" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Store className="h-5 w-5" />
                                Performance por Loja
                                <InfoTooltip text="Métricas de performance agrupadas por loja e screen, permitindo comparar o desempenho entre diferentes pontos de venda." />
                            </CardTitle>
                            <CardDescription>
                                {byStore?.period && `Período: ${byStore.period.from} a ${byStore.period.to}`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingByStore ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-12 w-full rounded" />
                                    ))}
                                </div>
                            ) : byStore?.by_store && byStore.by_store.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 font-medium">
                                                    Loja
                                                </th>
                                                <th className="text-right py-3 px-4 font-medium">
                                                    Giros
                                                    <InfoTooltip text="Total de giros realizados neste período" />
                                                </th>
                                                <th className="text-right py-3 px-4 font-medium">
                                                    Prêmios
                                                    <InfoTooltip text="Quantidade de prêmios ganhos (exclui 'Nada' e 'Tente Novamente')" />
                                                </th>
                                                <th className="text-right py-3 px-4 font-medium">
                                                    Jogadores
                                                    <InfoTooltip text="Jogadores únicos que participaram" />
                                                </th>
                                                <th className="text-right py-3 px-4 font-medium">
                                                    Resgatados
                                                    <InfoTooltip text="Prêmios que foram resgatados na loja" />
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {byStore.by_store.map((store) => (
                                                <StoreRow key={store.store_id} store={store} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">Sem dados para o período</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Peak Hours Tab */}
                <TabsContent value="peak" className="space-y-6 mt-6">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <StatCard
                            title="Total de Giros"
                            value={peakHours?.total_spins ?? '-'}
                            icon={<RotateCw className="h-6 w-6 text-primary" />}
                            loading={isLoadingPeakHours}
                        />
                        <StatCard
                            title="Horário de Pico"
                            value={peakHours?.peak_hour?.label ?? '-'}
                            subtitle={`${peakHours?.peak_hour?.spins ?? 0} giros`}
                            icon={<Clock className="h-6 w-6 text-amber-500" />}
                            loading={isLoadingPeakHours}
                            tooltip="Horário com maior número de giros. Ideal para ações promocionais"
                        />
                        <StatCard
                            title="Dia de Pico"
                            value={peakHours?.peak_day?.name ?? '-'}
                            subtitle={`${peakHours?.peak_day?.spins ?? 0} giros`}
                            icon={<Calendar className="h-6 w-6 text-blue-500" />}
                            loading={isLoadingPeakHours}
                            tooltip="Dia da semana com maior engajamento"
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* By Hour Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Giros por Hora
                                    <InfoTooltip text="Use para identificar horários de baixo movimento e otimizar campanhas" />
                                </CardTitle>
                                <CardDescription>Distribuição ao longo do dia</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingPeakHours ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <Skeleton key={i} className="h-6 w-full rounded" />
                                        ))}
                                    </div>
                                ) : peakHours?.by_hour && peakHours.by_hour.length > 0 ? (
                                    <div className="space-y-1.5 max-h-80 overflow-y-auto">
                                        {peakHours.by_hour.filter(h => h.spins > 0 || h.hour >= 8 && h.hour <= 22).map((hour) => {
                                            const percentage = maxHourSpins > 0 ? (hour.spins / maxHourSpins) * 100 : 0;
                                            const isPeak = hour.hour === peakHours.peak_hour?.hour;
                                            return (
                                                <div key={hour.hour} className="flex items-center gap-3">
                                                    <span className={`text-sm w-14 ${isPeak ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                                                        {hour.label}
                                                    </span>
                                                    <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                                                        <div
                                                            className={`h-full rounded transition-all ${isPeak ? 'bg-primary' : 'bg-primary/60'}`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-sm w-12 text-right ${isPeak ? 'font-bold' : ''}`}>
                                                        {hour.spins}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">Sem dados para o período</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* By Day of Week Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Giros por Dia da Semana
                                    <InfoTooltip text="Permite ajustar estoque e equipe conforme demanda" />
                                </CardTitle>
                                <CardDescription>Comparativo semanal</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingPeakHours ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                            <Skeleton key={i} className="h-8 w-full rounded" />
                                        ))}
                                    </div>
                                ) : peakHours?.by_day_of_week && peakHours.by_day_of_week.length > 0 ? (
                                    <div className="space-y-3">
                                        {peakHours.by_day_of_week.map((day) => {
                                            const percentage = maxDaySpins > 0 ? (day.spins / maxDaySpins) * 100 : 0;
                                            const isPeak = day.name === peakHours.peak_day?.name;
                                            return (
                                                <div key={day.name} className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className={isPeak ? 'font-bold text-primary' : 'text-muted-foreground'}>
                                                            {day.name}
                                                        </span>
                                                        <span className={`font-medium ${isPeak ? 'text-primary' : ''}`}>
                                                            {day.spins} giros
                                                        </span>
                                                    </div>
                                                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${isPeak ? 'bg-primary' : 'bg-primary/60'}`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">Sem dados para o período</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Geographic Tab */}
                <TabsContent value="geo" className="space-y-6 mt-6">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <StatCard
                            title="Total de Jogadores"
                            value={geo?.total_players ?? '-'}
                            icon={<Users className="h-6 w-6 text-primary" />}
                            loading={isLoadingGeo}
                        />
                        <StatCard
                            title="Estados Cobertos"
                            value={geo?.coverage?.states ?? '-'}
                            icon={<MapPin className="h-6 w-6 text-amber-500" />}
                            loading={isLoadingGeo}
                            tooltip="Número de estados brasileiros com participantes"
                        />
                        <StatCard
                            title="Cidades Distintas"
                            value={geo?.coverage?.cities ?? '-'}
                            icon={<MapPin className="h-6 w-6 text-blue-500" />}
                            loading={isLoadingGeo}
                            tooltip="Número de cidades diferentes que participaram"
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* By State */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Por Estado
                                    <InfoTooltip text="Ranking de estados por número de participantes" />
                                </CardTitle>
                                <CardDescription>Distribuição por UF</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingGeo ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Skeleton key={i} className="h-10 w-full rounded" />
                                        ))}
                                    </div>
                                ) : geo?.by_state && geo.by_state.length > 0 ? (
                                    <div className="space-y-2">
                                        {geo.by_state.map((state, index) => {
                                            const maxPlayers = geo.by_state[0]?.players || 1;
                                            const percentage = (state.players / maxPlayers) * 100;
                                            return (
                                                <div key={state.state} className="flex items-center gap-3">
                                                    <span className="text-sm font-medium w-8">{state.state}</span>
                                                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded transition-all"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium w-16 text-right">
                                                        {state.players} {state.players === 1 ? 'jogador' : 'jogadores'}
                                                    </span>
                                                    {index === 0 && (
                                                        <Badge variant="secondary" className="text-xs">🏆</Badge>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">Sem dados para o período</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* By City */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Top Cidades
                                    <InfoTooltip text="Top 20 cidades com mais jogadores. Útil para expansão de lojas" />
                                </CardTitle>
                                <CardDescription>Principais cidades por participação</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingGeo ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Skeleton key={i} className="h-10 w-full rounded" />
                                        ))}
                                    </div>
                                ) : geo?.by_city && geo.by_city.length > 0 ? (
                                    <div className="space-y-2 max-h-80 overflow-y-auto">
                                        {geo.by_city.map((city, index) => (
                                            <div key={city.city_state} className="flex items-center justify-between p-2 border rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground w-6">#{index + 1}</span>
                                                    <span className="font-medium">{city.city_state}</span>
                                                </div>
                                                <Badge variant="secondary">{city.players}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">Sem dados para o período</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ROI Tab */}
                <TabsContent value="roi" className="space-y-6 mt-6">
                    {/* Financial Summary */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Valor Distribuído"
                            value={roi?.totals.total_value_distributed ? `R$ ${roi.totals.total_value_distributed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                            icon={<DollarSign className="h-6 w-6 text-primary" />}
                            loading={isLoadingRoi}
                            tooltip="Valor estimado total dos prêmios distribuídos"
                        />
                        <StatCard
                            title="Valor Resgatado"
                            value={roi?.totals.total_value_redeemed ? `R$ ${roi.totals.total_value_redeemed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                            icon={<DollarSign className="h-6 w-6 text-green-500" />}
                            loading={isLoadingRoi}
                            tooltip="Valor dos prêmios efetivamente resgatados"
                        />
                        <StatCard
                            title="Prêmios Distribuídos"
                            value={roi?.totals.prizes_distributed ?? '-'}
                            subtitle={`${roi?.totals.prizes_redeemed ?? 0} resgatados`}
                            icon={<Award className="h-6 w-6 text-amber-500" />}
                            loading={isLoadingRoi}
                            tooltip="Prêmios reais distribuídos (exclui 'Nada' e 'Tente Novamente')"
                        />
                        <StatCard
                            title="Jogadores Únicos"
                            value={roi?.totals.unique_players ?? '-'}
                            icon={<Users className="h-6 w-6 text-blue-500" />}
                            loading={isLoadingRoi}
                            tooltip="Número de jogadores distintos que participaram no período"
                        />
                    </div>

                    {/* Metrics */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                            <CardContent className="p-6">
                                <p className="text-sm text-muted-foreground">
                                    Valor Médio por Jogador
                                    <InfoTooltip text="Investimento médio por participante. Útil para calcular custo de aquisição" />
                                </p>
                                <p className="text-3xl font-bold mt-1">
                                    {isLoadingRoi ? <Skeleton className="h-9 w-24" /> :
                                        roi?.metrics.avg_value_per_player ? `R$ ${roi.metrics.avg_value_per_player.toFixed(2)}` : '-'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
                            <CardContent className="p-6">
                                <p className="text-sm text-muted-foreground">
                                    Custo por Engajamento
                                    <InfoTooltip text="Custo médio por interação (spin). Indica eficiência da campanha" />
                                </p>
                                <p className="text-3xl font-bold mt-1">
                                    {isLoadingRoi ? <Skeleton className="h-9 w-24" /> :
                                        roi?.metrics.cost_per_engagement ? `R$ ${roi.metrics.cost_per_engagement.toFixed(2)}` : '-'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
                            <CardContent className="p-6">
                                <p className="text-sm text-muted-foreground">
                                    Custo por Resgate
                                    <InfoTooltip text="Custo médio por prêmio resgatado. Prêmios não resgatados = economia" />
                                </p>
                                <p className="text-3xl font-bold mt-1">
                                    {isLoadingRoi ? <Skeleton className="h-9 w-24" /> :
                                        roi?.metrics.cost_per_redemption ? `R$ ${roi.metrics.cost_per_redemption.toFixed(2)}` : '-'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                            <CardContent className="p-6">
                                <p className="text-sm text-muted-foreground">
                                    Taxa de Resgate
                                    <InfoTooltip text="% de prêmios que foram efetivamente resgatados" />
                                </p>
                                <p className="text-3xl font-bold mt-1">
                                    {isLoadingRoi ? <Skeleton className="h-9 w-24" /> :
                                        roi?.metrics.redemption_rate ? `${roi.metrics.redemption_rate.toFixed(1)}%` : '-'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* By Prize Type */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5" />
                                Breakdown por Tipo de Prêmio
                            </CardTitle>
                            <CardDescription>Distribuição de value por categoria</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingRoi ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <Skeleton key={i} className="h-14 w-full rounded" />
                                    ))}
                                </div>
                            ) : roi?.by_prize_type && roi.by_prize_type.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 font-medium">Tipo</th>
                                                <th className="text-right py-3 px-4 font-medium">Quantidade</th>
                                                <th className="text-right py-3 px-4 font-medium">Valor Total</th>
                                                <th className="text-right py-3 px-4 font-medium">Resgatados</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {roi.by_prize_type.map((prize) => {
                                                const typeLabels: Record<string, string> = {
                                                    product: '🎁 Produto',
                                                    coupon: '🎟️ Cupom',
                                                    nothing: '❌ Nada',
                                                    try_again: '🔄 Tente Novamente',
                                                };
                                                return (
                                                    <tr key={prize.type} className="border-b last:border-0">
                                                        <td className="py-3 px-4 font-medium">
                                                            {typeLabels[prize.type] || prize.type}
                                                        </td>
                                                        <td className="text-right py-3 px-4">{prize.count.toLocaleString()}</td>
                                                        <td className="text-right py-3 px-4">
                                                            R$ {prize.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="text-right py-3 px-4">
                                                            {prize.redeemed > 0 ? (
                                                                <Badge variant="secondary">{prize.redeemed}</Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">Sem dados para o período</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
