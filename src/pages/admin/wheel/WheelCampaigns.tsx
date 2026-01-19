/**
 * Wheel Campaigns Page
 * 
 * List and management of campaigns.
 * Super Admin only.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Plus,
    Search,
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    Play,
    Pause,
    Square,
    Copy,
    ArrowLeft,
    Gift,
    Layers,
} from 'lucide-react';
import {
    useWheelCampaigns,
    useCreateCampaign,
    useActivateCampaign,
    usePauseCampaign,
    useEndCampaign,
    useDeleteCampaign,
} from '@/hooks/api/use-wheel';
import { useToast } from '@/hooks/use-toast';
import type { CampaignStatus, CreateCampaignPayload, WheelCampaign } from '@/types/wheel.types';
import { EditCampaignDialog, DuplicateCampaignDialog } from './components/WheelEditDialogs';

function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
    const config = {
        draft: { label: 'Rascunho', className: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: '⚪' },
        active: { label: 'Ativa', className: 'bg-green-500/10 text-green-600 border-green-500/20', icon: '🟢' },
        paused: { label: 'Pausada', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: '🟡' },
        ended: { label: 'Encerrada', className: 'bg-red-500/10 text-red-600 border-red-500/20', icon: '🔴' },
    };

    const { label, className, icon } = config[status] || config.draft;

    return (
        <Badge variant="outline" className={className}>
            {icon} {label}
        </Badge>
    );
}

export default function WheelCampaigns() {
    const { toast } = useToast();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newCampaign, setNewCampaign] = useState<Partial<CreateCampaignPayload>>({
        name: '',
    });
    const [editingCampaign, setEditingCampaign] = useState<WheelCampaign | null>(null);
    const [duplicatingCampaign, setDuplicatingCampaign] = useState<WheelCampaign | null>(null);

    const { data: campaignsData, isLoading } = useWheelCampaigns({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter as CampaignStatus : undefined,
    });

    const createCampaign = useCreateCampaign();
    const activateCampaign = useActivateCampaign();
    const pauseCampaign = usePauseCampaign();
    const endCampaign = useEndCampaign();
    const deleteCampaign = useDeleteCampaign();

    const campaigns = campaignsData?.data || [];

    const handleCreateCampaign = async () => {
        if (!newCampaign.name) {
            toast({
                title: 'Erro',
                description: 'O nome da campanha é obrigatório.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await createCampaign.mutateAsync(newCampaign as CreateCampaignPayload);
            setCreateDialogOpen(false);
            setNewCampaign({ name: '' });
            toast({
                title: 'Campanha criada',
                description: 'A campanha foi criada com sucesso.',
            });
        } catch {
            toast({
                title: 'Erro',
                description: 'Não foi possível criar a campanha.',
                variant: 'destructive',
            });
        }
    };

    const handleActivate = async (campaignKey: string) => {
        try {
            await activateCampaign.mutateAsync(campaignKey);
            toast({ title: 'Campanha ativada', description: 'A campanha está agora ativa.' });
        } catch {
            toast({ title: 'Erro', description: 'Não foi possível ativar a campanha.', variant: 'destructive' });
        }
    };

    const handlePause = async (campaignKey: string) => {
        try {
            await pauseCampaign.mutateAsync(campaignKey);
            toast({ title: 'Campanha pausada', description: 'A campanha foi pausada.' });
        } catch {
            toast({ title: 'Erro', description: 'Não foi possível pausar a campanha.', variant: 'destructive' });
        }
    };

    const handleEnd = async (campaignKey: string) => {
        if (!confirm('Tem certeza que deseja encerrar esta campanha? Esta ação não pode ser desfeita.')) return;
        try {
            await endCampaign.mutateAsync(campaignKey);
            toast({ title: 'Campanha encerrada', description: 'A campanha foi encerrada permanentemente.' });
        } catch {
            toast({ title: 'Erro', description: 'Não foi possível encerrar a campanha.', variant: 'destructive' });
        }
    };

    const handleDelete = async (campaignKey: string) => {
        if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;
        try {
            await deleteCampaign.mutateAsync(campaignKey);
            toast({ title: 'Campanha excluída', description: 'A campanha foi removida.' });
        } catch {
            toast({ title: 'Erro', description: 'Não foi possível excluir a campanha.', variant: 'destructive' });
        }
    };

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
                    <h1 className="text-3xl font-bold tracking-tight">Campanhas</h1>
                    <p className="text-muted-foreground">
                        Gerencie as campanhas de roleta para as TVs
                    </p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Campanha
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Nova Campanha</DialogTitle>
                            <DialogDescription>
                                Crie uma nova campanha de roleta. Você poderá configurar os segmentos após a criação.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome da Campanha *</Label>
                                <Input
                                    id="name"
                                    placeholder="Ex: Campanha Verão 2026"
                                    value={newCampaign.name || ''}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="starts_at">Data Início (opcional)</Label>
                                    <Input
                                        id="starts_at"
                                        type="date"
                                        value={newCampaign.starts_at || ''}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, starts_at: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ends_at">Data Fim (opcional)</Label>
                                    <Input
                                        id="ends_at"
                                        type="date"
                                        value={newCampaign.ends_at || ''}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, ends_at: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="campaign_key">Chave (opcional)</Label>
                                <Input
                                    id="campaign_key"
                                    placeholder="camp_2026_verao"
                                    value={newCampaign.campaign_key || ''}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, campaign_key: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Identificador único, gerado automaticamente se vazio.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleCreateCampaign} disabled={createCampaign.isPending}>
                                {createCampaign.isPending ? 'Criando...' : 'Criar Campanha'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar campanhas..."
                                    className="pl-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                            <TabsList>
                                <TabsTrigger value="all">Todas</TabsTrigger>
                                <TabsTrigger value="active">Ativas</TabsTrigger>
                                <TabsTrigger value="paused">Pausadas</TabsTrigger>
                                <TabsTrigger value="draft">Rascunhos</TabsTrigger>
                                <TabsTrigger value="ended">Encerradas</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Campanhas</CardTitle>
                    <CardDescription>
                        {campaigns.length} {campaigns.length === 1 ? 'campanha cadastrada' : 'campanhas cadastradas'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <Skeleton className="h-10 w-10 rounded" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                    <Skeleton className="h-6 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="text-center py-12">
                            <Gift className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-lg font-medium">Nenhuma campanha encontrada</p>
                            <p className="text-muted-foreground">
                                {search || statusFilter !== 'all'
                                    ? 'Tente ajustar os filtros.'
                                    : 'Crie a primeira campanha para começar.'}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Período</TableHead>
                                    <TableHead>TVs</TableHead>
                                    <TableHead>Segmentos</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.map((campaign) => (
                                    <TableRow key={campaign.id}>
                                        <TableCell>
                                            <CampaignStatusBadge status={campaign.status} />
                                        </TableCell>
                                        <TableCell className="font-medium">{campaign.name}</TableCell>
                                        <TableCell>
                                            {campaign.starts_at || campaign.ends_at ? (
                                                <span className="text-sm">
                                                    {campaign.starts_at ? new Date(campaign.starts_at).toLocaleDateString('pt-BR') : '?'}
                                                    {' - '}
                                                    {campaign.ends_at ? new Date(campaign.ends_at).toLocaleDateString('pt-BR') : '∞'}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">Sem limite</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{campaign.screens_count ?? '-'}</TableCell>
                                        <TableCell>{campaign.active_segments_count ?? '-'}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link to={`/admin/wheel/campaigns/${campaign.campaign_key}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Ver Detalhes
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link to={`/admin/wheel/campaigns/${campaign.campaign_key}/segments`}>
                                                            <Layers className="mr-2 h-4 w-4" />
                                                            Configurar Roleta
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setEditingCampaign(campaign)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {campaign.can_activate && (
                                                        <DropdownMenuItem onClick={() => handleActivate(campaign.campaign_key)}>
                                                            <Play className="mr-2 h-4 w-4" />
                                                            Ativar
                                                        </DropdownMenuItem>
                                                    )}
                                                    {campaign.can_pause && (
                                                        <DropdownMenuItem onClick={() => handlePause(campaign.campaign_key)}>
                                                            <Pause className="mr-2 h-4 w-4" />
                                                            Pausar
                                                        </DropdownMenuItem>
                                                    )}
                                                    {campaign.can_end && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleEnd(campaign.campaign_key)}
                                                            className="text-destructive"
                                                        >
                                                            <Square className="mr-2 h-4 w-4" />
                                                            Encerrar
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => setDuplicatingCampaign(campaign)}>
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        Duplicar
                                                    </DropdownMenuItem>
                                                    {campaign.status === 'draft' && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(campaign.campaign_key)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Campaign Dialog */}
            <EditCampaignDialog
                campaign={editingCampaign}
                open={!!editingCampaign}
                onOpenChange={(open) => !open && setEditingCampaign(null)}
            />

            {/* Duplicate Campaign Dialog */}
            <DuplicateCampaignDialog
                campaign={duplicatingCampaign}
                open={!!duplicatingCampaign}
                onOpenChange={(open) => !open && setDuplicatingCampaign(null)}
            />
        </div>
    );
}
