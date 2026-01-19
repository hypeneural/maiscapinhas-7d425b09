/**
 * Wheel Dashboard Page
 * 
 * Main dashboard for the Wheel module showing stats and recent screens.
 * Super Admin only.
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tv,
    Gift,
    RotateCw,
    Award,
    ChevronRight,
    AlertCircle,
    Users,
} from 'lucide-react';
import { useWheelAnalyticsSummary, useWheelScreens } from '@/hooks/api/use-wheel';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    loading?: boolean;
    color?: string;
}

function StatCard({ title, value, subtitle, icon, loading, color = 'bg-primary' }: StatCardProps) {
    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-3 w-20" />
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
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">{subtitle}</p>
                        )}
                    </div>
                    <div className={`p-3 rounded-lg ${color}`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ isOnline, status }: { isOnline: boolean; status: string }) {
    if (status === 'maintenance') {
        return (
            <Badge variant="outline\" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                🟡 Manutenção
            </Badge>
        );
    }

    return isOnline ? (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            🟢 Online
        </Badge>
    ) : (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
            🔴 Offline
        </Badge>
    );
}

export default function WheelDashboard() {
    const { data: analyticsData, isLoading: analyticsLoading } = useWheelAnalyticsSummary();
    const { data: screensData, isLoading: screensLoading } = useWheelScreens({ per_page: 5 });

    const analytics = analyticsData?.data;
    const screens = screensData?.data || [];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">🎯 Roleta nas TVs</h1>
                    <p className="text-muted-foreground">
                        Gerencie o sistema de roleta interativa para as vitrines das lojas
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="TVs Online"
                    value={analytics ? `${analytics.screens.online}/${analytics.screens.total}` : '-'}
                    subtitle="Dispositivos conectados"
                    icon={<Tv className="h-6 w-6 text-white" />}
                    loading={analyticsLoading}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Campanhas Ativas"
                    value={analytics?.campaigns.active ?? '-'}
                    subtitle={analytics?.campaigns.draft ? `${analytics.campaigns.draft} em rascunho` : undefined}
                    icon={<Gift className="h-6 w-6 text-white" />}
                    loading={analyticsLoading}
                    color="bg-green-500"
                />
                <StatCard
                    title="Giros Hoje"
                    value={analytics?.today.spins ?? '-'}
                    subtitle="Total de participações"
                    icon={<RotateCw className="h-6 w-6 text-white" />}
                    loading={analyticsLoading}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Prêmios Ganhos"
                    value={analytics?.today.prizes_won ?? '-'}
                    subtitle="Prêmios sorteados hoje"
                    icon={<Award className="h-6 w-6 text-white" />}
                    loading={analyticsLoading}
                    color="bg-amber-500"
                />
            </div>

            {/* Recent Screens */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>TVs Recentes</CardTitle>
                        <CardDescription>Status das últimas TVs cadastradas</CardDescription>
                    </div>
                    <Button variant="outline" asChild>
                        <Link to="/admin/wheel/screens">
                            Ver Todas
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {screensLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : screens.length === 0 ? (
                        <div className="text-center py-8">
                            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-2 text-muted-foreground">Nenhuma TV cadastrada ainda</p>
                            <Button asChild className="mt-4">
                                <Link to="/admin/wheel/screens">Cadastrar TV</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {screens.map((screen) => (
                                <Link
                                    key={screen.id}
                                    to={`/admin/wheel/screens/${screen.screen_key}`}
                                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-muted">
                                            <Tv className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{screen.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {screen.store?.name || 'Sem loja'} • {screen.active_campaign?.name || 'Sem campanha'}
                                            </p>
                                        </div>
                                    </div>
                                    <StatusBadge isOnline={screen.is_online} status={screen.status} />
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer" asChild>
                    <Link to="/admin/wheel/screens">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-blue-500/10">
                                <Tv className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="font-medium">Gerenciar TVs</p>
                                <p className="text-sm text-muted-foreground">Cadastrar e configurar dispositivos</p>
                            </div>
                        </CardContent>
                    </Link>
                </Card>

                <Card className="hover:border-primary/50 transition-colors cursor-pointer" asChild>
                    <Link to="/admin/wheel/campaigns">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-green-500/10">
                                <Gift className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="font-medium">Gerenciar Campanhas</p>
                                <p className="text-sm text-muted-foreground">Criar e configurar campanhas</p>
                            </div>
                        </CardContent>
                    </Link>
                </Card>

                <Card className="hover:border-primary/50 transition-colors cursor-pointer" asChild>
                    <Link to="/admin/wheel/prizes">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-amber-500/10">
                                <Award className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="font-medium">Gerenciar Prêmios</p>
                                <p className="text-sm text-muted-foreground">Catálogo de prêmios disponíveis</p>
                            </div>
                        </CardContent>
                    </Link>
                </Card>

                <Card className="hover:border-primary/50 transition-colors cursor-pointer" asChild>
                    <Link to="/admin/wheel/players">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-purple-500/10">
                                <Users className="h-6 w-6 text-purple-500" />
                            </div>
                            <div>
                                <p className="font-medium">Gerenciar Jogadores</p>
                                <p className="text-sm text-muted-foreground">Players da roleta</p>
                            </div>
                        </CardContent>
                    </Link>
                </Card>
            </div>
        </div>
    );
}
