/**
 * Wheel Screens Page
 * 
 * List and management of TV screens.
 * Super Admin only.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    RefreshCw,
    ArrowLeft,
    Copy,
    CheckCircle,
    AlertTriangle,
    Tv,
} from 'lucide-react';
import { useWheelScreens, useCreateScreen, useDeleteScreen, useRotateScreenSecret } from '@/hooks/api/use-wheel';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import { useToast } from '@/hooks/use-toast';
import type { ScreenStatus, CreateScreenPayload, WheelScreen } from '@/types/wheel.types';
import { EditScreenDialog } from './components/WheelEditDialogs';

function StatusBadge({ isOnline, status }: { isOnline: boolean; status: ScreenStatus }) {
    if (status === 'maintenance') {
        return (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                🟡 Manutenção
            </Badge>
        );
    }
    if (status === 'inactive') {
        return (
            <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                ⚫ Inativo
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

interface TokenModalProps {
    token: string | null;
    onClose: () => void;
}

function TokenModal({ token, onClose }: TokenModalProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (token) {
            await navigator.clipboard.writeText(token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Dialog open={!!token} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Token de Autenticação
                    </DialogTitle>
                    <DialogDescription>
                        <strong>ATENÇÃO:</strong> Salve este token agora! Ele não será exibido novamente.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
                        {token}
                    </div>
                    <Button onClick={handleCopy} className="w-full" variant="outline">
                        {copied ? (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                Copiado!
                            </>
                        ) : (
                            <>
                                <Copy className="mr-2 h-4 w-4" />
                                Copiar Token
                            </>
                        )}
                    </Button>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Entendi</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function WheelScreens() {
    const { toast } = useToast();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [storeFilter, setStoreFilter] = useState<string>('all');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [revealedToken, setRevealedToken] = useState<string | null>(null);
    const [editingScreen, setEditingScreen] = useState<WheelScreen | null>(null);
    const [newScreen, setNewScreen] = useState<Partial<CreateScreenPayload>>({
        name: '',
        store_id: undefined,
        status: 'active',
    });

    const { data: screensData, isLoading } = useWheelScreens({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter as ScreenStatus : undefined,
        store_id: storeFilter !== 'all' ? Number(storeFilter) : undefined,
    });

    const { data: storesData } = useAdminStores();
    const createScreen = useCreateScreen();
    const deleteScreen = useDeleteScreen();
    const rotateSecret = useRotateScreenSecret();

    const screens = screensData?.data || [];
    const stores = storesData?.data || [];

    const handleCreateScreen = async () => {
        if (!newScreen.name || !newScreen.store_id) {
            toast({
                title: 'Erro',
                description: 'Preencha todos os campos obrigatórios.',
                variant: 'destructive',
            });
            return;
        }

        try {
            const result = await createScreen.mutateAsync(newScreen as CreateScreenPayload);
            setRevealedToken(result.data.token);
            setCreateDialogOpen(false);
            setNewScreen({ name: '', store_id: undefined, status: 'active' });
            toast({
                title: 'TV criada',
                description: 'A TV foi cadastrada com sucesso. Copie o token!',
            });
        } catch {
            toast({
                title: 'Erro',
                description: 'Não foi possível criar a TV.',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteScreen = async (screenKey: string) => {
        if (!confirm('Tem certeza que deseja excluir esta TV?')) return;

        try {
            await deleteScreen.mutateAsync(screenKey);
            toast({
                title: 'TV excluída',
                description: 'A TV foi removida com sucesso.',
            });
        } catch {
            toast({
                title: 'Erro',
                description: 'Não foi possível excluir a TV.',
                variant: 'destructive',
            });
        }
    };

    const handleRotateSecret = async (screenKey: string) => {
        if (!confirm('O token atual será invalidado. A TV precisará ser reconfigurada. Continuar?')) return;

        try {
            const result = await rotateSecret.mutateAsync(screenKey);
            setRevealedToken(result.data.token);
            toast({
                title: 'Token regenerado',
                description: 'O novo token foi gerado. Copie-o agora!',
            });
        } catch {
            toast({
                title: 'Erro',
                description: 'Não foi possível regenerar o token.',
                variant: 'destructive',
            });
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
                    <h1 className="text-3xl font-bold tracking-tight">TVs / Totens</h1>
                    <p className="text-muted-foreground">
                        Gerencie os dispositivos que exibem a roleta nas vitrines
                    </p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova TV
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nova TV</DialogTitle>
                            <DialogDescription>
                                Cadastre um novo dispositivo para exibir a roleta.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="store">Loja *</Label>
                                <Select
                                    value={newScreen.store_id?.toString() || ''}
                                    onValueChange={(value) => setNewScreen({ ...newScreen, store_id: Number(value) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a loja" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stores.map((store) => (
                                            <SelectItem key={store.id} value={store.id.toString()}>
                                                {store.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome *</Label>
                                <Input
                                    id="name"
                                    placeholder="Ex: Vitrine 01"
                                    value={newScreen.name || ''}
                                    onChange={(e) => setNewScreen({ ...newScreen, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="screen_key">Chave (opcional)</Label>
                                <Input
                                    id="screen_key"
                                    placeholder="screen-tijucas-001"
                                    value={newScreen.screen_key || ''}
                                    onChange={(e) => setNewScreen({ ...newScreen, screen_key: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Gerada automaticamente se deixada em branco.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={newScreen.status || 'active'}
                                    onValueChange={(value) => setNewScreen({ ...newScreen, status: value as ScreenStatus })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Ativa</SelectItem>
                                        <SelectItem value="inactive">Inativa</SelectItem>
                                        <SelectItem value="maintenance">Manutenção</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleCreateScreen} disabled={createScreen.isPending}>
                                {createScreen.isPending ? 'Criando...' : 'Criar TV'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nome ou chave..."
                                    className="pl-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <Select value={storeFilter} onValueChange={setStoreFilter}>
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
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="active">Ativas</SelectItem>
                                <SelectItem value="inactive">Inativas</SelectItem>
                                <SelectItem value="maintenance">Manutenção</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de TVs</CardTitle>
                    <CardDescription>
                        {screens.length} {screens.length === 1 ? 'dispositivo cadastrado' : 'dispositivos cadastrados'}
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
                    ) : screens.length === 0 ? (
                        <div className="text-center py-12">
                            <Tv className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-lg font-medium">Nenhuma TV encontrada</p>
                            <p className="text-muted-foreground">
                                {search || statusFilter !== 'all' || storeFilter !== 'all'
                                    ? 'Tente ajustar os filtros.'
                                    : 'Cadastre o primeiro dispositivo para começar.'}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Chave</TableHead>
                                    <TableHead>Loja</TableHead>
                                    <TableHead>Campanha Ativa</TableHead>
                                    <TableHead>Último Heartbeat</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {screens.map((screen) => (
                                    <TableRow key={screen.id}>
                                        <TableCell>
                                            <StatusBadge isOnline={screen.is_online} status={screen.status} />
                                        </TableCell>
                                        <TableCell className="font-medium">{screen.name}</TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-muted px-2 py-1 rounded">
                                                {screen.screen_key}
                                            </code>
                                        </TableCell>
                                        <TableCell>{screen.store?.name || '-'}</TableCell>
                                        <TableCell>
                                            {screen.active_campaign ? (
                                                <Badge variant="secondary">{screen.active_campaign.name}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {screen.last_seen_ago || 'Nunca'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link to={`/admin/wheel/screens/${screen.screen_key}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Ver Detalhes
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setEditingScreen(screen)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleRotateSecret(screen.screen_key)}>
                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                        Gerar Novo Token
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteScreen(screen.screen_key)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Excluir
                                                    </DropdownMenuItem>
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

            {/* Token Reveal Modal */}
            <TokenModal token={revealedToken} onClose={() => setRevealedToken(null)} />

            {/* Edit Screen Dialog */}
            <EditScreenDialog
                screen={editingScreen}
                open={!!editingScreen}
                onOpenChange={(open) => !open && setEditingScreen(null)}
            />
        </div>
    );
}
