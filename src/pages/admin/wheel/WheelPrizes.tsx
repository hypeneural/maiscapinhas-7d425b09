/**
 * Wheel Prizes Page
 * 
 * Prize catalog management.
 * Super Admin only.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
    Pencil,
    Trash2,
    ToggleLeft,
    ToggleRight,
    ArrowLeft,
    Award,
    Gift,
    Ticket,
    RefreshCw,
    X,
} from 'lucide-react';
import {
    useWheelPrizes,
    useCreatePrize,
    useTogglePrize,
    useDeletePrize,
} from '@/hooks/api/use-wheel';
import { useToast } from '@/hooks/use-toast';
import type { PrizeType, CreatePrizePayload, WheelPrize } from '@/types/wheel.types';
import { EditPrizeDialog } from './components/WheelEditDialogs';

const PRIZE_TYPE_CONFIG: Record<PrizeType, { label: string; icon: React.ReactNode; color: string }> = {
    product: { label: 'Produto', icon: <Gift className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600' },
    coupon: { label: 'Cupom', icon: <Ticket className="h-4 w-4" />, color: 'bg-green-500/10 text-green-600' },
    nothing: { label: 'Nada', icon: <X className="h-4 w-4" />, color: 'bg-gray-500/10 text-gray-600' },
    try_again: { label: 'Tente Novamente', icon: <RefreshCw className="h-4 w-4" />, color: 'bg-yellow-500/10 text-yellow-600' },
};

function PrizeTypeBadge({ type }: { type: PrizeType }) {
    const config = PRIZE_TYPE_CONFIG[type] || PRIZE_TYPE_CONFIG.product;

    return (
        <Badge variant="outline" className={config.color}>
            {config.icon}
            <span className="ml-1">{config.label}</span>
        </Badge>
    );
}

export default function WheelPrizes() {
    const { toast } = useToast();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newPrize, setNewPrize] = useState<Partial<CreatePrizePayload>>({
        name: '',
        type: 'product',
        icon: '🎁',
        active: true,
    });
    const [editingPrize, setEditingPrize] = useState<WheelPrize | null>(null);

    const { data: prizesData, isLoading } = useWheelPrizes({
        search: search || undefined,
        type: typeFilter !== 'all' ? typeFilter as PrizeType : undefined,
    });

    const createPrize = useCreatePrize();
    const togglePrize = useTogglePrize();
    const deletePrize = useDeletePrize();

    const prizes = prizesData?.data || [];

    const handleCreatePrize = async () => {
        if (!newPrize.name || !newPrize.type) {
            toast({
                title: 'Erro',
                description: 'Preencha os campos obrigatórios.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await createPrize.mutateAsync(newPrize as CreatePrizePayload);
            setCreateDialogOpen(false);
            setNewPrize({ name: '', type: 'product', icon: '🎁', active: true });
            toast({
                title: 'Prêmio criado',
                description: 'O prêmio foi adicionado ao catálogo.',
            });
        } catch {
            toast({
                title: 'Erro',
                description: 'Não foi possível criar o prêmio.',
                variant: 'destructive',
            });
        }
    };

    const handleToggle = async (prizeKey: string) => {
        try {
            await togglePrize.mutateAsync(prizeKey);
            toast({ title: 'Status alterado', description: 'O status do prêmio foi atualizado.' });
        } catch {
            toast({ title: 'Erro', description: 'Não foi possível alterar o status.', variant: 'destructive' });
        }
    };

    const handleDelete = async (prizeKey: string) => {
        if (!confirm('Tem certeza que deseja excluir este prêmio? Segmentos vinculados serão afetados.')) return;
        try {
            await deletePrize.mutateAsync(prizeKey);
            toast({ title: 'Prêmio excluído', description: 'O prêmio foi removido.' });
        } catch {
            toast({ title: 'Erro', description: 'Não foi possível excluir o prêmio.', variant: 'destructive' });
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
                    <h1 className="text-3xl font-bold tracking-tight">Prêmios</h1>
                    <p className="text-muted-foreground">
                        Catálogo de prêmios disponíveis para as roletas
                    </p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Prêmio
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Novo Prêmio</DialogTitle>
                            <DialogDescription>
                                Adicione um novo prêmio ao catálogo.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome *</Label>
                                <Input
                                    placeholder="Ex: Película Premium"
                                    value={newPrize.name || ''}
                                    onChange={(e) => setNewPrize({ ...newPrize, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo *</Label>
                                <Select
                                    value={newPrize.type || 'product'}
                                    onValueChange={(value) => setNewPrize({ ...newPrize, type: value as PrizeType })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="product">🎁 Produto</SelectItem>
                                        <SelectItem value="coupon">🎟️ Cupom</SelectItem>
                                        <SelectItem value="nothing">😢 Nada</SelectItem>
                                        <SelectItem value="try_again">🔄 Tente Novamente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Ícone (emoji ou slug)</Label>
                                <Input
                                    placeholder="🎁"
                                    value={newPrize.icon || ''}
                                    onChange={(e) => setNewPrize({ ...newPrize, icon: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Textarea
                                    placeholder="Película de vidro premium..."
                                    value={newPrize.description || ''}
                                    onChange={(e) => setNewPrize({ ...newPrize, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Instruções de Resgate</Label>
                                <Textarea
                                    placeholder="Apresente este código no caixa..."
                                    value={newPrize.redeem_instructions || ''}
                                    onChange={(e) => setNewPrize({ ...newPrize, redeem_instructions: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Exibido ao vencedor após o giro
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Prefixo do Código</Label>
                                <Input
                                    placeholder="MC-"
                                    value={newPrize.code_prefix || ''}
                                    onChange={(e) => setNewPrize({ ...newPrize, code_prefix: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Ex: MC-A1B2C3 (gerado automaticamente)
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleCreatePrize} disabled={createPrize.isPending}>
                                {createPrize.isPending ? 'Criando...' : 'Criar Prêmio'}
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
                                    placeholder="Buscar prêmios..."
                                    className="pl-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os tipos</SelectItem>
                                <SelectItem value="product">Produto</SelectItem>
                                <SelectItem value="coupon">Cupom</SelectItem>
                                <SelectItem value="nothing">Nada</SelectItem>
                                <SelectItem value="try_again">Tente Novamente</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Catálogo de Prêmios</CardTitle>
                    <CardDescription>
                        {prizes.length} {prizes.length === 1 ? 'prêmio cadastrado' : 'prêmios cadastrados'}
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
                    ) : prizes.length === 0 ? (
                        <div className="text-center py-12">
                            <Award className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-lg font-medium">Nenhum prêmio encontrado</p>
                            <p className="text-muted-foreground">
                                {search || typeFilter !== 'all'
                                    ? 'Tente ajustar os filtros.'
                                    : 'Adicione o primeiro prêmio ao catálogo.'}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Ícone</TableHead>
                                    <TableHead>Uso</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {prizes.map((prize) => (
                                    <TableRow key={prize.id}>
                                        <TableCell>
                                            <PrizeTypeBadge type={prize.type} />
                                        </TableCell>
                                        <TableCell className="font-medium">{prize.name}</TableCell>
                                        <TableCell>
                                            <span className="text-xl">{prize.icon || '-'}</span>
                                        </TableCell>
                                        <TableCell>
                                            {prize.segments_count !== undefined ? (
                                                <span>{prize.segments_count} segmentos</span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {prize.active ? (
                                                <Badge className="bg-green-500/10 text-green-600">Ativo</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setEditingPrize(prize)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggle(prize.prize_key)}>
                                                        {prize.active ? (
                                                            <>
                                                                <ToggleLeft className="mr-2 h-4 w-4" />
                                                                Desativar
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ToggleRight className="mr-2 h-4 w-4" />
                                                                Ativar
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(prize.prize_key)}
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

            {/* Edit Prize Dialog */}
            <EditPrizeDialog
                prize={editingPrize}
                open={!!editingPrize}
                onOpenChange={(open) => !open && setEditingPrize(null)}
            />
        </div>
    );
}
