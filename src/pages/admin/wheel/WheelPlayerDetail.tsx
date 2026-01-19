/**
 * Wheel Player Detail Page
 * 
 * Detailed view of a single player including stats and timeline.
 * Super Admin only.
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    ArrowLeft,
    User,
    Phone,
    MapPin,
    CheckCircle2,
    Clock,
    RotateCw,
    Award,
    Store,
    Calendar,
    Pencil,
    Gift,
} from 'lucide-react';
import { useWheelPlayer, useUpdatePlayer } from '@/hooks/api/use-wheel';
import { useToast } from '@/hooks/use-toast';
import type { WheelPlayer, UpdatePlayerPayload } from '@/types/wheel.types';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    loading?: boolean;
}

function StatCard({ title, value, icon, loading }: StatCardProps) {
    if (loading) {
        return (
            <div className="text-center p-4">
                <Skeleton className="h-8 w-12 mx-auto mb-2" />
                <Skeleton className="h-4 w-16 mx-auto" />
            </div>
        );
    }

    return (
        <div className="text-center p-4">
            <div className="flex justify-center mb-2 text-muted-foreground">
                {icon}
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
        </div>
    );
}

interface EditPlayerDialogProps {
    player: WheelPlayer | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function EditPlayerDialog({ player, open, onOpenChange }: EditPlayerDialogProps) {
    const { toast } = useToast();
    const updatePlayer = useUpdatePlayer();

    const [formData, setFormData] = useState<UpdatePlayerPayload>({
        full_name: player?.full_name || '',
        cep: player?.address.cep || '',
        street: player?.address.street || '',
        number: player?.address.number || '',
        complement: player?.address.complement || '',
        neighborhood: player?.address.neighborhood || '',
        city: player?.address.city || '',
        state: player?.address.state || '',
    });

    const handleSubmit = async () => {
        if (!player) return;

        try {
            await updatePlayer.mutateAsync({
                key: player.player_key,
                data: formData,
            });
            toast({
                title: 'Jogador atualizado',
                description: 'Os dados foram salvos com sucesso.',
            });
            onOpenChange(false);
        } catch {
            toast({
                title: 'Erro',
                description: 'Não foi possível atualizar o jogador.',
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Editar Jogador</DialogTitle>
                    <DialogDescription>
                        Atualize os dados do jogador
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="full_name">Nome Completo</Label>
                        <Input
                            id="full_name"
                            value={formData.full_name || ''}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>
                    <Separator />
                    <p className="text-sm font-medium">Endereço</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cep">CEP</Label>
                            <Input
                                id="cep"
                                value={formData.cep || ''}
                                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">UF</Label>
                            <Input
                                id="state"
                                value={formData.state || ''}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                maxLength={2}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                            id="city"
                            value={formData.city || ''}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="neighborhood">Bairro</Label>
                        <Input
                            id="neighborhood"
                            value={formData.neighborhood || ''}
                            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="street">Rua</Label>
                            <Input
                                id="street"
                                value={formData.street || ''}
                                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="number">Nº</Label>
                            <Input
                                id="number"
                                value={formData.number || ''}
                                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="complement">Complemento</Label>
                        <Input
                            id="complement"
                            value={formData.complement || ''}
                            onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={updatePlayer.isPending}>
                        {updatePlayer.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function formatDateTime(dateString: string | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function WheelPlayerDetail() {
    const { key } = useParams<{ key: string }>();
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const { data: playerData, isLoading } = useWheelPlayer(key || '');

    const player = playerData?.data?.player;
    const stats = playerData?.data?.stats;
    const timeline = playerData?.data?.timeline || [];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48 md:col-span-2" />
                </div>
            </div>
        );
    }

    if (!player) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/admin/wheel/players">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Jogador não encontrado</h1>
                        <p className="text-muted-foreground">
                            O jogador solicitado não existe ou foi removido.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/admin/wheel/players">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {player.full_name || 'Jogador'}
                        </h1>
                        {player.whatsapp_confirmed && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verificado
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">{player.player_key}</code>
                    </p>
                </div>
                <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Player Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Informações
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{player.phone_masked}</span>
                        </div>

                        {player.whatsapp_confirmed_at && (
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-muted-foreground">
                                    Verificado em {formatDateTime(player.whatsapp_confirmed_at)}
                                </span>
                            </div>
                        )}

                        {player.has_address && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div className="text-sm">
                                            {player.address.full || (
                                                <>
                                                    {player.address.street && (
                                                        <p>{player.address.street}{player.address.number ? `, ${player.address.number}` : ''}</p>
                                                    )}
                                                    {player.address.neighborhood && <p>{player.address.neighborhood}</p>}
                                                    {player.address.city && player.address.state && (
                                                        <p>{player.address.city}/{player.address.state}</p>
                                                    )}
                                                    {player.address.cep && <p>CEP: {player.address.cep}</p>}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <Separator />

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Cadastro: {formatDateTime(player.created_at)}</span>
                        </div>

                        {player.last_seen_at && (
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Último acesso: {formatDateTime(player.last_seen_at)}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Stats & Timeline */}
                <div className="md:col-span-2 space-y-6">
                    {/* Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Estatísticas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-5 divide-x">
                                <StatCard
                                    title="Sessões"
                                    value={stats?.total_sessions ?? 0}
                                    icon={<Calendar className="h-5 w-5" />}
                                    loading={isLoading}
                                />
                                <StatCard
                                    title="Giros"
                                    value={stats?.total_spins ?? 0}
                                    icon={<RotateCw className="h-5 w-5" />}
                                    loading={isLoading}
                                />
                                <StatCard
                                    title="Prêmios"
                                    value={stats?.prizes_won ?? 0}
                                    icon={<Award className="h-5 w-5" />}
                                    loading={isLoading}
                                />
                                <StatCard
                                    title="Lojas"
                                    value={stats?.stores_visited ?? 0}
                                    icon={<Store className="h-5 w-5" />}
                                    loading={isLoading}
                                />
                                <StatCard
                                    title="Campanhas"
                                    value={stats?.campaigns_participated ?? 0}
                                    icon={<Gift className="h-5 w-5" />}
                                    loading={isLoading}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Participações</CardTitle>
                            <CardDescription>
                                {timeline.length} {timeline.length === 1 ? 'participação' : 'participações'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {timeline.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Nenhuma participação registrada
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {timeline.map((entry) => (
                                        <div key={entry.session_player_key} className="border rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium">{entry.store}</p>
                                                    <p className="text-sm text-muted-foreground">{entry.campaign}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm">{formatDateTime(entry.joined_at)}</p>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {entry.status}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {entry.spins.length > 0 && (
                                                <div className="mt-3 pt-3 border-t space-y-2">
                                                    {entry.spins.map((spin) => (
                                                        <div key={spin.spin_key} className="flex items-center gap-3 text-sm">
                                                            <RotateCw className="h-3 w-3 text-muted-foreground" />
                                                            <span className="flex-1">{spin.prize}</span>
                                                            {spin.code && (
                                                                <code className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded">
                                                                    {spin.code}
                                                                </code>
                                                            )}
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatDateTime(spin.created_at)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Edit Dialog */}
            <EditPlayerDialog
                player={player}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />
        </div>
    );
}
