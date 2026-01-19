/**
 * Wheel Players Page
 * 
 * List and management of players who participated in the wheel game.
 * Super Admin only.
 */

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
    Search,
    Users,
    CheckCircle2,
    MapPin,
    Building2,
    RotateCw,
    Download,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useWheelPlayers } from '@/hooks/api/use-wheel';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import { useWheelCampaigns } from '@/hooks/api/use-wheel';
import { useDebounce } from '@/hooks/use-debounce';
import type { PlayerFilters, WheelPlayer } from '@/types/wheel.types';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    loading?: boolean;
    color?: string;
}

function StatCard({ title, value, icon, loading, color = 'bg-primary' }: StatCardProps) {
    if (loading) {
        return (
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-6 w-12" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-lg" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${color}`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function VerifiedBadge({ verified }: { verified: boolean }) {
    return verified ? (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verificado
        </Badge>
    ) : (
        <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">
            Pendente
        </Badge>
    );
}

function formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `Há ${diffMinutes} min`;
    }
    if (diffHours < 24) {
        return `Há ${Math.floor(diffHours)}h`;
    }
    if (diffHours < 48) {
        return 'Ontem';
    }
    return date.toLocaleDateString('pt-BR');
}

export default function WheelPlayers() {
    const navigate = useNavigate();

    // Filter state
    const [search, setSearch] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [storeFilter, setStoreFilter] = useState<string>('all');
    const [campaignFilter, setCampaignFilter] = useState<string>('all');
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [hasAddress, setHasAddress] = useState(false);
    const [hasSpins, setHasSpins] = useState(false);
    const [page, setPage] = useState(1);
    const perPage = 20;

    const debouncedSearch = useDebounce(search, 300);
    const debouncedCity = useDebounce(cityFilter, 300);

    // Build filters object
    const filters: PlayerFilters = useMemo(() => ({
        search: debouncedSearch || undefined,
        city: debouncedCity || undefined,
        store_id: storeFilter !== 'all' ? Number(storeFilter) : undefined,
        campaign_id: campaignFilter !== 'all' ? Number(campaignFilter) : undefined,
        verified_only: verifiedOnly || undefined,
        has_address: hasAddress || undefined,
        has_spins: hasSpins || undefined,
        page,
        per_page: perPage,
    }), [debouncedSearch, debouncedCity, storeFilter, campaignFilter, verifiedOnly, hasAddress, hasSpins, page]);

    // Queries
    const { data: playersData, isLoading } = useWheelPlayers(filters);
    const { data: storesData } = useAdminStores();
    const { data: campaignsData } = useWheelCampaigns();

    const players = playersData?.data || [];
    const stats = playersData?.stats;
    const meta = playersData?.meta;
    const stores = storesData?.data || [];
    const campaigns = campaignsData?.data || [];

    const handleRowClick = (player: WheelPlayer) => {
        navigate(`/admin/wheel/players/${player.player_key}`);
    };

    const handleExport = () => {
        // TODO: Implement export functionality
        console.log('Export players with filters:', filters);
    };

    const totalPages = meta?.last_page || 1;

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
                    <h1 className="text-3xl font-bold tracking-tight">Jogadores</h1>
                    <p className="text-muted-foreground">
                        Gerencie os jogadores que participaram da roleta
                    </p>
                </div>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                    title="Total de Jogadores"
                    value={stats?.total ?? '-'}
                    icon={<Users className="h-5 w-5 text-white" />}
                    loading={isLoading}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Verificados"
                    value={stats?.verified ?? '-'}
                    icon={<CheckCircle2 className="h-5 w-5 text-white" />}
                    loading={isLoading}
                    color="bg-green-500"
                />
                <StatCard
                    title="Com Endereço"
                    value={stats?.with_address ?? '-'}
                    icon={<MapPin className="h-5 w-5 text-white" />}
                    loading={isLoading}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Cidades"
                    value={stats?.cities ?? '-'}
                    icon={<Building2 className="h-5 w-5 text-white" />}
                    loading={isLoading}
                    color="bg-amber-500"
                />
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Nome, telefone, player_key..."
                                        className="pl-9"
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="w-[150px]">
                                <Input
                                    placeholder="Cidade"
                                    value={cityFilter}
                                    onChange={(e) => {
                                        setCityFilter(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>
                            <Select value={storeFilter} onValueChange={(v) => { setStoreFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Loja" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as lojas</SelectItem>
                                    {stores.map((store) => (
                                        <SelectItem key={store.id} value={store.id.toString()}>
                                            {store.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={campaignFilter} onValueChange={(v) => { setCampaignFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Campanha" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as campanhas</SelectItem>
                                    {campaigns.map((campaign) => (
                                        <SelectItem key={campaign.id} value={campaign.id.toString()}>
                                            {campaign.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="verified"
                                    checked={verifiedOnly}
                                    onCheckedChange={(checked) => {
                                        setVerifiedOnly(checked === true);
                                        setPage(1);
                                    }}
                                />
                                <Label htmlFor="verified" className="text-sm cursor-pointer">
                                    Apenas verificados
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="hasAddress"
                                    checked={hasAddress}
                                    onCheckedChange={(checked) => {
                                        setHasAddress(checked === true);
                                        setPage(1);
                                    }}
                                />
                                <Label htmlFor="hasAddress" className="text-sm cursor-pointer">
                                    Com endereço
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="hasSpins"
                                    checked={hasSpins}
                                    onCheckedChange={(checked) => {
                                        setHasSpins(checked === true);
                                        setPage(1);
                                    }}
                                />
                                <Label htmlFor="hasSpins" className="text-sm cursor-pointer">
                                    Com giros
                                </Label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Jogadores</CardTitle>
                    <CardDescription>
                        {meta?.total ?? 0} {(meta?.total ?? 0) === 1 ? 'jogador encontrado' : 'jogadores encontrados'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                    <Skeleton className="h-6 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : players.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-lg font-medium">Nenhum jogador encontrado</p>
                            <p className="text-muted-foreground">
                                Tente ajustar os filtros de busca.
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Telefone</TableHead>
                                        <TableHead>Cidade/UF</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-center">Giros</TableHead>
                                        <TableHead>Última Sessão</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {players.map((player) => (
                                        <TableRow
                                            key={player.id}
                                            className="cursor-pointer hover:bg-accent/50"
                                            onClick={() => handleRowClick(player)}
                                        >
                                            <TableCell className="font-medium">
                                                {player.full_name || <span className="text-muted-foreground">-</span>}
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                                    {player.phone_masked}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                {player.address.city && player.address.state ? (
                                                    <span>{player.address.city}/{player.address.state}</span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <VerifiedBadge verified={player.whatsapp_confirmed} />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <RotateCw className="h-3 w-3 text-muted-foreground" />
                                                    <span>{player.spins_count}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {player.last_session ? (
                                                    <div>
                                                        <p className="text-sm">{formatDate(player.last_session.joined_at)}</p>
                                                        <p className="text-xs text-muted-foreground">{player.last_session.store}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Página {page} de {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Anterior
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                        >
                                            Próxima
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
