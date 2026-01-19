/**
 * Celebrations Page
 * 
 * List of birthdays and work anniversaries with filters and stats.
 */

import React, { useState } from 'react';
import {
    Cake,
    PartyPopper,
    CalendarDays,
    Users,
    Clock,
    Sparkles,
    Filter,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { PageHeader } from '@/components/PageHeader';
import { Loader2 } from 'lucide-react';
import { useCelebrations } from '@/hooks/api/use-celebrations';
import { cn } from '@/lib/utils';
import type { CelebrationsParams, CelebrationType, CelebrationStatus } from '@/types/celebrations.types';

const Celebrations: React.FC = () => {
    const [params, setParams] = useState<CelebrationsParams>({
        per_page: 25,
        page: 1,
        sort: 'days_until',
        direction: 'asc',
    });

    const { data, isLoading, error } = useCelebrations(params);

    const updateParams = (newParams: Partial<CelebrationsParams>) => {
        setParams((prev) => ({ ...prev, ...newParams, page: 1 }));
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    };

    const getTypeIcon = (type: CelebrationType) => {
        return type === 'birthday' ? (
            <Cake className="h-4 w-4 text-pink-500" />
        ) : (
            <PartyPopper className="h-4 w-4 text-primary" />
        );
    };

    const getStatusBadge = (status: CelebrationStatus, label: string) => {
        const variants: Record<CelebrationStatus, string> = {
            today: 'bg-green-500/10 text-green-600 border-green-500/30',
            this_week: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
            this_month: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
            upcoming: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
        };

        return (
            <Badge variant="outline" className={cn('border', variants[status])}>
                {label}
            </Badge>
        );
    };

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-destructive">Erro ao carregar comemorações</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Comemorações"
                description="Aniversários e tempo de empresa dos colaboradores"
                icon={PartyPopper}
            />

            {/* Stats Cards */}
            {data?.summary && (
                <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.summary.total}</div>
                            <p className="text-xs text-muted-foreground">este mês</p>
                        </CardContent>
                    </Card>
                    <Card className="border-green-500/30 bg-green-500/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-green-600">Hoje</CardTitle>
                            <Sparkles className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{data.summary.today}</div>
                            <p className="text-xs text-muted-foreground">celebrando agora</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.summary.this_week}</div>
                            <p className="text-xs text-muted-foreground">próximos 7 dias</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Aniversários</CardTitle>
                            <Cake className="h-4 w-4 text-pink-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-pink-500">{data.summary.birthdays}</div>
                            <p className="text-xs text-muted-foreground">neste mês</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tempo de Empresa</CardTitle>
                            <PartyPopper className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{data.summary.work_anniversaries}</div>
                            <p className="text-xs text-muted-foreground">neste mês</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Filter className="h-4 w-4" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <Input
                            placeholder="Buscar por nome..."
                            value={params.keyword || ''}
                            onChange={(e) => updateParams({ keyword: e.target.value || undefined })}
                        />
                        <Select
                            value={params.type || 'all'}
                            onValueChange={(v) => updateParams({ type: v === 'all' ? undefined : v as CelebrationType })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os tipos</SelectItem>
                                {data?.filters?.types.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={params.status || 'all'}
                            onValueChange={(v) => updateParams({ status: v === 'all' ? undefined : v as CelebrationStatus })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {data?.filters?.statuses.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={params.store_id?.toString() || 'all'}
                            onValueChange={(v) => updateParams({ store_id: v === 'all' ? undefined : parseInt(v) })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Loja" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as lojas</SelectItem>
                                {data?.filters?.stores.map((s) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        Próximas Comemorações
                    </CardTitle>
                    <CardDescription>
                        {data?.meta.total || 0} celebrações encontradas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Colaborador</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Loja</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Quando</TableHead>
                                    <TableHead>Tempo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Nenhuma comemoração encontrada
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data?.data.map((celebration) => (
                                        <TableRow
                                            key={celebration.id}
                                            className={cn(
                                                celebration.is_today && 'bg-green-500/5 border-green-500/30'
                                            )}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={celebration.avatar_url || undefined} />
                                                        <AvatarFallback className={cn(
                                                            celebration.type === 'birthday'
                                                                ? 'bg-pink-500/10 text-pink-600'
                                                                : 'bg-primary/10 text-primary'
                                                        )}>
                                                            {getInitials(celebration.user_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{celebration.user_name}</p>
                                                        {celebration.is_today && (
                                                            <p className="text-xs text-green-600 flex items-center gap-1">
                                                                <Sparkles className="h-3 w-3" />
                                                                Celebrando hoje!
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getTypeIcon(celebration.type)}
                                                    <span className="text-sm">{celebration.type_label}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{celebration.store_name}</TableCell>
                                            <TableCell>
                                                <span className="font-mono text-sm">
                                                    {celebration.day.toString().padStart(2, '0')}/
                                                    {celebration.month.toString().padStart(2, '0')}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(celebration.status, celebration.status_label)}
                                            </TableCell>
                                            <TableCell>
                                                {celebration.years_label || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}

                    {/* Pagination */}
                    {data && data.meta.last_page > 1 && (
                        <div className="flex items-center justify-between pt-4">
                            <p className="text-sm text-muted-foreground">
                                Página {data.meta.current_page} de {data.meta.last_page}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={data.meta.current_page === 1}
                                    onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) - 1 }))}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={data.meta.current_page === data.meta.last_page}
                                    onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) + 1 }))}
                                >
                                    Próxima
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Celebrations;
