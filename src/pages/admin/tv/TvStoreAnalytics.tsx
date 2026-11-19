import React, { useState } from 'react';
import {
    Tv,
    Store as StoreIcon,
    Calendar,
    Clock,
    Eye,
    Activity,
    Video,
    ImageIcon,
    TrendingUp,
    CheckCircle2,
    AlertTriangle,
    PowerOff,
    BarChart3,
    PieChart as PieChartIcon,
    ShieldCheck,
    Globe,
    Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Progress } from '@/components/ui/progress';
import { useTvAnalytics } from '@/hooks/api/use-tv-ads';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

export function TvStoreAnalytics() {
    const [selectedStore, setSelectedStore] = useState<string>('all');
    const [selectedPeriod, setSelectedPeriod] = useState<string>('7days');

    const { data: storesRes } = useAdminStores();
    const stores = storesRes?.data || [];

    const { data: analyticsRes, isLoading } = useTvAnalytics({
        store_id: selectedStore,
        period: selectedPeriod,
    });

    const analytics = analyticsRes?.data;
    const summary = analytics?.summary;
    const sessions = analytics?.sessions || [];
    const weekdayDistribution = analytics?.weekday_distribution || [];
    const hourlyDistribution = analytics?.hourly_distribution || [];
    const mediaTypeDistribution = analytics?.media_type_distribution || [];
    const adsPerformance = analytics?.ads_performance || [];

    const selectedStoreName =
        selectedStore === 'all'
            ? 'Todas as Lojas da Rede'
            : stores.find((s) => String(s.id) === selectedStore)?.name || `Loja #${selectedStore}`;

    return (
        <div className="space-y-6">
            {/* Barra de Filtros: Loja e Período */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <StoreIcon className="h-5 w-5 text-primary" />
                        <span className="text-sm font-semibold text-foreground">Filial Selecionada:</span>
                    </div>

                    <Select value={selectedStore} onValueChange={setSelectedStore}>
                        <SelectTrigger className="w-[260px]">
                            <SelectValue placeholder="Todas as Lojas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-primary" />
                                    <span>Todas as Lojas (Consolidado)</span>
                                </div>
                            </SelectItem>
                            {stores.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                    <div className="flex items-center gap-2">
                                        <StoreIcon className="h-4 w-4 text-muted-foreground" />
                                        <span>{s.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Período:</span>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="w-[170px]">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Hoje (24 Horas)</SelectItem>
                            <SelectItem value="7days">Últimos 7 Dias</SelectItem>
                            <SelectItem value="30days">Últimos 30 Dias</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Cards de Métricas Principais de Uptime e Audiência */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500/10 via-background to-background border-indigo-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Horas de TV Ligada
                        </CardTitle>
                        <Clock className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {isLoading ? '...' : `${summary?.total_hours_online ?? 0}h`}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Tempo total de vitrine acesa no período
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 via-background to-background border-emerald-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Média de Horas / Dia
                        </CardTitle>
                        <Activity className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {isLoading ? '...' : `${summary?.avg_hours_per_day ?? 0}h / dia`}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Média diária de transmissão contínua
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 via-background to-background border-emerald-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Disponibilidade
                        </CardTitle>
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {isLoading ? '...' : `${summary?.uptime_score ?? 100}%`}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Score de Uptime em horário comercial
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 via-background to-background border-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Exibições de Anúncios
                        </CardTitle>
                        <Eye className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {isLoading ? '...' : `${summary?.total_impressions?.toLocaleString('pt-BR') ?? 0}`}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total de reproduções completas de slides
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 via-background to-background border-purple-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Turnos Registrados
                        </CardTitle>
                        <Zap className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {isLoading ? '...' : `${summary?.total_sessions_count ?? 0} turnos`}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Ciclos de ligar e desligar monitorados
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Linha 1 de Gráficos: Dias da Semana & Horas Ligada */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico 1: Exibições por Dia da Semana */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Exibições de Anúncios por Dia da Semana
                        </CardTitle>
                        <CardDescription>
                            Volume de propagandas rodadas de Segunda a Domingo nesta filial.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px] w-full">
                            {isLoading ? (
                                <div className="h-full bg-muted animate-pulse rounded-lg" />
                            ) : weekdayDistribution.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                                    Sem dados para o período selecionado.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={weekdayDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                        <XAxis dataKey="day_name" fontSize={12} stroke="#888888" tickLine={false} />
                                        <YAxis fontSize={12} stroke="#888888" tickLine={false} />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const d = payload[0].payload;
                                                    return (
                                                        <div className="bg-popover border p-2.5 rounded-lg shadow-lg text-xs space-y-1">
                                                            <p className="font-semibold text-foreground">{d.day_name}</p>
                                                            <p className="text-blue-500 font-medium">
                                                                Exibições: {d.impressions} vezes
                                                            </p>
                                                            <p className="text-amber-500 font-medium">
                                                                Tempo no Ar: {d.airtime_minutes} min
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="impressions" fill="#6366f1" radius={[4, 4, 0, 0]} name="Exibições" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Gráfico 2: Horas de TV Ligada (Uptime) por Dia */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-5 w-5 text-indigo-500" />
                            Tempo de Vitrine Ativa por Dia da Semana
                        </CardTitle>
                        <CardDescription>
                            Minutos totais com a TV ligada e transmitindo em cada dia.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px] w-full">
                            {isLoading ? (
                                <div className="h-full bg-muted animate-pulse rounded-lg" />
                            ) : weekdayDistribution.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                                    Sem dados para o período selecionado.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weekdayDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorAirtime" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                        <XAxis dataKey="day_name" fontSize={12} stroke="#888888" tickLine={false} />
                                        <YAxis fontSize={12} stroke="#888888" tickLine={false} />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const d = payload[0].payload;
                                                    return (
                                                        <div className="bg-popover border p-2.5 rounded-lg shadow-lg text-xs space-y-1">
                                                            <p className="font-semibold text-foreground">{d.day_name}</p>
                                                            <p className="text-emerald-500 font-medium">
                                                                Tempo no Ar: {d.airtime_minutes} min ({(d.airtime_minutes / 60).toFixed(1)}h)
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="airtime_minutes"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorAirtime)"
                                            name="Minutos no Ar"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Linha 2 de Gráficos: Distribuição por Faixa de Horário & Composição de Mídia */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfico 3: Distribuição por Horário do Dia (00h às 23h) */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            Distribuição de Exibições por Faixa de Horário
                        </CardTitle>
                        <CardDescription>
                            Volume de impressões de anúncios por hora do dia (identifica horários de pico).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[260px] w-full">
                            {isLoading ? (
                                <div className="h-full bg-muted animate-pulse rounded-lg" />
                            ) : hourlyDistribution.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                                    Sem dados para o período selecionado.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={hourlyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                        <XAxis dataKey="hour" fontSize={11} stroke="#888888" tickLine={false} />
                                        <YAxis fontSize={11} stroke="#888888" tickLine={false} />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const d = payload[0].payload;
                                                    return (
                                                        <div className="bg-popover border p-2.5 rounded-lg shadow-lg text-xs space-y-1">
                                                            <p className="font-semibold text-foreground">Horário: {d.hour}</p>
                                                            <p className="text-primary font-medium">
                                                                Exibições: {d.impressions} vezes
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="impressions" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Exibições" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Gráfico 4: Composição de Tipos de Mídia (Fotos vs Vídeos) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5 text-purple-500" />
                            Fotos vs Vídeos
                        </CardTitle>
                        <CardDescription>
                            Proporção de tipos de mídia exibidos na grade.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        <div className="h-[180px] w-full">
                            {isLoading ? (
                                <div className="h-full bg-muted animate-pulse rounded-full w-40 mx-auto" />
                            ) : mediaTypeDistribution.every((m) => m.count === 0) ? (
                                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                                    Nenhuma mídia registrada no período.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={mediaTypeDistribution}
                                            dataKey="count"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={75}
                                            paddingAngle={4}
                                        >
                                            {mediaTypeDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const d = payload[0].payload;
                                                    return (
                                                        <div className="bg-popover border p-2.5 rounded-lg shadow-lg text-xs space-y-1">
                                                            <p className="font-semibold text-foreground">{d.name}</p>
                                                            <p className="text-primary font-medium">
                                                                {d.count} exibições ({d.minutes} min)
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Legenda Estilizada */}
                        <div className="grid grid-cols-2 gap-3 w-full pt-3 border-t mt-2">
                            {mediaTypeDistribution.map((item) => (
                                <div key={item.media_type} className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                                    <div className="text-xs">
                                        <p className="font-medium text-foreground">{item.name}</p>
                                        <p className="text-muted-foreground text-[11px]">{item.count} vezes</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabela de Desempenho dos Anúncios nesta Loja Específica */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" />
                        Desempenho dos Anúncios em {selectedStoreName}
                    </CardTitle>
                    <CardDescription>
                        Contagem exata de quantas vezes cada arte rodou nesta loja no período selecionado.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                            ))}
                        </div>
                    ) : adsPerformance.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <Tv className="mx-auto h-10 w-10 opacity-30 mb-2" />
                            <p className="text-sm font-medium">Nenhum anúncio foi exibido nesta filial no período.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Mídia</TableHead>
                                    <TableHead>Título do Anúncio</TableHead>
                                    <TableHead>Exibições na Loja</TableHead>
                                    <TableHead>Tempo Total no Ar</TableHead>
                                    <TableHead className="w-[180px]">% da Grade</TableHead>
                                    <TableHead className="text-right">Última Exibição</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {adsPerformance.map((ad) => (
                                    <TableRow key={ad.ad_id}>
                                        <TableCell>
                                            <div className="h-10 w-14 rounded-md overflow-hidden bg-zinc-900 flex items-center justify-center border">
                                                {ad.thumbnail_url ? (
                                                    <img
                                                        src={ad.thumbnail_url}
                                                        alt={ad.title}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    ad.media_type === 'video' ? (
                                                        <Video className="h-5 w-5 text-red-400" />
                                                    ) : (
                                                        <ImageIcon className="h-5 w-5 text-blue-400" />
                                                    )
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold text-foreground">
                                            {ad.title}
                                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                {ad.media_type === 'video' ? 'Vídeo (MP4)' : 'Foto / Imagem'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold text-foreground">
                                                {ad.impressions_count.toLocaleString('pt-BR')}
                                            </span>{' '}
                                            <span className="text-xs text-muted-foreground">vezes</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-foreground">
                                                {ad.airtime_minutes} min
                                            </span>{' '}
                                            <span className="text-xs text-muted-foreground">
                                                ({(ad.airtime_minutes / 60).toFixed(1)}h)
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="font-medium text-foreground">{ad.percentage}%</span>
                                                </div>
                                                <Progress value={ad.percentage} className="h-2" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground font-mono">
                                            {ad.last_displayed_at ? (
                                                new Date(ad.last_displayed_at).toLocaleString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })
                                            ) : (
                                                '--'
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Linha do Tempo de Sessões / Turnos da TV (Quando Ligou e Parou de Responder) */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-indigo-500" />
                        Histórico de Turnos e Disponibilidade das TVs
                    </CardTitle>
                    <CardDescription>
                        Registro exato do momento em que cada TV ligou, quando foi desligada (ou parou de responder pings).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
                            ))}
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <PowerOff className="mx-auto h-10 w-10 opacity-30 mb-2" />
                            <p className="text-sm font-medium">Nenhum turno registrado no período.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Loja / TV</TableHead>
                                    <TableHead>Horário que Ligou</TableHead>
                                    <TableHead>Horário que Parou / Desligou</TableHead>
                                    <TableHead>Duração do Turno</TableHead>
                                    <TableHead className="text-right">Status do Encerramento</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessions.map((session) => (
                                    <TableRow key={session.id}>
                                        <TableCell className="font-semibold text-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <StoreIcon className="h-4 w-4 text-muted-foreground" />
                                                {session.store_name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                {new Date(session.started_at).toLocaleString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                })}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">
                                            {session.is_active_now ? (
                                                <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    Transmitindo Agora
                                                </span>
                                            ) : session.ended_at ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="h-2 w-2 rounded-full bg-zinc-500" />
                                                    {new Date(session.ended_at).toLocaleString('pt-BR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit',
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-amber-600">
                                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                                    Último Sinal: {new Date(session.last_ping_at).toLocaleTimeString('pt-BR')}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {session.duration_human}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {session.is_active_now ? (
                                                <Badge className="bg-emerald-600 text-white gap-1">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Ligada (Ao Vivo)
                                                </Badge>
                                            ) : session.ended_reason === 'standby_turned_off' ? (
                                                <Badge variant="secondary" className="gap-1 bg-zinc-800 text-zinc-100">
                                                    <PowerOff className="h-3 w-3" />
                                                    Standby (Desligada pelo ERP)
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive" className="gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    {session.ended_reason_pt}
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
