/**
 * TV Signage & Ads Management Page
 * 
 * Gestão de anúncios (fotos e vídeos), edição completa de tempo/mídia,
 * ligar/desligar tela (Standby), controle remoto, estatísticas e logs humanizados.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tv,
    Plus,
    Upload,
    Video,
    Image as ImageIcon,
    Play,
    Trash2,
    Copy,
    CheckCircle,
    ExternalLink,
    Clock,
    Monitor,
    Globe,
    Store as StoreIcon,
    Search,
    Eye,
    Activity,
    FileText,
    TrendingUp,
    Radio,
    ShieldAlert,
    Sparkles,
    Edit3,
    Trash,
    RefreshCw,
    SkipForward,
    Pause,
    HardDrive,
    User,
    FileCode,
    ChevronDown,
    ChevronUp,
    Sliders,
    Power,
    Moon,
    Sun,
    BarChart3,
    Target,
    Calendar,
    Palette,
    Loader2,
} from 'lucide-react';
import { uploadMediaChunked, type ChunkUploadProgress } from '@/lib/upload/chunkedUpload';
import { TvStoreAnalytics } from './TvStoreAnalytics';
import { TvDesignStudio } from './TvDesignStudio';
import {
    useTvAds,
    useTvScreens,
    useTvStats,
    useTvLogs,
    useTvSendCommand,
    useCreateTvAd,
    useUpdateTvAd,
    useDeleteTvAd,
} from '@/hooks/api/use-tv-ads';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import { toast } from 'sonner';
import type { TvAd, TvMediaType, TvOrientation, TvAdStatus } from '@/types/tv.types';

// Helper de formatação de bytes para tamanho humano
function formatFileSize(bytes?: number): string {
    if (!bytes || bytes === 0) return 'Tamanho desconhecido';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Helper para tradução e estilização visual de eventos
function getEventConfig(event: string, level: string) {
    switch (event) {
        case 'ad_created':
            return {
                title: 'Novo Anúncio Publicado',
                badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
                icon: <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />,
            };
        case 'ad_updated':
            return {
                title: 'Anúncio Modificado',
                badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
                icon: <Edit3 className="h-4 w-4 text-blue-500 shrink-0" />,
            };
        case 'ad_deleted':
            return {
                title: 'Anúncio Excluído',
                badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
                icon: <Trash className="h-4 w-4 text-rose-500 shrink-0" />,
            };
        case 'tv_remote_command':
            return {
                title: 'Comando Remoto Enviado',
                badgeClass: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
                icon: <Sliders className="h-4 w-4 text-purple-500 shrink-0" />,
            };
        case 'tv_player_error':
            return {
                title: 'Alerta na Reprodução da TV',
                badgeClass: 'bg-red-500/10 text-red-600 border-red-500/30',
                icon: <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />,
            };
        default:
            return {
                title: event.replace(/_/g, ' ').toUpperCase(),
                badgeClass: level === 'error'
                    ? 'bg-red-500/10 text-red-600 border-red-500/30'
                    : level === 'warning'
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    : 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30',
                icon: <Activity className="h-4 w-4 text-primary shrink-0" />,
            };
    }
}

export default function TvAdsManager() {
    const [tab, setTab] = useState<'ads' | 'screens' | 'analytics' | 'logs'>('ads');
    const [search, setSearch] = useState('');
    const [storeFilter, setStoreFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [logLevelFilter, setLogLevelFilter] = useState<string>('all');
    const [logStoreFilter, setLogStoreFilter] = useState<string>('all');
    const [expandedLogs, setExpandedLogs] = useState<number[]>([]);

    // Modals
    const [createOpen, setCreateOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<TvAd | null>(null);
    const [previewAd, setPreviewAd] = useState<TvAd | null>(null);
    const [simulatorScreen, setSimulatorScreen] = useState<string | null>(null);
    const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

    // Form state (Create)
    const [formTitle, setFormTitle] = useState('');
    const [formFile, setFormFile] = useState<File | null>(null);
    const [formFilePreview, setFormFilePreview] = useState<string | null>(null);
    const [formFileType, setFormFileType] = useState<TvMediaType>('image');
    const [formDuration, setFormDuration] = useState<number>(10);
    const [formOrientation, setFormOrientation] = useState<TvOrientation>('all');
    const [formIsGlobal, setFormIsGlobal] = useState<boolean>(true);
    const [formSelectedStores, setFormSelectedStores] = useState<number[]>([]);
    const [formStartsAt, setFormStartsAt] = useState<string>('');
    const [formEndsAt, setFormEndsAt] = useState<string>('');

    // Form state (Edit)
    const [editTitle, setEditTitle] = useState('');
    const [editDuration, setEditDuration] = useState<number>(10);
    const [editOrientation, setEditOrientation] = useState<TvOrientation>('all');
    const [editIsGlobal, setEditIsGlobal] = useState<boolean>(true);
    const [editSelectedStores, setEditSelectedStores] = useState<number[]>([]);
    const [editStartsAt, setEditStartsAt] = useState<string>('');
    const [editEndsAt, setEditEndsAt] = useState<string>('');
    const [editStatus, setEditStatus] = useState<TvAdStatus>('active');
    const [editFile, setEditFile] = useState<File | null>(null);
    const [editFilePreview, setEditFilePreview] = useState<string | null>(null);

    // Chunked Upload Progress State
    const [uploadProgress, setUploadProgress] = useState<ChunkUploadProgress | null>(null);
    const [isUploadingChunked, setIsUploadingChunked] = useState(false);

    // Queries & Mutations
    const { data: adsData, isLoading: adsLoading } = useTvAds({
        search: search || undefined,
        store_id: storeFilter !== 'all' ? Number(storeFilter) : undefined,
        media_type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
    });

    const { data: screensData, isLoading: screensLoading } = useTvScreens();
    const { data: statsData } = useTvStats();
    const { data: logsData, isLoading: logsLoading } = useTvLogs({
        level: logLevelFilter !== 'all' ? logLevelFilter : undefined,
        store_id: logStoreFilter !== 'all' ? logStoreFilter : undefined,
    });
    const { data: storesData } = useAdminStores();

    const createAd = useCreateTvAd();
    const updateAd = useUpdateTvAd();
    const deleteAd = useDeleteTvAd();
    const sendCommand = useTvSendCommand();

    const ads = adsData?.data || [];
    const screens = screensData?.data || [];
    const stats = statsData?.data;
    const logs = logsData?.data || [];
    const stores = storesData?.data || [];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFormFile(file);
        const isVideo = file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4') || file.name.toLowerCase().endsWith('.webm');
        setFormFileType(isVideo ? 'video' : 'image');

        if (isVideo) {
            setFormDuration(30);
        } else {
            setFormDuration(10);
        }

        const previewUrl = URL.createObjectURL(file);
        setFormFilePreview(previewUrl);
    };

    const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setEditFile(file);
        setEditFilePreview(URL.createObjectURL(file));
    };

    const handleCreateAd = async () => {
        if (!formTitle || !formFile) {
            toast.error('Informe o título e selecione um arquivo de imagem ou vídeo.');
            return;
        }

        if (!formIsGlobal && formSelectedStores.length === 0) {
            toast.error('Selecione pelo menos uma loja de destino para este anúncio.');
            return;
        }

        try {
            setIsUploadingChunked(true);

            let mediaUrl: string | null = null;
            let mediaPath: string | null = null;
            let mediaType: TvMediaType = formFileType;
            let thumbnailUrl: string | null = null;

            // Se for vídeo ou arquivo maior que 1.5MB, utiliza Chunked Upload para bypassar qualquer limite de POST
            if (formFileType === 'video' || formFile.size > 1.5 * 1024 * 1024) {
                const chunkResult = await uploadMediaChunked(formFile, (progress) => {
                    setUploadProgress(progress);
                });
                mediaUrl = chunkResult.media_url;
                mediaPath = chunkResult.media_path;
                mediaType = chunkResult.media_type;
                thumbnailUrl = chunkResult.thumbnail_url || null;
            }

            await createAd.mutateAsync({
                title: formTitle,
                file: mediaUrl ? null : formFile,
                media_url: mediaUrl,
                media_path: mediaPath,
                media_type: mediaType,
                thumbnail_url: thumbnailUrl,
                duration_seconds: formDuration,
                target_orientation: formOrientation,
                is_global: formIsGlobal,
                store_ids: formIsGlobal ? [] : formSelectedStores,
                starts_at: formStartsAt || null,
                ends_at: formEndsAt || null,
                status: 'active',
            });

            setCreateOpen(false);
            resetForm();
        } catch (err: any) {
            toast.error(err?.message || 'Erro ao publicar anúncio.');
        } finally {
            setIsUploadingChunked(false);
            setUploadProgress(null);
        }
    };

    const openEditModal = (ad: TvAd) => {
        setEditingAd(ad);
        setEditTitle(ad.title);
        setEditDuration(ad.duration_seconds);
        setEditOrientation(ad.target_orientation || 'all');
        setEditIsGlobal(ad.is_global);
        setEditSelectedStores(ad.target_stores?.map((s) => s.id) || []);
        setEditStartsAt(ad.starts_at ? ad.starts_at.slice(0, 16) : '');
        setEditEndsAt(ad.ends_at ? ad.ends_at.slice(0, 16) : '');
        setEditStatus(ad.status);
        setEditFile(null);
        setEditFilePreview(null);
        setUploadProgress(null);
    };

    const handleSaveEdit = async () => {
        if (!editingAd) return;

        try {
            setIsUploadingChunked(true);

            let mediaUrl: string | null = null;
            let mediaPath: string | null = null;
            let mediaType: TvMediaType = editingAd.media_type;
            let thumbnailUrl: string | null = null;

            if (editFile) {
                const isVideo = editFile.type.startsWith('video/') || editFile.name.toLowerCase().endsWith('.mp4');
                if (isVideo || editFile.size > 1.5 * 1024 * 1024) {
                    const chunkResult = await uploadMediaChunked(editFile, (progress) => {
                        setUploadProgress(progress);
                    });
                    mediaUrl = chunkResult.media_url;
                    mediaPath = chunkResult.media_path;
                    mediaType = chunkResult.media_type;
                    thumbnailUrl = chunkResult.thumbnail_url || null;
                }
            }

            const payload: Record<string, any> = {
                    title: editTitle,
                    duration_seconds: editDuration,
                    target_orientation: editOrientation,
                    is_global: editIsGlobal,
                    store_ids: editIsGlobal ? [] : editSelectedStores,
                    starts_at: editStartsAt || null,
                    ends_at: editEndsAt || null,
                    status: editStatus,
                };

                // Incluir dados de midia apenas se um novo arquivo foi enviado
                if (mediaUrl && mediaPath) {
                    payload.media_url = mediaUrl;
                    payload.media_path = mediaPath;
                    payload.media_type = mediaType;
                    payload.thumbnail_url = thumbnailUrl;
                } else if (editFile) {
                    payload.file = editFile;
                }

            await updateAd.mutateAsync({
                id: editingAd.id,
                payload,
            });

            setEditingAd(null);
        } catch (err: any) {
            toast.error(err?.message || 'Erro ao salvar alterações.');
        } finally {
            setIsUploadingChunked(false);
            setUploadProgress(null);
        }
    };

    const resetForm = () => {
        setFormTitle('');
        setFormFile(null);
        setFormFilePreview(null);
        setFormFileType('image');
        setFormDuration(10);
        setFormOrientation('all');
        setFormIsGlobal(true);
        setFormSelectedStores([]);
        setFormStartsAt('');
        setFormEndsAt('');
        setUploadProgress(null);
    };

    const handleCopyLink = async (url: string, slug: string) => {
        await navigator.clipboard.writeText(url);
        setCopiedSlug(slug);
        toast.success('Link da TV copiado para a área de transferência!');
        setTimeout(() => setCopiedSlug(null), 2500);
    };

    const toggleStoreSelection = (storeId: number) => {
        if (formSelectedStores.includes(storeId)) {
            setFormSelectedStores(formSelectedStores.filter((id) => id !== storeId));
        } else {
            setFormSelectedStores([...formSelectedStores, storeId]);
        }
    };

    const toggleEditStoreSelection = (storeId: number) => {
        if (editSelectedStores.includes(storeId)) {
            setEditSelectedStores(editSelectedStores.filter((id) => id !== storeId));
        } else {
            setEditSelectedStores([...editSelectedStores, storeId]);
        }
    };

    const handleToggleStatus = async (ad: TvAd) => {
        const newStatus: TvAdStatus = ad.status === 'active' ? 'inactive' : 'active';
        await updateAd.mutateAsync({
            id: ad.id,
            payload: { status: newStatus },
        });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Deseja realmente remover este anúncio permanentemente?')) return;
        await deleteAd.mutateAsync(id);
    };

    const toggleExpandLog = (id: number) => {
        if (expandedLogs.includes(id)) {
            setExpandedLogs(expandedLogs.filter((i) => i !== id));
        } else {
            setExpandedLogs([...expandedLogs, id]);
        }
    };

    const handleRemoteAction = async (
        screenId: number,
        command: 'reload' | 'next' | 'pause' | 'play' | 'clear_cache' | 'turn_off' | 'turn_on' | 'toggle_power'
    ) => {
        // Enviar postMessage instantâneo para eventuais iframes/janelas simuladoras abertas na tela
        try {
            window.postMessage({ command }, '*');
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach((iframe) => {
                iframe.contentWindow?.postMessage({ command }, '*');
            });
        } catch {
            // Ignore
        }

        await sendCommand.mutateAsync({ screenId, command });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Tv className="h-8 w-8 text-primary" />
                        TVs & Anúncios de Loja
                    </h1>
                    <p className="text-muted-foreground">
                        Gerencie a grade de fotos e vídeos transmitidos nas vitrines de todas as filiais.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 shadow-md">
                                <Plus className="h-4 w-4" />
                                Novo Anúncio
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Upload className="h-5 w-5 text-primary" />
                                    Cadastrar Novo Anúncio
                                </DialogTitle>
                                <DialogDescription>
                                    Envie uma foto (arte de propaganda) ou vídeo promocional para rodar nas TVs.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-2">
                                {/* Título */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="title">Título do Anúncio *</Label>
                                    <Input
                                        id="title"
                                        placeholder="Ex: Campanha Películas Pro 2026"
                                        value={formTitle}
                                        onChange={(e) => setFormTitle(e.target.value)}
                                    />
                                </div>

                                {/* Upload Área */}
                                <div className="space-y-1.5">
                                    <Label>Arquivo de Mídia (Foto ou Vídeo) *</Label>
                                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition cursor-pointer relative">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                        {formFilePreview ? (
                                            <div className="space-y-2">
                                                {formFileType === 'video' ? (
                                                    <video
                                                        src={formFilePreview}
                                                        className="max-h-48 mx-auto rounded border"
                                                        controls
                                                        muted
                                                    />
                                                ) : (
                                                    <img
                                                        src={formFilePreview}
                                                        alt="Preview"
                                                        className="max-h-48 mx-auto rounded border object-contain"
                                                    />
                                                )}
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    {formFile?.name} ({formatFileSize(formFile?.size)})
                                                </p>
                                                <Button size="sm" variant="outline" type="button">
                                                    Trocar Arquivo
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="py-6 flex flex-col items-center justify-center gap-2">
                                                <Upload className="h-8 w-8 text-muted-foreground" />
                                                <p className="text-sm font-medium">
                                                    Clique ou arraste um arquivo aqui
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Formatos: JPG, PNG, WEBP (fotos) ou MP4, WEBM (vídeos até 100MB)
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Duração e Orientação */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="duration">Duração do Slide (segundos)</Label>
                                        <Input
                                            id="duration"
                                            type="number"
                                            min={3}
                                            max={300}
                                            value={formDuration}
                                            onChange={(e) => setFormDuration(Number(e.target.value))}
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            {formFileType === 'video' ? 'Vídeos tocam até o final' : 'Tempo em tela'}
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Orientação Alvo</Label>
                                        <Select
                                            value={formOrientation}
                                            onValueChange={(val: TvOrientation) => setFormOrientation(val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas as Telas (Auto)</SelectItem>
                                                <SelectItem value="horizontal">Apenas Horizontal (16:9)</SelectItem>
                                                <SelectItem value="vertical">Apenas Vertical (9:16)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Destino: Global vs Específico */}
                                <div className="space-y-3 border rounded-lg p-3.5 bg-muted/20">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold flex items-center gap-1.5">
                                                <Globe className="h-4 w-4 text-primary" />
                                                Exibir em Todas as Lojas
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Se desativado, você pode escolher lojas específicas.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={formIsGlobal}
                                            onCheckedChange={setFormIsGlobal}
                                        />
                                    </div>

                                    {!formIsGlobal && (
                                        <div className="pt-2 border-t space-y-2">
                                            <Label className="text-xs font-semibold">
                                                Selecione as Lojas de Destino:
                                            </Label>
                                            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                                                {stores.map((s) => {
                                                    const isChecked = formSelectedStores.includes(s.id);
                                                    return (
                                                        <button
                                                            key={s.id}
                                                            type="button"
                                                            onClick={() => toggleStoreSelection(s.id)}
                                                            className={`text-left text-xs p-2 rounded border flex items-center justify-between transition ${
                                                                isChecked
                                                                    ? 'border-primary bg-primary/10 font-medium'
                                                                    : 'hover:bg-muted'
                                                            }`}
                                                        >
                                                            <span className="truncate">{s.name}</span>
                                                            {isChecked && <CheckCircle className="h-3.5 w-3.5 text-primary ml-1 shrink-0" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Agendamento / Validade */}
                                <div className="grid grid-cols-2 gap-4 border rounded-lg p-3.5 bg-muted/10">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="starts_at" className="text-xs">Data de Início (Opcional)</Label>
                                        <Input
                                            id="starts_at"
                                            type="datetime-local"
                                            value={formStartsAt}
                                            onChange={(e) => setFormStartsAt(e.target.value)}
                                            className="text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ends_at" className="text-xs">Data de Término (Auto-Ocultar)</Label>
                                        <Input
                                            id="ends_at"
                                            type="datetime-local"
                                            value={formEndsAt}
                                            onChange={(e) => setFormEndsAt(e.target.value)}
                                            className="text-xs"
                                        />
                                    </div>
                                    <p className="col-span-2 text-[11px] text-muted-foreground">
                                        Ao atingir a data de término, o anúncio sai da grade das TVs automaticamente.
                                    </p>
                                </div>
                                {/* Barra de Progresso de Upload em Tempo Real */}
                                {uploadProgress && (
                                    <div className="space-y-2 p-3.5 rounded-lg bg-primary/10 border border-primary/20 animate-in fade-in">
                                        <div className="flex items-center justify-between text-xs font-semibold text-primary">
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                                                {uploadProgress.message || 'Processando upload de alta velocidade...'}
                                            </span>
                                            <span className="font-mono text-sm">{uploadProgress.percent}%</span>
                                        </div>
                                        <div className="w-full bg-primary/20 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-primary h-full transition-all duration-300 rounded-full"
                                                style={{ width: `${uploadProgress.percent}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                                            <span>Parte {uploadProgress.currentChunk} de {uploadProgress.totalChunks}</span>
                                            <span>
                                                {(uploadProgress.uploadedBytes / (1024 * 1024)).toFixed(1)} MB / {(uploadProgress.totalBytes / (1024 * 1024)).toFixed(1)} MB
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setCreateOpen(false)}
                                    disabled={isUploadingChunked || createAd.isPending}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleCreateAd}
                                    disabled={isUploadingChunked || createAd.isPending}
                                    className="gap-2"
                                >
                                    {(isUploadingChunked || createAd.isPending) && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    {isUploadingChunked
                                        ? `Enviando (${uploadProgress?.percent || 0}%)...`
                                        : createAd.isPending
                                        ? 'Publicando Anúncio...'
                                        : 'Publicar Anúncio'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Telemetry / Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Telas Ativas</p>
                            <h3 className="text-2xl font-bold mt-1 text-green-600">
                                {stats?.online_screens ?? 0} <span className="text-xs font-normal text-muted-foreground">/ {stats?.total_screens ?? 0}</span>
                            </h3>
                        </div>
                        <Radio className="h-8 w-8 text-green-500/30" />
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-primary shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Anúncios Ativos</p>
                            <h3 className="text-2xl font-bold mt-1">
                                {stats?.active_ads_count ?? 0}
                            </h3>
                        </div>
                        <Activity className="h-8 w-8 text-primary/30" />
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Visualizações Hoje</p>
                            <h3 className="text-2xl font-bold mt-1 text-blue-600">
                                {stats?.impressions_today ?? 0}
                            </h3>
                        </div>
                        <Eye className="h-8 w-8 text-blue-500/30" />
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tempo no Ar Hoje</p>
                            <h3 className="text-2xl font-bold mt-1 text-amber-600">
                                {stats?.airtime_today_minutes ?? 0} <span className="text-xs font-normal text-muted-foreground">min</span>
                            </h3>
                        </div>
                        <TrendingUp className="h-8 w-8 text-amber-500/30" />
                    </CardContent>
                </Card>
            </div>

            {/* Tabs & Content */}
            <Tabs value={tab} onValueChange={(val: any) => setTab(val)}>
                <TabsList className="grid w-full sm:w-[840px] grid-cols-5">
                    <TabsTrigger value="ads" className="gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Grade ({ads.length})
                    </TabsTrigger>
                    <TabsTrigger value="screens" className="gap-2">
                        <Tv className="h-4 w-4" />
                        TVs ({screens.length})
                    </TabsTrigger>
                    <TabsTrigger value="design" className="gap-2">
                        <Palette className="h-4 w-4" />
                        Estúdio de Design
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Estatísticas & Uptime
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Logs & Auditoria
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: GRADE DE ANÚNCIOS COM BOTÃO EDITAR */}
                <TabsContent value="ads" className="space-y-4">
                    {/* Filtros */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-wrap gap-3">
                                <div className="flex-1 min-w-[200px]">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar anúncio por título..."
                                            className="pl-9"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas as Mídias</SelectItem>
                                        <SelectItem value="image">Apenas Fotos</SelectItem>
                                        <SelectItem value="video">Apenas Vídeos</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={storeFilter} onValueChange={setStoreFilter}>
                                    <SelectTrigger className="w-[170px]">
                                        <SelectValue placeholder="Loja" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas as Lojas</SelectItem>
                                        {stores.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos Status</SelectItem>
                                        <SelectItem value="active">Ativos</SelectItem>
                                        <SelectItem value="inactive">Pausados</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cards de Anúncios */}
                    {adsLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : ads.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Tv className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
                                <h3 className="text-lg font-semibold">Nenhum anúncio cadastrado</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Adicione fotos ou vídeos promocionais para começar a exibir nas TVs das lojas.
                                </p>
                                <Button onClick={() => setCreateOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Criar Primeiro Anúncio
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {ads.map((ad: any) => {
                                const isVideo = ad.media_type === 'video';
                                const isActive = ad.status === 'active';

                                return (
                                    <Card key={ad.id} className="overflow-hidden flex flex-col group border shadow-sm hover:shadow-md transition">
                                        {/* Mídia Container */}
                                        <div
                                            className="relative aspect-video bg-black/90 cursor-pointer overflow-hidden flex items-center justify-center"
                                            onClick={() => setPreviewAd(ad)}
                                        >
                                            {isVideo ? (
                                                <video
                                                    src={`${ad.media_url}#t=0.001`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300 pointer-events-none"
                                                    muted
                                                    playsInline
                                                    preload="metadata"
                                                />
                                            ) : (
                                                <img
                                                    src={ad.media_url}
                                                    alt={ad.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                />
                                            )}

                                            {/* Badges de sobreposição */}
                                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                                <Badge variant="secondary" className="bg-black/70 text-white backdrop-blur-md text-[11px] gap-1">
                                                    {isVideo ? <Video className="h-3 w-3 text-red-400" /> : <ImageIcon className="h-3 w-3 text-blue-400" />}
                                                    {isVideo ? 'Vídeo' : 'Foto'}
                                                </Badge>
                                                <Badge variant="secondary" className="bg-black/70 text-white backdrop-blur-md text-[11px] gap-1">
                                                    <Clock className="h-3 w-3 text-amber-400" />
                                                    {ad.duration_seconds}s
                                                </Badge>
                                            </div>

                                            <div className="absolute top-2.5 right-2.5">
                                                <Badge
                                                    className={
                                                        isActive
                                                            ? 'bg-green-600 text-white'
                                                            : 'bg-zinc-600 text-white'
                                                    }
                                                >
                                                    {isActive ? 'Ativo' : 'Pausado'}
                                                </Badge>
                                            </div>

                                            {/* Play Icon hover */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <Button size="icon" variant="secondary" className="rounded-full shadow-lg">
                                                    <Play className="h-5 w-5 fill-current" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Informações */}
                                        <CardContent className="p-4 flex-1 flex flex-col justify-between gap-3">
                                            <div>
                                                <h4 className="font-semibold text-base line-clamp-1" title={ad.title}>
                                                    {ad.title}
                                                </h4>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                                    {ad.is_global ? (
                                                        <span className="flex items-center gap-1 text-primary font-medium">
                                                            <Globe className="h-3 w-3" />
                                                            Todas as Lojas (Global)
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                                                            <StoreIcon className="h-3 w-3" />
                                                            {ad.target_stores?.length || 0} {ad.target_stores?.length === 1 ? 'Loja Selecionada' : 'Lojas Selecionadas'}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Estatísticas de Exibição */}
                                                <div className="mt-2.5 grid grid-cols-2 gap-2 bg-muted/40 p-2 rounded-lg text-xs">
                                                    <div>
                                                        <span className="text-muted-foreground text-[11px]">Exibições:</span>
                                                        <p className="font-semibold text-foreground flex items-center gap-1">
                                                            <Eye className="h-3 w-3 text-blue-500" />
                                                            {ad.impressions_count ?? 0} vezes
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground text-[11px]">Tempo Total:</span>
                                                        <p className="font-semibold text-foreground flex items-center gap-1">
                                                            <Clock className="h-3 w-3 text-amber-500" />
                                                            {ad.total_airtime_minutes ?? 0} min
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Validade */}
                                                {(ad.starts_at || ad.ends_at) && (
                                                    <div className="mt-2 text-[11px] bg-muted/60 p-1.5 rounded font-mono text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                                                        <span>
                                                            {ad.starts_at ? new Date(ad.starts_at).toLocaleDateString() : 'Início imediato'} ➔ {ad.ends_at ? new Date(ad.ends_at).toLocaleDateString() : 'Sem expiração'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Ações: Status, Editar e Excluir */}
                                            <div className="flex items-center justify-between pt-2 border-t">
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={isActive}
                                                        onCheckedChange={() => handleToggleStatus(ad)}
                                                    />
                                                    <span className="text-xs text-muted-foreground">
                                                        {isActive ? 'Exibindo' : 'Pausado'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 gap-1 text-xs px-2.5"
                                                        onClick={() => openEditModal(ad)}
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                                                        Editar
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                                        onClick={() => handleDelete(ad.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* TAB 2: LINKS DAS TELAS POR LOJA & LIGAR/DESLIGAR (STANDBY) */}
                <TabsContent value="screens" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Monitor className="h-5 w-5 text-primary" />
                                Dispositivos & Links das TVs por Loja
                            </CardTitle>
                            <CardDescription>
                                Monitoramento ao vivo, controle remoto e função de Ligar/Desligar (Standby) para economizar as TVs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {screensLoading ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-14 bg-muted animate-pulse rounded" />
                                    ))}
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Loja Física</TableHead>
                                            <TableHead>Status / Transmissão Ao Vivo</TableHead>
                                            <TableHead>Link Único</TableHead>
                                            <TableHead className="text-right">Ações & Controle Remoto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {screens.map((screen) => {
                                            const isOnline = screen.is_online;
                                            const isBlackout = screen.is_blackout;
                                            const tvUrl = `${window.location.origin}/tv/${screen.slug}`;

                                            return (
                                                <TableRow key={screen.screen_id} className={isBlackout ? 'bg-muted/30 opacity-80' : ''}>
                                                    <TableCell className="font-semibold">
                                                        <div className="flex items-center gap-2">
                                                            <StoreIcon className="h-4 w-4 text-muted-foreground" />
                                                            {screen.store_name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                {isBlackout ? (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="bg-zinc-800 text-zinc-300 border-zinc-700 gap-1"
                                                                    >
                                                                        <Moon className="h-3 w-3 text-amber-400" />
                                                                        ⚫ Standby (Desligada)
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={
                                                                            isOnline
                                                                                ? 'bg-green-500/10 text-green-600 border-green-500/30'
                                                                                : 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30'
                                                                        }
                                                                    >
                                                                        {isOnline ? '🟢 Online' : '⚪ Desconectada'}
                                                                    </Badge>
                                                                )}

                                                                {!isBlackout && isOnline && screen.fps && (
                                                                    <span className="text-[11px] font-mono text-muted-foreground">
                                                                        {screen.fps} FPS
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {!isBlackout && isOnline && screen.current_ad_title && (
                                                                <p className="text-xs text-muted-foreground truncate max-w-xs">
                                                                    ▶ Passando agora: <span className="font-medium text-foreground">{screen.current_ad_title}</span>
                                                                </p>
                                                            )}
                                                            {isBlackout && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Tela apagada pelo ERP (economizando painel).
                                                                </p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono select-all">
                                                            {tvUrl}
                                                        </code>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* Botão Liga/Desliga Rápido */}
                                                            {isBlackout ? (
                                                                <Button
                                                                    size="sm"
                                                                    className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                    onClick={() => handleRemoteAction(screen.screen_id, 'turn_on')}
                                                                >
                                                                    <Sun className="h-3.5 w-3.5" />
                                                                    Ligar TV
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="gap-1 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                                    onClick={() => handleRemoteAction(screen.screen_id, 'turn_off')}
                                                                >
                                                                    <Power className="h-3.5 w-3.5 text-rose-500" />
                                                                    Desligar (Standby)
                                                                </Button>
                                                            )}

                                                            {/* Dropdown de Controle Remoto */}
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button size="sm" variant="outline" className="gap-1 text-xs">
                                                                        <Sliders className="h-3.5 w-3.5 text-primary" />
                                                                        Controle
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-56">
                                                                    <DropdownMenuLabel className="text-xs">
                                                                        Controle Remoto da TV
                                                                    </DropdownMenuLabel>
                                                                    <DropdownMenuSeparator />
                                                                    {isBlackout ? (
                                                                        <DropdownMenuItem
                                                                            className="gap-2 cursor-pointer text-xs text-emerald-600 font-semibold"
                                                                            onClick={() => handleRemoteAction(screen.screen_id, 'turn_on')}
                                                                        >
                                                                            <Sun className="h-3.5 w-3.5" />
                                                                            Ligar Tela da TV
                                                                        </DropdownMenuItem>
                                                                    ) : (
                                                                        <DropdownMenuItem
                                                                            className="gap-2 cursor-pointer text-xs text-rose-600"
                                                                            onClick={() => handleRemoteAction(screen.screen_id, 'turn_off')}
                                                                        >
                                                                            <Moon className="h-3.5 w-3.5" />
                                                                            Desligar Tela (Tela Preta)
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="gap-2 cursor-pointer text-xs"
                                                                        onClick={() => handleRemoteAction(screen.screen_id, 'reload')}
                                                                    >
                                                                        <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
                                                                        Recarregar Grade da TV
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="gap-2 cursor-pointer text-xs"
                                                                        onClick={() => handleRemoteAction(screen.screen_id, 'next')}
                                                                    >
                                                                        <SkipForward className="h-3.5 w-3.5 text-emerald-500" />
                                                                        Pular para Próximo Slide
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="gap-2 cursor-pointer text-xs"
                                                                        onClick={() => handleRemoteAction(screen.screen_id, 'pause')}
                                                                    >
                                                                        <Pause className="h-3.5 w-3.5 text-amber-500" />
                                                                        Congelar / Pausar
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="gap-2 cursor-pointer text-xs"
                                                                        onClick={() => handleRemoteAction(screen.screen_id, 'play')}
                                                                    >
                                                                        <Play className="h-3.5 w-3.5 text-green-500" />
                                                                        Continuar Reprodução
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="gap-2 cursor-pointer text-xs text-rose-500 hover:text-rose-600"
                                                                        onClick={() => handleRemoteAction(screen.screen_id, 'clear_cache')}
                                                                    >
                                                                        <HardDrive className="h-3.5 w-3.5" />
                                                                        Limpar Cache Offline
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>

                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="gap-1 text-xs"
                                                                onClick={() => handleCopyLink(tvUrl, screen.slug)}
                                                            >
                                                                {copiedSlug === screen.slug ? (
                                                                    <>
                                                                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                                                        Copiado!
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Copy className="h-3.5 w-3.5" />
                                                                        Copiar Link
                                                                    </>
                                                                )}
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                className="gap-1 text-xs"
                                                                onClick={() => setSimulatorScreen(screen.slug)}
                                                            >
                                                                <Eye className="h-3.5 w-3.5" />
                                                                Simular TV
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                className="gap-1 text-xs"
                                                                asChild
                                                            >
                                                                <a href={tvUrl} target="_blank" rel="noopener noreferrer">
                                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                                    Abrir
                                                                </a>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: ESTÚDIO DE DESIGN & OVERLAYS VISUAIS (WYSIWYG) */}
                <TabsContent value="design" className="space-y-4">
                    <TvDesignStudio />
                </TabsContent>

                {/* TAB 4: ESTATÍSTICAS AVANÇADAS, UPTIME & GRÁFICOS POR LOJA */}
                <TabsContent value="analytics" className="space-y-4">
                    <TvStoreAnalytics />
                </TabsContent>

                {/* TAB 4: LOGS HUMANIZADOS & EVENTOS EM TEMPO REAL */}
                <TabsContent value="logs" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Histórico de Atividades & Telemetria
                                </CardTitle>
                                <CardDescription>
                                    Acompanhe uploads de anúncios, comandos remotos, conexões de TVs e exibições.
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Select value={logStoreFilter} onValueChange={setLogStoreFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Todas as Lojas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-primary" />
                                                <span>Todas as Lojas</span>
                                            </div>
                                        </SelectItem>
                                        {stores.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                <div className="flex items-center gap-2">
                                                    <StoreIcon className="h-4 w-4 text-muted-foreground" />
                                                    <span>{s.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={logLevelFilter} onValueChange={setLogLevelFilter}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Nível" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os Eventos</SelectItem>
                                        <SelectItem value="info">Informações Gerais</SelectItem>
                                        <SelectItem value="warning">Avisos e Exclusões</SelectItem>
                                        <SelectItem value="error">Erros e Falhas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {logsLoading ? (
                                <div className="space-y-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                                    ))}
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Activity className="mx-auto h-10 w-10 opacity-30 mb-2" />
                                    <p className="text-sm font-medium">Nenhum evento registrado recentemente.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {logs.map((log: any) => {
                                        const eventCfg = getEventConfig(log.event, log.level);
                                        const isExpanded = expandedLogs.includes(log.id);
                                        const ctx = log.context || {};

                                        return (
                                            <div
                                                key={log.id}
                                                className="p-3.5 rounded-xl border bg-card hover:bg-muted/20 transition shadow-sm space-y-2.5"
                                            >
                                                {/* Linha Superior: Ícone, Título Amigável, Loja e Data */}
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        {eventCfg.icon}
                                                        <span className="font-semibold text-sm text-foreground">
                                                            {eventCfg.title}
                                                        </span>
                                                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${eventCfg.badgeClass}`}>
                                                            {log.level === 'info' ? 'INFORMAÇÃO' : log.level === 'warning' ? 'AVISO' : log.level === 'error' ? 'ERRO' : log.level.toUpperCase()}
                                                        </Badge>
                                                        {log.store?.name && (
                                                            <Badge variant="secondary" className="text-[10px] gap-1 bg-muted">
                                                                <StoreIcon className="h-3 w-3" />
                                                                {log.store.name}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <span className="text-xs text-muted-foreground font-medium">
                                                        {new Date(log.created_at).toLocaleString('pt-BR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit',
                                                        })}
                                                    </span>
                                                </div>

                                                {/* Mensagem Humana */}
                                                <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                                                    {log.message}
                                                </p>

                                                {/* Tags / Pills de Metadados Amigáveis */}
                                                <div className="flex flex-wrap items-center gap-1.5 pl-6 pt-1">
                                                    {ctx.media_type && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground/80">
                                                            {ctx.media_type === 'video' ? <Video className="h-3 w-3 text-red-500" /> : <ImageIcon className="h-3 w-3 text-blue-500" />}
                                                            {ctx.media_type === 'video' ? 'Vídeo (MP4)' : 'Foto (Imagem)'}
                                                        </span>
                                                    )}

                                                    {ctx.duration_seconds && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground/80">
                                                            <Clock className="h-3 w-3 text-amber-500" />
                                                            {ctx.duration_seconds}s
                                                        </span>
                                                    )}

                                                    {ctx.file_size !== undefined && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground/80 font-mono">
                                                            <HardDrive className="h-3 w-3 text-muted-foreground" />
                                                            {formatFileSize(ctx.file_size)}
                                                        </span>
                                                    )}

                                                    {ctx.user_name && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground/80">
                                                            <User className="h-3 w-3 text-primary" />
                                                            {ctx.user_name}
                                                        </span>
                                                    )}

                                                    {ctx.command && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 text-[11px] font-medium">
                                                            <Sliders className="h-3 w-3 text-purple-500" />
                                                            {ctx.command_pt || (ctx.command === 'turn_off' ? 'Desligar Tela (Standby)' : ctx.command === 'turn_on' ? 'Ligar Tela' : ctx.command === 'reload' ? 'Recarregar Grade' : ctx.command === 'next' ? 'Pular Slide' : ctx.command === 'pause' ? 'Pausar' : ctx.command === 'play' ? 'Retomar' : ctx.command === 'clear_cache' ? 'Limpar Cache' : ctx.command)}
                                                        </span>
                                                    )}

                                                    {ctx.ad_id && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground/80">
                                                            <Target className="h-3 w-3 text-primary" />
                                                            Anúncio #{ctx.ad_id}
                                                        </span>
                                                    )}

                                                    {/* Botão de toggle para JSON técnico */}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleExpandLog(log.id)}
                                                        className="ml-auto text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition"
                                                    >
                                                        <FileCode className="h-3 w-3" />
                                                        {isExpanded ? 'Ocultar JSON' : 'Ver Dados Técnicos'}
                                                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                    </button>
                                                </div>

                                                {/* Detalhes Técnicos JSON (Colapsável) */}
                                                {isExpanded && ctx && Object.keys(ctx).length > 0 && (
                                                    <div className="pl-6 pt-2">
                                                        <pre className="text-[11px] bg-zinc-950 text-zinc-300 p-2.5 rounded-lg overflow-x-auto font-mono border border-zinc-800">
                                                            {JSON.stringify(ctx, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* MODAL DE EDIÇÃO DE ANÚNCIO (DURAÇÃO, TÍTULO, DESTINO, AGENDAMENTO) */}
            <Dialog open={!!editingAd} onOpenChange={(open) => !open && setEditingAd(null)}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit3 className="h-5 w-5 text-primary" />
                            Editar Anúncio
                        </DialogTitle>
                        <DialogDescription>
                            Altere o tempo de tela do slide, título, filiais de exibição ou substitua a foto/vídeo.
                        </DialogDescription>
                    </DialogHeader>

                    {editingAd && (
                        <div className="space-y-4 py-2">
                            {/* Título */}
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_title">Título do Anúncio *</Label>
                                <Input
                                    id="edit_title"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                />
                            </div>

                            {/* Duração e Orientação */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_duration">Duração do Slide (segundos) *</Label>
                                    <Input
                                        id="edit_duration"
                                        type="number"
                                        min={3}
                                        max={300}
                                        value={editDuration}
                                        onChange={(e) => setEditDuration(Number(e.target.value))}
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Tempo que o anúncio fica visível antes de passar ao próximo.
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Orientação Alvo</Label>
                                    <Select
                                        value={editOrientation}
                                        onValueChange={(val: TvOrientation) => setEditOrientation(val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas as Telas (Auto)</SelectItem>
                                            <SelectItem value="horizontal">Apenas Horizontal (16:9)</SelectItem>
                                            <SelectItem value="vertical">Apenas Vertical (9:16)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Substituição Opcional de Mídia */}
                            <div className="space-y-1.5 border rounded-lg p-3 bg-muted/20">
                                <Label className="text-xs font-semibold">Substituir Arquivo de Mídia (Opcional)</Label>
                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-16 rounded bg-black flex items-center justify-center overflow-hidden shrink-0 border">
                                        {editFilePreview ? (
                                            <img src={editFilePreview} alt="New Preview" className="w-full h-full object-cover" />
                                        ) : editingAd.media_type === 'video' ? (
                                            <Video className="h-6 w-6 text-red-400" />
                                        ) : (
                                            <img src={editingAd.media_url} alt="Current" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                                            onChange={handleEditFileChange}
                                            className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                        />
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            Deixe em branco para manter a mídia atual.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Destino: Global vs Específico */}
                            <div className="space-y-3 border rounded-lg p-3.5 bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-semibold flex items-center gap-1.5">
                                            <Globe className="h-4 w-4 text-primary" />
                                            Exibir em Todas as Lojas
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Se desativado, você pode escolher lojas específicas.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={editIsGlobal}
                                        onCheckedChange={setEditIsGlobal}
                                    />
                                </div>

                                {!editIsGlobal && (
                                    <div className="pt-2 border-t space-y-2">
                                        <Label className="text-xs font-semibold">
                                            Lojas de Destino:
                                        </Label>
                                        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                                            {stores.map((s) => {
                                                const isChecked = editSelectedStores.includes(s.id);
                                                return (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => toggleEditStoreSelection(s.id)}
                                                        className={`text-left text-xs p-2 rounded border flex items-center justify-between transition ${
                                                            isChecked
                                                                ? 'border-primary bg-primary/10 font-medium'
                                                                : 'hover:bg-muted'
                                                        }`}
                                                    >
                                                        <span className="truncate">{s.name}</span>
                                                        {isChecked && <CheckCircle className="h-3.5 w-3.5 text-primary ml-1 shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Agendamento / Validade */}
                            <div className="grid grid-cols-2 gap-4 border rounded-lg p-3.5 bg-muted/10">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_starts_at" className="text-xs">Data de Início</Label>
                                    <Input
                                        id="edit_starts_at"
                                        type="datetime-local"
                                        value={editStartsAt}
                                        onChange={(e) => setEditStartsAt(e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_ends_at" className="text-xs">Data de Término (Auto-Ocultar)</Label>
                                    <Input
                                        id="edit_ends_at"
                                        type="datetime-local"
                                        value={editEndsAt}
                                        onChange={(e) => setEditEndsAt(e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center justify-between pt-1">
                                <Label className="text-xs font-medium">Status do Anúncio</Label>
                                <Select value={editStatus} onValueChange={(val: TvAdStatus) => setEditStatus(val)}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Ativo (Exibindo)</SelectItem>
                                        <SelectItem value="inactive">Pausado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Barra de Progresso de Upload na Edição */}
                            {uploadProgress && (
                                <div className="space-y-2 p-3.5 rounded-lg bg-primary/10 border border-primary/20 animate-in fade-in">
                                    <div className="flex items-center justify-between text-xs font-semibold text-primary">
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                                            {uploadProgress.message || 'Processando upload do novo arquivo...'}
                                        </span>
                                        <span className="font-mono text-sm">{uploadProgress.percent}%</span>
                                    </div>
                                    <div className="w-full bg-primary/20 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-primary h-full transition-all duration-300 rounded-full"
                                            style={{ width: `${uploadProgress.percent}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                                        <span>Parte {uploadProgress.currentChunk} de {uploadProgress.totalChunks}</span>
                                        <span>
                                            {(uploadProgress.uploadedBytes / (1024 * 1024)).toFixed(1)} MB / {(uploadProgress.totalBytes / (1024 * 1024)).toFixed(1)} MB
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditingAd(null)}
                            disabled={isUploadingChunked || updateAd.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveEdit}
                            disabled={isUploadingChunked || updateAd.isPending}
                            className="gap-2"
                        >
                            {(isUploadingChunked || updateAd.isPending) && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            {isUploadingChunked
                                ? `Enviando (${uploadProgress?.percent || 0}%)...`
                                : updateAd.isPending
                                ? 'Salvando...'
                                : 'Salvar Alterações'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Preview de Anúncio */}
            <Dialog open={!!previewAd} onOpenChange={(open) => !open && setPreviewAd(null)}>
                <DialogContent className="sm:max-w-2xl bg-black/95 text-white border-zinc-800">
                    <DialogHeader>
                        <DialogTitle className="text-white">{previewAd?.title}</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Tempo em tela: {previewAd?.duration_seconds} segundos
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center p-2 min-h-[300px]">
                        {previewAd?.media_type === 'video' ? (
                            <video
                                key={previewAd.media_url}
                                src={previewAd.media_url}
                                className="max-h-[60vh] max-w-full rounded shadow-2xl"
                                controls
                                autoPlay
                                muted
                                playsInline
                                preload="auto"
                            />
                        ) : (
                            <img
                                src={previewAd?.media_url}
                                alt={previewAd?.title}
                                className="max-h-[60vh] max-w-full rounded object-contain shadow-2xl"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal Simulador de TV */}
            <Dialog open={!!simulatorScreen} onOpenChange={(open) => !open && setSimulatorScreen(null)}>
                <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-4 bg-zinc-950 text-white border-zinc-800">
                    <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-800">
                        <div>
                            <DialogTitle className="text-white flex items-center gap-2">
                                <Tv className="h-5 w-5 text-primary" />
                                Simulador de TV ao Vivo: {simulatorScreen}
                            </DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                Visualização em tempo real da transmissão da TV Box da loja.
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 bg-black rounded-lg overflow-hidden border border-zinc-800 relative">
                        {simulatorScreen && (
                            <iframe
                                src={`/tv/${simulatorScreen}`}
                                className="w-full h-full border-0"
                                title="TV Simulator"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
