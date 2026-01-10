/**
 * Store Form Page
 * 
 * Dedicated page for creating/editing stores.
 * Provides better UX than modal for many fields.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Loader2, Store, MapPin, Hash, Building, Home, Map,
    Flag, Navigation, Phone, MessageCircle, Instagram, DollarSign, CheckCircle, Upload, Trash2, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { OpeningHoursEditor } from '@/components/OpeningHoursEditor';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    useAdminStore,
    useCreateStore,
    useUpdateStore,
    useUploadStorePhoto,
} from '@/hooks/api/use-admin-stores';
import type { OpeningHours } from '@/types/admin.types';

// ============================================================
// Constants
// ============================================================

const UF_OPTIONS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

// ============================================================
// Helper Functions
// ============================================================

function formatCNPJ(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatPhone(value: string): string {
    return value.replace(/\D/g, '').slice(0, 11);
}

// ============================================================
// Types
// ============================================================

interface StoreFormState {
    name: string;
    city: string;
    active: boolean;
    codigo: string;
    address: string;
    neighborhood: string;
    state: string;
    zip_code: string;
    latitude: string;
    longitude: string;
    phone: string;
    whatsapp: string;
    instagram: string;
    cnpj: string;
    troco_padrao: string;
    bio_enabled: boolean;
}

const initialForm: StoreFormState = {
    name: '',
    city: '',
    active: true,
    codigo: '',
    address: '',
    neighborhood: '',
    state: '',
    zip_code: '',
    latitude: '',
    longitude: '',
    phone: '',
    whatsapp: '',
    instagram: '',
    cnpj: '',
    troco_padrao: '',
    bio_enabled: false,
};

// ============================================================
// Component
// ============================================================

const StoreForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = id && id !== 'novo';
    const storeId = isEditing ? parseInt(id) : null;

    const [form, setForm] = useState<StoreFormState>(initialForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [openingHours, setOpeningHours] = useState<OpeningHours | null>(null);

    // Queries and mutations
    const { data: storeData, isLoading: isLoadingStore } = useAdminStore(storeId || 0);
    const createMutation = useCreateStore();
    const updateMutation = useUpdateStore();
    const uploadPhotoMutation = useUploadStorePhoto();

    // Load store data when editing
    useEffect(() => {
        if (storeData) {
            setForm({
                name: storeData.name,
                city: storeData.city,
                active: storeData.active,
                codigo: storeData.codigo || '',
                address: storeData.address || '',
                neighborhood: storeData.neighborhood || '',
                state: storeData.state || '',
                zip_code: storeData.zip_code || '',
                latitude: storeData.latitude?.toString() || '',
                longitude: storeData.longitude?.toString() || '',
                phone: storeData.phone || '',
                whatsapp: storeData.whatsapp || '',
                instagram: storeData.instagram || '',
                cnpj: storeData.cnpj || '',
                troco_padrao: storeData.troco_padrao?.toString() || '',
                bio_enabled: storeData.bio_enabled ?? false,
            });
            if (storeData.photo_url) {
                setPhotoPreview(storeData.photo_url);
            }
            if (storeData.opening_hours) {
                setOpeningHours(storeData.opening_hours);
            }
        }
    }, [storeData]);

    // Validation
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!form.city.trim()) newErrors.city = 'Cidade é obrigatória';

        if (form.latitude && (parseFloat(form.latitude) < -90 || parseFloat(form.latitude) > 90)) {
            newErrors.latitude = 'Latitude inválida (-90 a 90)';
        }
        if (form.longitude && (parseFloat(form.longitude) < -180 || parseFloat(form.longitude) > 180)) {
            newErrors.longitude = 'Longitude inválida (-180 a 180)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle photo file selection
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const storePayload = {
                name: form.name,
                city: form.city,
                active: form.active,
                codigo: form.codigo || undefined,
                address: form.address || undefined,
                neighborhood: form.neighborhood || undefined,
                state: form.state || undefined,
                zip_code: form.zip_code || undefined,
                latitude: form.latitude ? parseFloat(form.latitude) : undefined,
                longitude: form.longitude ? parseFloat(form.longitude) : undefined,
                phone: form.phone || undefined,
                whatsapp: form.whatsapp || undefined,
                instagram: form.instagram || undefined,
                cnpj: form.cnpj || undefined,
                troco_padrao: form.troco_padrao ? parseFloat(form.troco_padrao) : undefined,
                bio_enabled: form.bio_enabled,
                opening_hours: openingHours || undefined,
            };

            let savedStoreId = storeId;

            if (isEditing && storeId) {
                await updateMutation.mutateAsync({ id: storeId, data: storePayload });
            } else {
                const result = await createMutation.mutateAsync(storePayload as any);
                savedStoreId = result.id;
            }

            // Upload photo if changed
            if (photoFile && savedStoreId) {
                await uploadPhotoMutation.mutateAsync({ id: savedStoreId, file: photoFile });
            }

            toast.success(isEditing ? 'Loja atualizada!' : 'Loja criada!');
            navigate('/config/lojas');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar loja');
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    if (isEditing && isLoadingStore) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/config/lojas')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <PageHeader
                        title={isEditing ? 'Editar Loja' : 'Nova Loja'}
                        description={isEditing ? `Editando ${storeData?.name}` : 'Preencha os dados da nova loja'}
                        icon={Store}
                    />
                </div>
                <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
                {/* Photo Card */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Foto</CardTitle>
                        <CardDescription>Imagem da loja</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <div className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <Store className="h-12 w-12 text-muted-foreground/50" />
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <label className="cursor-pointer">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                </label>
                            </Button>
                            {photoPreview && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Identificação */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Store className="h-5 w-5 text-primary" />
                                Identificação
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Label className="flex items-center gap-2">
                                    <Store className="h-3.5 w-3.5 text-muted-foreground" />
                                    Nome da Loja *
                                </Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Mais Capinhas Shopping Center"
                                    className={cn(errors.name && "border-destructive")}
                                />
                                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                                    Código
                                </Label>
                                <Input
                                    value={form.codigo}
                                    onChange={(e) => setForm(f => ({ ...f, codigo: e.target.value }))}
                                    placeholder="FLN01"
                                    maxLength={20}
                                />
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                    Cidade *
                                </Label>
                                <Input
                                    value={form.city}
                                    onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                                    placeholder="Florianópolis"
                                    className={cn(errors.city && "border-destructive")}
                                />
                                {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <Building className="h-3.5 w-3.5 text-muted-foreground" />
                                    CNPJ
                                </Label>
                                <Input
                                    value={form.cnpj}
                                    onChange={(e) => setForm(f => ({ ...f, cnpj: formatCNPJ(e.target.value) }))}
                                    placeholder="12.345.678/0001-90"
                                    maxLength={18}
                                />
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                                    Troco Padrão (R$)
                                </Label>
                                <Input
                                    type="number"
                                    value={form.troco_padrao}
                                    onChange={(e) => setForm(f => ({ ...f, troco_padrao: e.target.value }))}
                                    placeholder="200.00"
                                    min={0}
                                    step={0.01}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Endereço */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Home className="h-5 w-5 text-primary" />
                                Endereço
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Label className="flex items-center gap-2">
                                    <Home className="h-3.5 w-3.5 text-muted-foreground" />
                                    Logradouro
                                </Label>
                                <Input
                                    value={form.address}
                                    onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                                    placeholder="Rua das Flores, 123"
                                    maxLength={255}
                                />
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <Map className="h-3.5 w-3.5 text-muted-foreground" />
                                    Bairro
                                </Label>
                                <Input
                                    value={form.neighborhood}
                                    onChange={(e) => setForm(f => ({ ...f, neighborhood: e.target.value }))}
                                    placeholder="Centro"
                                    maxLength={100}
                                />
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Label className="flex items-center gap-2">
                                        <Flag className="h-3.5 w-3.5 text-muted-foreground" />
                                        UF
                                    </Label>
                                    <Select value={form.state} onValueChange={(v) => setForm(f => ({ ...f, state: v }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="UF" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {UF_OPTIONS.map(uf => (
                                                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1">
                                    <Label className="flex items-center gap-2">
                                        <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
                                        CEP
                                    </Label>
                                    <Input
                                        value={form.zip_code}
                                        onChange={(e) => setForm(f => ({ ...f, zip_code: e.target.value }))}
                                        placeholder="88000-000"
                                        maxLength={10}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
                                    Latitude
                                </Label>
                                <Input
                                    type="number"
                                    value={form.latitude}
                                    onChange={(e) => setForm(f => ({ ...f, latitude: e.target.value }))}
                                    placeholder="-27.5954"
                                    step={0.0001}
                                    className={cn(errors.latitude && "border-destructive")}
                                />
                                {errors.latitude && <p className="text-xs text-destructive mt-1">{errors.latitude}</p>}
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
                                    Longitude
                                </Label>
                                <Input
                                    type="number"
                                    value={form.longitude}
                                    onChange={(e) => setForm(f => ({ ...f, longitude: e.target.value }))}
                                    placeholder="-48.5480"
                                    step={0.0001}
                                    className={cn(errors.longitude && "border-destructive")}
                                />
                                {errors.longitude && <p className="text-xs text-destructive mt-1">{errors.longitude}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contato */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Phone className="h-5 w-5 text-primary" />
                                Contato
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-3">
                            <div>
                                <Label className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                    Telefone
                                </Label>
                                <Input
                                    value={form.phone}
                                    onChange={(e) => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))}
                                    placeholder="4833334444"
                                    maxLength={11}
                                />
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                    WhatsApp
                                </Label>
                                <Input
                                    value={form.whatsapp}
                                    onChange={(e) => setForm(f => ({ ...f, whatsapp: formatPhone(e.target.value) }))}
                                    placeholder="48999998888"
                                    maxLength={11}
                                />
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <Instagram className="h-3.5 w-3.5 text-muted-foreground" />
                                    Instagram
                                </Label>
                                <Input
                                    value={form.instagram}
                                    onChange={(e) => setForm(f => ({ ...f, instagram: e.target.value }))}
                                    placeholder="@maiscapinhasfln"
                                    maxLength={50}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-primary" />
                                Status & Visibilidade
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className={cn("h-5 w-5", form.active ? "text-green-500" : "text-muted-foreground")} />
                                    <div>
                                        <p className="font-medium">Loja Ativa</p>
                                        <p className="text-sm text-muted-foreground">Aparece nas opções do sistema</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={form.active}
                                    onCheckedChange={(checked) => setForm(f => ({ ...f, active: checked }))}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg border border-pink-500/30 bg-gradient-to-r from-pink-500/5 to-purple-500/5">
                                <div className="flex items-center gap-3">
                                    <Globe className={cn("h-5 w-5", form.bio_enabled ? "text-pink-500" : "text-muted-foreground")} />
                                    <div>
                                        <p className="font-medium text-pink-600">Exibir na Bio do Instagram</p>
                                        <p className="text-sm text-muted-foreground">Loja aparece na página pública da Bio com horários</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={form.bio_enabled}
                                    onCheckedChange={(checked) => setForm(f => ({ ...f, bio_enabled: checked }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Opening Hours */}
                    <OpeningHoursEditor
                        value={openingHours}
                        onChange={setOpeningHours}
                    />
                </div>
            </form>
        </div>
    );
};

export default StoreForm;
