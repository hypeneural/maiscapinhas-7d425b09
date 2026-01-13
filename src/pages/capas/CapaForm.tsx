/**
 * Capa Form Page
 * 
 * Create or edit a capa personalizada with photo upload and payment.
 * Multi-step flow: Step 1 (details) -> Step 2 (QR code + photo upload)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
    ArrowLeft,
    Save,
    Loader2,
    Palette,
    Upload,
    X,
    Image,
    Plus,
    Smartphone,
    QrCode,
    Copy,
    Check,
    ArrowRight,
    ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/CurrencyInput';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { CustomerSelect } from '@/components/CustomerSelect';
import { DeviceSelect } from '@/components/DeviceSelect';
import { AddDeviceModal } from '@/components/AddDeviceModal';
import {
    useCapa,
    useCreateCapa,
    useUpdateCapa,
    useUploadCapaPhoto,
    useRemoveCapaPhoto,
    useGenerateUploadToken,
} from '@/hooks/api/use-capas';
import { capasService } from '@/services/capas.service';
import { CAPA_STATUS_OPTIONS, getStatusColorClasses } from '@/lib/constants/status.constants';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import type { CreateCapaRequest, UpdateCapaRequest, CapaStatus } from '@/types/capas.types';
import type { Customer, CustomerDevice } from '@/types/customers.types';

// ============================================================
// Types
// ============================================================

interface FormState {
    customer_id: number | null;
    customer_device_id: number | null;
    selected_product: string;
    product_reference: string;
    obs: string;
    qty: number;
    price: number | null;
    payed: boolean;
    payday: string;
    status: CapaStatus;
}

const initialForm: FormState = {
    customer_id: null,
    customer_device_id: null,
    selected_product: '',
    product_reference: '',
    obs: '',
    qty: 1,
    price: null,
    payed: false,
    payday: '',
    status: 1,
};

// ============================================================
// Component
// ============================================================

const CapaForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = id && id !== 'novo';
    const capaId = isEditing ? parseInt(id, 10) : null;

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<FormState>(initialForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
    const [deviceRefreshKey, setDeviceRefreshKey] = useState(0);

    // Multi-step state (for new capas only)
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    const [createdCapaId, setCreatedCapaId] = useState<number | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [photoReceived, setPhotoReceived] = useState(false);
    const [uploadToken, setUploadToken] = useState<string | null>(null);
    const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);

    // Fetch capa data if editing
    const { data: capa, isLoading: isLoadingCapa } = useCapa(capaId || 0);
    const createMutation = useCreateCapa();
    const updateMutation = useUpdateCapa();
    const uploadPhotoMutation = useUploadCapaPhoto();
    const removePhotoMutation = useRemoveCapaPhoto();
    const generateTokenMutation = useGenerateUploadToken();

    // Populate form when capa data is loaded
    useEffect(() => {
        if (capa && isEditing) {
            setForm({
                customer_id: capa.customer_id,
                customer_device_id: capa.customer_device_id,
                selected_product: capa.selected_product,
                product_reference: capa.product_reference || '',
                obs: capa.obs || '',
                qty: capa.qty,
                price: capa.price,
                payed: capa.payed,
                payday: capa.payday || '',
                status: capa.status,
            });
            // Set customer for modal
            if (capa.customer) {
                setSelectedCustomer({
                    id: capa.customer.id,
                    name: capa.customer.name,
                    email: '',
                    phone: null,
                    zip_code: null,
                    street: null,
                    number: null,
                    complement: null,
                    neighborhood: null,
                    city: null,
                    state: null,
                    birth_date: null,
                    created_at: '',
                    updated_at: '',
                });
            }
            if (capa.photo_url) {
                setPreviewUrl(capa.photo_url);
            }
        }
    }, [capa, isEditing]);

    // Handlers
    const handleCustomerChange = (customerId: number | null, customer?: Customer) => {
        setForm((prev) => ({
            ...prev,
            customer_id: customerId,
            customer_device_id: null,
        }));
        setSelectedCustomer(customer || null);
    };

    const handleDeviceChange = (deviceId: number | null, device?: CustomerDevice) => {
        setForm((prev) => ({
            ...prev,
            customer_device_id: deviceId,
        }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleRemovePhoto = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Validation
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!form.customer_id) {
            newErrors.customer_id = 'Selecione um cliente';
        }
        if (!form.selected_product.trim()) {
            newErrors.selected_product = 'Produto é obrigatório';
        }
        if (form.qty < 1) {
            newErrors.qty = 'Quantidade deve ser pelo menos 1';
        }
        if (form.price !== null && form.price < 0) {
            newErrors.price = 'Preço inválido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;


        const data: CreateCapaRequest | UpdateCapaRequest = {
            customer_id: form.customer_id!,
            selected_product: form.selected_product,
            product_reference: form.product_reference || undefined,
            customer_device_id: form.customer_device_id || undefined,
            obs: form.obs || undefined,
            qty: form.qty,
            price: form.price ?? undefined,
            payed: form.payed,
            payday: form.payed && form.payday ? form.payday : undefined,
            status: form.status,
        };

        try {
            let newCapaId = capaId;

            if (isEditing && capaId) {
                await updateMutation.mutateAsync({ id: capaId, data });
                // Upload photo if selected during edit
                if (selectedFile && capaId) {
                    await uploadPhotoMutation.mutateAsync({ id: capaId, file: selectedFile });
                }
                navigate('/capas');
            } else {
                const newCapa = await createMutation.mutateAsync(data as CreateCapaRequest);
                newCapaId = newCapa.id;

                // If photo was uploaded in step 1, skip step 2
                if (selectedFile && newCapaId) {
                    await uploadPhotoMutation.mutateAsync({ id: newCapaId, file: selectedFile });
                    navigate('/capas');
                } else {
                    // Generate upload token for QR code
                    try {
                        const tokenData = await generateTokenMutation.mutateAsync(newCapaId);
                        setUploadToken(tokenData.token);
                        setTokenExpiresAt(tokenData.expires_at);
                    } catch {
                        // Continue without token if generation fails
                    }
                    // Move to Step 2 for new capas without photo
                    setCreatedCapaId(newCapaId);
                    setCurrentStep(2);
                }
            }
        } catch {
            // Error handled by mutation
        }
    };

    // Handle photo upload in Step 2
    const handleStep2Upload = async () => {
        if (!selectedFile || !createdCapaId) return;

        try {
            await uploadPhotoMutation.mutateAsync({ id: createdCapaId, file: selectedFile });
            navigate('/capas');
        } catch {
            // Error handled by mutation
        }
    };

    // Get upload link for QR code (with token)
    const getUploadLink = () => {
        if (!createdCapaId) return '';
        const baseUrl = window.location.origin;
        if (uploadToken) {
            return `${baseUrl}/upload/${createdCapaId}?token=${uploadToken}`;
        }
        return `${baseUrl}/upload/${createdCapaId}`;
    };

    // Copy link to clipboard
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(getUploadLink());
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch {
            // Fallback
        }
    };

    // Trigger confetti celebration
    const triggerConfetti = useCallback(() => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#22c55e', '#16a34a', '#15803d', '#eab308', '#f59e0b'],
        });
    }, []);

    // Poll for photo upload in Step 2
    useEffect(() => {
        if (currentStep !== 2 || !createdCapaId || photoReceived) return;

        const checkForPhoto = async () => {
            try {
                // Use capasService which includes auth token
                const capa = await capasService.get(createdCapaId);
                if (capa.photo_url) {
                    setPhotoReceived(true);
                    setPreviewUrl(capa.photo_url);
                    triggerConfetti();
                }
            } catch {
                // Silently fail
            }
        };

        // Check every 3 seconds
        const interval = setInterval(checkForPhoto, 3000);

        return () => clearInterval(interval);
    }, [currentStep, createdCapaId, photoReceived, triggerConfetti]);

    const isSubmitting =
        createMutation.isPending ||
        updateMutation.isPending ||
        uploadPhotoMutation.isPending;

    if (isEditing && isLoadingCapa) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title={isEditing ? 'Editar Capa' : currentStep === 1 ? 'Nova Capa Personalizada' : 'Enviar Foto'}
                description={
                    isEditing
                        ? 'Atualize as informações da capa'
                        : currentStep === 1
                            ? 'Etapa 1: Dados do pedido'
                            : 'Etapa 2: Foto do cliente'
                }
                icon={currentStep === 2 ? QrCode : Palette}
            />

            {/* Step indicator for new capas */}
            {!isEditing && (
                <div className="flex items-center justify-center gap-2">
                    <div className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                        currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                        1
                    </div>
                    <div className={cn(
                        'w-16 h-1 rounded',
                        currentStep === 2 ? 'bg-primary' : 'bg-muted'
                    )} />
                    <div className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                        currentStep === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                        2
                    </div>
                </div>
            )}

            <Button
                variant="ghost"
                onClick={() => currentStep === 2 ? navigate('/capas') : navigate('/capas')}
                className="gap-2"
            >
                <ArrowLeft className="h-4 w-4" />
                {currentStep === 2 ? 'Ir para lista (pular foto)' : 'Voltar para lista'}
            </Button>

            {/* Step 2: QR Code and Upload Options */}
            {currentStep === 2 && createdCapaId && (
                <div className="space-y-6">
                    {/* Photo Received Success Card */}
                    {photoReceived ? (
                        <Card className="border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20">
                            <CardContent className="pt-6">
                                <div className="text-center space-y-4">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <Check className="h-10 w-10 text-emerald-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-emerald-600">
                                        Foto Recebida com Sucesso!
                                    </h2>
                                    {previewUrl && (
                                        <img
                                            src={previewUrl}
                                            alt="Foto recebida"
                                            className="w-48 h-48 mx-auto object-contain rounded-lg border bg-white"
                                        />
                                    )}
                                    <Button
                                        size="lg"
                                        className="gap-2"
                                        onClick={() => navigate('/capas')}
                                    >
                                        <Check className="h-4 w-4" />
                                        Concluir
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        /* Normal Step 2 UI */
                        <>
                            <Card>
                                <CardHeader className="text-center">
                                    <CardTitle className="flex items-center justify-center gap-2">
                                        <QrCode className="h-5 w-5 text-primary" />
                                        QR Code para o Cliente
                                    </CardTitle>
                                    <CardDescription>
                                        Escaneie ou compartilhe o link para o cliente enviar a foto
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* QR Code Preview - Click to expand */}
                                    <button
                                        type="button"
                                        onClick={() => setIsQrModalOpen(true)}
                                        className="w-full flex flex-col items-center gap-3 p-6 bg-white rounded-lg border hover:border-primary hover:shadow-lg transition-all cursor-pointer"
                                    >
                                        <QRCodeSVG
                                            value={getUploadLink()}
                                            size={150}
                                            level="H"
                                            includeMargin
                                        />
                                        <span className="text-sm text-primary font-medium">
                                            Clique para ampliar
                                        </span>
                                    </button>

                                    {/* Link with copy */}
                                    <div className="space-y-2">
                                        <Label>Link para envio</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={getUploadLink()}
                                                readOnly
                                                className="flex-1 bg-muted"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleCopyLink}
                                                className="gap-2 min-w-[100px]"
                                            >
                                                {linkCopied ? (
                                                    <><Check className="h-4 w-4 text-emerald-600" /> Copiado!</>
                                                ) : (
                                                    <><Copy className="h-4 w-4" /> Copiar</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Open link button */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full gap-2"
                                        onClick={() => window.open(getUploadLink(), '_blank')}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Abrir página de envio
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* OR divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        ou envie você mesmo
                                    </span>
                                </div>
                            </div>

                            {/* Employee upload option */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Upload className="h-5 w-5 text-primary" />
                                        Enviar Foto Agora
                                    </CardTitle>
                                    <CardDescription>
                                        Suba a foto diretamente pelo sistema
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />

                                    {previewUrl ? (
                                        <div className="relative">
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-full h-48 object-contain rounded-lg border bg-muted"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2"
                                                onClick={handleRemovePhoto}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                        >
                                            <Upload className="h-8 w-8" />
                                            <span>Clique para fazer upload</span>
                                        </button>
                                    )}

                                    {selectedFile && (
                                        <Button
                                            className="w-full gap-2"
                                            onClick={handleStep2Upload}
                                            disabled={uploadPhotoMutation.isPending}
                                        >
                                            {uploadPhotoMutation.isPending ? (
                                                <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                                            ) : (
                                                <><Upload className="h-4 w-4" /> Enviar e Concluir</>
                                            )}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Skip button */}
                            <div className="flex justify-center">
                                <Button
                                    variant="ghost"
                                    onClick={() => navigate('/capas')}
                                    className="gap-2"
                                >
                                    <ArrowRight className="h-4 w-4" />
                                    Concluir sem foto
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Large QR Code Modal */}
            <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="text-center">
                        <DialogTitle className="flex items-center justify-center gap-2">
                            <QrCode className="h-5 w-5 text-primary" />
                            Escaneie o QR Code
                        </DialogTitle>
                        <DialogDescription>
                            Cliente pode escanear para enviar a foto pelo celular
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                        <QRCodeSVG
                            value={getUploadLink()}
                            size={280}
                            level="H"
                            includeMargin
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={handleCopyLink}
                        >
                            {linkCopied ? (
                                <><Check className="h-4 w-4 text-emerald-600" /> Copiado!</>
                            ) : (
                                <><Copy className="h-4 w-4" /> Copiar Link</>
                            )}
                        </Button>
                        <Button
                            className="flex-1 gap-2"
                            onClick={() => setIsQrModalOpen(false)}
                        >
                            Fechar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Step 1: Form (hide on step 2 for new capas) */}
            {(isEditing || currentStep === 1) && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Product Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações do Produto</CardTitle>
                                <CardDescription>Dados da capa personalizada</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Customer */}
                                <div className="space-y-2">
                                    <Label>Cliente *</Label>
                                    <CustomerSelect
                                        value={form.customer_id}
                                        onChange={handleCustomerChange}
                                        onCreateNew={() => navigate('/clientes/novo')}
                                    />
                                    {errors.customer_id && (
                                        <p className="text-xs text-destructive">{errors.customer_id}</p>
                                    )}
                                </div>

                                {/* Device */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Aparelho</Label>
                                        {form.customer_id && selectedCustomer && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsAddDeviceOpen(true)}
                                                className="gap-1 h-7 text-xs text-primary"
                                            >
                                                <Plus className="h-3 w-3" />
                                                <Smartphone className="h-3 w-3" />
                                                Cadastrar aparelho
                                            </Button>
                                        )}
                                    </div>
                                    <DeviceSelect
                                        key={deviceRefreshKey}
                                        customerId={form.customer_id}
                                        value={form.customer_device_id}
                                        onChange={handleDeviceChange}
                                    />
                                </div>

                                {/* Product */}
                                <div className="space-y-2">
                                    <Label htmlFor="selected_product">Produto *</Label>
                                    <Input
                                        id="selected_product"
                                        value={form.selected_product}
                                        onChange={(e) =>
                                            setForm({ ...form, selected_product: e.target.value })
                                        }
                                        placeholder="Ex: Capa Personalizada com Foto"
                                        className={errors.selected_product ? 'border-destructive' : ''}
                                    />
                                    {errors.selected_product && (
                                        <p className="text-xs text-destructive">
                                            {errors.selected_product}
                                        </p>
                                    )}
                                </div>

                                {/* Reference */}
                                <div className="space-y-2">
                                    <Label htmlFor="product_reference">Referência</Label>
                                    <Input
                                        id="product_reference"
                                        value={form.product_reference}
                                        onChange={(e) =>
                                            setForm({ ...form, product_reference: e.target.value })
                                        }
                                        placeholder="Código ou referência do produto"
                                    />
                                </div>

                                {/* Observations */}
                                <div className="space-y-2">
                                    <Label htmlFor="obs">Observações</Label>
                                    <Textarea
                                        id="obs"
                                        value={form.obs}
                                        onChange={(e) => setForm({ ...form, obs: e.target.value })}
                                        placeholder="Observações sobre a capa..."
                                        rows={3}
                                    />
                                </div>

                                {/* Status */}
                                {isEditing && (
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={form.status.toString()}
                                            onValueChange={(v) =>
                                                setForm({ ...form, status: parseInt(v, 10) as CapaStatus })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CAPA_STATUS_OPTIONS.map((option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value.toString()}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={cn(
                                                                    'inline-block h-2 w-2 rounded-full',
                                                                    getStatusColorClasses(option.color).split(
                                                                        ' '
                                                                    )[0]
                                                                )}
                                                            />
                                                            {option.label}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Pricing & Photo */}
                        <div className="space-y-6">
                            {/* Pricing */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Preço e Pagamento</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="qty">Quantidade</Label>
                                            <Input
                                                id="qty"
                                                type="number"
                                                min={1}
                                                value={form.qty}
                                                onChange={(e) =>
                                                    setForm({ ...form, qty: parseInt(e.target.value, 10) || 1 })
                                                }
                                                className={errors.qty ? 'border-destructive' : ''}
                                            />
                                            {errors.qty && (
                                                <p className="text-xs text-destructive">{errors.qty}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="price">Preço Unitário</Label>
                                            <CurrencyInput
                                                id="price"
                                                value={form.price}
                                                onChange={(value) => setForm({ ...form, price: value })}
                                                className={errors.price ? 'border-destructive' : ''}
                                            />
                                            {errors.price && (
                                                <p className="text-xs text-destructive">{errors.price}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <Checkbox
                                            id="payed"
                                            checked={form.payed}
                                            onCheckedChange={(checked) =>
                                                setForm({ ...form, payed: checked as boolean })
                                            }
                                        />
                                        <Label htmlFor="payed" className="font-normal">
                                            Pagamento realizado
                                        </Label>
                                    </div>

                                    {form.payed && (
                                        <div className="space-y-2">
                                            <Label htmlFor="payday">Data do Pagamento</Label>
                                            <Input
                                                id="payday"
                                                type="date"
                                                value={form.payday}
                                                onChange={(e) => setForm({ ...form, payday: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Photo */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Foto da Capa</CardTitle>
                                    <CardDescription>
                                        Upload da imagem da capa personalizada
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />

                                    {previewUrl ? (
                                        <div className="relative">
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-full h-48 object-contain rounded-lg border bg-muted"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2"
                                                onClick={handleRemovePhoto}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                        >
                                            <Upload className="h-8 w-8" />
                                            <span>Clique para fazer upload</span>
                                        </button>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/capas')}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="gap-2">
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {isEditing ? 'Salvar Alterações' : 'Criar Capa'}
                        </Button>
                    </div>
                </form>
            )}

            {/* Add Device Modal */}
            {selectedCustomer && (
                <AddDeviceModal
                    open={isAddDeviceOpen}
                    onOpenChange={setIsAddDeviceOpen}
                    customerId={selectedCustomer.id}
                    customerName={selectedCustomer.name}
                    onSuccess={() => setDeviceRefreshKey((k) => k + 1)}
                />
            )}
        </div>
    );
};

export default CapaForm;
