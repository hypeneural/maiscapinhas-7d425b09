import React, { useState, useMemo } from 'react';
import { Users, UserCheck, UserX, Cake, Briefcase, MapPin, Filter, Info, Calendar, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
    Tooltip as UITooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUserKpis } from '@/hooks/api/use-reports';
import type { UserKpisFilters } from '@/types/api';

// Brazilian states
const BRAZILIAN_STATES = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' },
];

// Colors for charts
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c'];

// ==============================================================================
// HELPER FUNCTIONS FOR FORMATTING
// ==============================================================================

/**
 * Format days to human readable format (X anos e Y meses or X meses or X dias)
 */
function formatDaysToHuman(days: number | null): string {
    if (days === null) return '-';

    // Use absolute value for display
    const absDays = Math.abs(days);

    if (absDays < 30) {
        return `${Math.round(absDays)} dias`;
    }

    const totalMonths = absDays / 30.44;

    if (totalMonths < 12) {
        return `${Math.round(totalMonths)} meses`;
    }

    const years = Math.floor(totalMonths / 12);
    const months = Math.round(totalMonths % 12);

    if (months === 0) {
        return `${years} ${years === 1 ? 'ano' : 'anos'}`;
    }

    return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

/**
 * Format months to human readable format (X anos e Y meses)
 */
function formatMonthsToHuman(months: number | null): string {
    if (months === null) return '-';

    // Use absolute value for display
    const absMonths = Math.abs(months);

    if (absMonths < 12) {
        return `${Math.round(absMonths)} ${Math.round(absMonths) === 1 ? 'mês' : 'meses'}`;
    }

    const years = Math.floor(absMonths / 12);
    const remainingMonths = Math.round(absMonths % 12);

    if (remainingMonths === 0) {
        return `${years} ${years === 1 ? 'ano' : 'anos'}`;
    }

    return `${years} ${years === 1 ? 'ano' : 'anos'} e ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`;
}

/**
 * Format age to integer years (always positive)
 */
function formatAge(years: number | null): string {
    if (years === null) return '-';
    return `${Math.round(Math.abs(years))} anos`;
}

/**
 * Format date to Brazilian format
 */
function formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
}

const KpisColaboradores: React.FC = () => {
    const [filters, setFilters] = useState<UserKpisFilters>({
        active: '1',
    });

    // Fetch data from API
    const { data, isLoading, isError, error } = useUserKpis(filters);

    // Chart data for city distribution - FILTER OUT "(Sem cidade)"
    const cityChartData = useMemo(() => {
        if (!data?.distribution.by_city) return [];
        return data.distribution.by_city
            .filter((city) => city.city !== '(Sem cidade)')
            .map((city) => ({
                name: city.city,
                value: city.qty,
                percentage: city.pct,
            }));
    }, [data]);

    // Top 5 cities for bar chart - FILTER OUT "(Sem cidade)"
    const topCitiesData = useMemo(() => {
        if (!data?.distribution.by_city) return [];
        return data.distribution.by_city
            .filter((city) => city.city !== '(Sem cidade)')
            .slice(0, 5);
    }, [data]);

    // Helper component for info tooltips
    const InfoTooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TooltipProvider>
            <UITooltip>
                <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help ml-1" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                    <p className="text-sm">{children}</p>
                </TooltipContent>
            </UITooltip>
        </TooltipProvider>
    );

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6 animate-fade-in">
                <PageHeader
                    title="KPIs de Colaboradores"
                    description="Estatísticas e métricas dos colaboradores da rede"
                    icon={Users}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <Skeleton className="h-24 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <Skeleton className="h-[300px] w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div className="space-y-6 animate-fade-in">
                <PageHeader
                    title="KPIs de Colaboradores"
                    description="Estatísticas e métricas dos colaboradores da rede"
                    icon={Users}
                />
                <Card className="border-destructive">
                    <CardContent className="pt-6 text-center">
                        <p className="text-destructive mb-2">Erro ao carregar KPIs</p>
                        <p className="text-sm text-muted-foreground">
                            {error instanceof Error ? error.message : 'Tente novamente mais tarde'}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!data) return null;

    const completenessPercentage = data.totals.users_total > 0
        ? (data.totals.with_birth_date_total / data.totals.users_total) * 100
        : 0;

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="KPIs de Colaboradores"
                description="Estatísticas e métricas dos colaboradores da rede"
                icon={Users}
            />

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Filter className="w-4 h-4" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Status Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <Select
                                value={filters.active || '1'}
                                onValueChange={(value) => setFilters({ ...filters, active: value as '0' | '1' | 'all' })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Apenas Ativos</SelectItem>
                                    <SelectItem value="0">Apenas Inativos</SelectItem>
                                    <SelectItem value="all">Todos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* State Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Estado</label>
                            <Select
                                value={filters.state || 'all'}
                                onValueChange={(value) => setFilters({ ...filters, state: value === 'all' ? undefined : value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos os estados" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os estados</SelectItem>
                                    {BRAZILIAN_STATES.map((state) => (
                                        <SelectItem key={state.value} value={state.value}>
                                            {state.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* City Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cidade</label>
                            <Input
                                placeholder="Digite a cidade"
                                value={filters.city || ''}
                                onChange={(e) => setFilters({ ...filters, city: e.target.value || undefined })}
                            />
                        </div>

                        {/* Date From Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Data Inicial</label>
                            <Input
                                type="date"
                                value={filters.date_from || ''}
                                onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined })}
                            />
                        </div>

                        {/* Date To Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Data Final</label>
                            <Input
                                type="date"
                                value={filters.date_to || ''}
                                onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined })}
                            />
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {(filters.state || filters.city || filters.date_from || filters.date_to) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                            {filters.state && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                    Estado: {BRAZILIAN_STATES.find(s => s.value === filters.state)?.label}
                                </span>
                            )}
                            {filters.city && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                    Cidade: {filters.city}
                                </span>
                            )}
                            {filters.date_from && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                    De: {formatDate(filters.date_from)}
                                </span>
                            )}
                            {filters.date_to && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                    Até: {formatDate(filters.date_to)}
                                </span>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Colaboradores */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            Total de Colaboradores
                            <InfoTooltip>Total de colaboradores que atendem aos filtros aplicados</InfoTooltip>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{data.totals.users_total}</div>
                        <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                            <UserCheck className="w-3 h-3 text-green-500" />
                            {data.totals.active_total} ativos
                            <UserX className="w-3 h-3 text-red-500 ml-2" />
                            {data.totals.inactive_total} inativos
                        </div>
                    </CardContent>
                </Card>

                {/* Idade Média */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Cake className="w-4 h-4 text-secondary" />
                            Idade Média
                            <InfoTooltip>Idade média dos colaboradores com data de nascimento cadastrada</InfoTooltip>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.age.avg_age_years !== null ? (
                            <>
                                <div className="text-3xl font-bold">{Math.round(Math.abs(data.age.avg_age_years))} anos</div>
                                <div className="text-sm text-muted-foreground mt-2">
                                    Mais novo: {formatAge(data.age.youngest_age_years)} • Mais velho: {formatAge(data.age.oldest_age_years)}
                                </div>
                                <Progress value={completenessPercentage} className="h-1 mt-2" />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {data.age.age_population_total} de {data.totals.users_total} com data de nascimento
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhum colaborador com data de nascimento cadastrada</p>
                        )}
                    </CardContent>
                </Card>

                {/* Tempo Médio de Empresa */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-accent" />
                            Tempo Médio de Empresa
                            <InfoTooltip>Tempo médio de empresa dos colaboradores com data de contratação</InfoTooltip>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.tenure.avg_tenure_months !== null ? (
                            <>
                                <div className="text-3xl font-bold">{formatMonthsToHuman(data.tenure.avg_tenure_months)}</div>
                                <Separator className="my-2" />
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-muted-foreground">Mais antigo</p>
                                        <p className="font-semibold">{formatDaysToHuman(data.tenure.longest_tenure_days)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Mais recente</p>
                                        <p className="font-semibold">{formatDaysToHuman(data.tenure.newest_tenure_days)}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {data.tenure.tenure_population_total} de {data.totals.users_total} com data de contratação
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhum colaborador com data de contratação cadastrada</p>
                        )}
                    </CardContent>
                </Card>

                {/* Completude de Cadastro */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            Completude de Cadastro
                            <InfoTooltip>Percentual de colaboradores com dados completos</InfoTooltip>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{Math.round(completenessPercentage)}%</div>
                        <div className="text-sm text-muted-foreground mt-2">
                            {data.totals.with_birth_date_total} com data de nascimento
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {data.totals.with_hire_date_total} com data de contratação
                        </div>
                        {data.totals.without_city_total > 0 && (
                            <p className="text-xs text-orange-600 mt-2">
                                ⚠️ {data.totals.without_city_total} sem cidade cadastrada
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Pie Chart - Distribution by City */}
                {cityChartData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" />
                                Distribuição por Cidade
                                <InfoTooltip>Distribuição geográfica dos colaboradores por cidade (excluindo sem cidade)</InfoTooltip>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={cityChartData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                                        >
                                            {cityChartData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number, _name: string, props: any) => [
                                                `${value} colaboradores (${props.payload.percentage.toFixed(1)}%)`,
                                                props.payload.name
                                            ]}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Bar Chart - Top 5 Cities */}
                {topCitiesData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                Top {Math.min(5, topCitiesData.length)} Cidades
                                <InfoTooltip>As cidades com mais colaboradores (excluindo sem cidade)</InfoTooltip>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {topCitiesData.map((city, index) => (
                                    <div key={city.city} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium flex items-center gap-2">
                                                <span className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                                    index === 0 && "bg-yellow-500/20 text-yellow-600",
                                                    index === 1 && "bg-gray-400/20 text-gray-600",
                                                    index === 2 && "bg-amber-600/20 text-amber-700",
                                                    index > 2 && "bg-primary/10 text-primary"
                                                )}>
                                                    {index + 1}
                                                </span>
                                                {city.city}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {city.qty} ({city.pct.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <Progress value={city.pct} className="h-2" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Empty State */}
            {data.totals.users_total === 0 && (
                <Card>
                    <CardContent className="pt-6 text-center">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-semibold mb-2">Nenhum colaborador encontrado</p>
                        <p className="text-sm text-muted-foreground">
                            Tente ajustar os filtros para visualizar os dados
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default KpisColaboradores;
