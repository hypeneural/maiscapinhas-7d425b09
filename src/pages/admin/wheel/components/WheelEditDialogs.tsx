/**
 * Wheel Edit Dialogs
 * 
 * Shared edit dialogs for Screen, Campaign, and Prize entities.
 * Super Admin only.
 */

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useUpdateScreen, useUpdateCampaign, useUpdatePrize, useDuplicateCampaign } from '@/hooks/api/use-wheel';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import type {
    WheelScreen,
    WheelCampaign,
    WheelPrize,
    ScreenStatus,
    PrizeType,
    UpdateScreenPayload,
    UpdateCampaignPayload,
    UpdatePrizePayload,
} from '@/types/wheel.types';

// ============================================
// Edit Screen Dialog
// ============================================

interface EditScreenDialogProps {
    screen: WheelScreen | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditScreenDialog({ screen, open, onOpenChange }: EditScreenDialogProps) {
    const { toast } = useToast();
    const updateScreen = useUpdateScreen();
    const { data: storesData } = useAdminStores();
    const stores = storesData?.data || [];

    const [formData, setFormData] = useState<UpdateScreenPayload>({
        name: '',
        store_id: undefined,
        status: 'active',
    });

    useEffect(() => {
        if (screen) {
            setFormData({
                name: screen.name,
                store_id: screen.store_id,
                status: screen.status,
            });
        }
    }, [screen]);

    const handleSubmit = async () => {
        if (!screen) return;

        try {
            await updateScreen.mutateAsync({ key: screen.screen_key, data: formData });
            toast({ title: 'TV atualizada', description: 'As alterações foram salvas com sucesso.' });
            onOpenChange(false);
        } catch {
            toast({ title: 'Erro', description: 'Não foi possível atualizar a TV.', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar TV</DialogTitle>
                    <DialogDescription>
                        Altere os dados da TV "{screen?.name}"
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input
                            id="name"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="store">Loja</Label>
                        <Select
                            value={formData.store_id?.toString() || ''}
                            onValueChange={(value) => setFormData({ ...formData, store_id: Number(value) })}
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
                        <Label>Status</Label>
                        <Select
                            value={formData.status || 'active'}
                            onValueChange={(value) => setFormData({ ...formData, status: value as ScreenStatus })}
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
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={updateScreen.isPending}>
                        {updateScreen.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================
// Edit Campaign Dialog
// ============================================

interface EditCampaignDialogProps {
    campaign: WheelCampaign | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditCampaignDialog({ campaign, open, onOpenChange }: EditCampaignDialogProps) {
    const { toast } = useToast();
    const updateCampaign = useUpdateCampaign();

    const [formData, setFormData] = useState<UpdateCampaignPayload>({
        name: '',
        starts_at: null,
        ends_at: null,
        terms_version: '',
        settings: {},
    });

    useEffect(() => {
        if (campaign) {
            setFormData({
                name: campaign.name,
                starts_at: campaign.starts_at,
                ends_at: campaign.ends_at,
                terms_version: campaign.terms_version || '',
                settings: campaign.settings,
            });
        }
    }, [campaign]);

    const handleSubmit = async () => {
        if (!campaign) return;

        try {
            await updateCampaign.mutateAsync({ key: campaign.campaign_key, data: formData });
            toast({ title: 'Campanha atualizada', description: 'As alterações foram salvas com sucesso.' });
            onOpenChange(false);
        } catch {
            toast({ title: 'Erro', description: 'Não foi possível atualizar a campanha.', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Editar Campanha</DialogTitle>
                    <DialogDescription>
                        Altere os dados da campanha "{campaign?.name}"
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="campaign-name">Nome</Label>
                        <Input
                            id="campaign-name"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="starts_at">Data Início</Label>
                            <Input
                                id="starts_at"
                                type="datetime-local"
                                value={formData.starts_at ? formData.starts_at.slice(0, 16) : ''}
                                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value ? `${e.target.value}:00Z` : null })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ends_at">Data Fim</Label>
                            <Input
                                id="ends_at"
                                type="datetime-local"
                                value={formData.ends_at ? formData.ends_at.slice(0, 16) : ''}
                                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value ? `${e.target.value}:00Z` : null })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="terms_version">Versão dos Termos</Label>
                        <Input
                            id="terms_version"
                            placeholder="v1.0"
                            value={formData.terms_version || ''}
                            onChange={(e) => setFormData({ ...formData, terms_version: e.target.value })}
                        />
                    </div>
                    <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Configurações</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="qr_ttl">TTL do QR Code (seg)</Label>
                                <Input
                                    id="qr_ttl"
                                    type="number"
                                    value={formData.settings?.qr_ttl_seconds || 120}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        settings: { ...formData.settings, qr_ttl_seconds: Number(e.target.value) }
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="spin_duration">Duração do Giro (ms)</Label>
                                <Input
                                    id="spin_duration"
                                    type="number"
                                    value={formData.settings?.spin_duration_ms || 5000}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        settings: { ...formData.settings, spin_duration_ms: Number(e.target.value) }
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={updateCampaign.isPending}>
                        {updateCampaign.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================
// Edit Prize Dialog
// ============================================

interface EditPrizeDialogProps {
    prize: WheelPrize | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditPrizeDialog({ prize, open, onOpenChange }: EditPrizeDialogProps) {
    const { toast } = useToast();
    const updatePrize = useUpdatePrize();

    const [formData, setFormData] = useState<UpdatePrizePayload>({
        name: '',
        type: 'product',
        icon: '',
        description: '',
        redeem_instructions: '',
        code_prefix: '',
        active: true,
    });

    useEffect(() => {
        if (prize) {
            setFormData({
                name: prize.name,
                type: prize.type,
                icon: prize.icon || '',
                description: prize.description || '',
                redeem_instructions: prize.redeem_instructions || '',
                code_prefix: prize.code_prefix || '',
                active: prize.active,
            });
        }
    }, [prize]);

    const handleSubmit = async () => {
        if (!prize) return;

        try {
            await updatePrize.mutateAsync({ key: prize.prize_key, data: formData });
            toast({ title: 'Prêmio atualizado', description: 'As alterações foram salvas com sucesso.' });
            onOpenChange(false);
        } catch {
            toast({ title: 'Erro', description: 'Não foi possível atualizar o prêmio.', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Editar Prêmio</DialogTitle>
                    <DialogDescription>
                        Altere os dados do prêmio "{prize?.name}"
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="prize-name">Nome</Label>
                            <Input
                                id="prize-name"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo</Label>
                            <Select
                                value={formData.type || 'product'}
                                onValueChange={(value) => setFormData({ ...formData, type: value as PrizeType })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="product">Produto</SelectItem>
                                    <SelectItem value="coupon">Cupom</SelectItem>
                                    <SelectItem value="nothing">Nada</SelectItem>
                                    <SelectItem value="try_again">Tente Novamente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="icon">Ícone (emoji)</Label>
                            <Input
                                id="icon"
                                placeholder="🎁"
                                value={formData.icon || ''}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code_prefix">Prefixo do Código</Label>
                            <Input
                                id="code_prefix"
                                placeholder="MC-"
                                value={formData.code_prefix || ''}
                                onChange={(e) => setFormData({ ...formData, code_prefix: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                            id="description"
                            placeholder="Descrição do prêmio..."
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={2}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="redeem_instructions">Instruções de Resgate</Label>
                        <Textarea
                            id="redeem_instructions"
                            placeholder="Como resgatar o prêmio..."
                            value={formData.redeem_instructions || ''}
                            onChange={(e) => setFormData({ ...formData, redeem_instructions: e.target.value })}
                            rows={2}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Switch
                            id="active"
                            checked={formData.active}
                            onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                        />
                        <Label htmlFor="active">Prêmio ativo</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={updatePrize.isPending}>
                        {updatePrize.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================
// Duplicate Campaign Dialog
// ============================================

interface DuplicateCampaignDialogProps {
    campaign: WheelCampaign | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (newCampaign: WheelCampaign) => void;
}

export function DuplicateCampaignDialog({ campaign, open, onOpenChange, onSuccess }: DuplicateCampaignDialogProps) {
    const { toast } = useToast();
    const duplicateCampaign = useDuplicateCampaign();

    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (campaign) {
            setNewName(`${campaign.name} (Cópia)`);
        }
    }, [campaign]);

    const handleSubmit = async () => {
        if (!campaign || !newName.trim()) return;

        try {
            const result = await duplicateCampaign.mutateAsync({ key: campaign.campaign_key, data: { new_name: newName } });
            toast({ title: 'Campanha duplicada', description: 'A campanha foi duplicada com sucesso.' });
            onOpenChange(false);
            if (onSuccess) {
                onSuccess(result.data);
            }
        } catch {
            toast({ title: 'Erro', description: 'Não foi possível duplicar a campanha.', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Duplicar Campanha</DialogTitle>
                    <DialogDescription>
                        Crie uma cópia de "{campaign?.name}" com todos os segmentos e configurações.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new_name">Nome da nova campanha</Label>
                        <Input
                            id="new_name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Digite o nome da nova campanha"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={duplicateCampaign.isPending || !newName.trim()}>
                        {duplicateCampaign.isPending ? 'Duplicando...' : 'Duplicar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
