import React, { useState, useEffect, useRef } from 'react';
import {
    Tv,
    Clock,
    Store as StoreIcon,
    Globe,
    Sparkles,
    Palette,
    QrCode,
    MessageSquare,
    Save,
    RotateCcw,
    Layers,
    Sliders,
    UploadCloud,
    CheckCircle2,
    Maximize2,
    Type,
    Tag,
    Smartphone,
    Monitor,
    Zap,
    Flame,
    Megaphone,
    PartyPopper,
    Star,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import {
    useTvDesignSettings,
    useSaveGlobalDesign,
    useSaveStoreDesign,
    useResetStoreDesign,
    useUploadTvLogo,
} from '@/hooks/api/use-tv-ads';
import type {
    TvDesignTemplate,
    TvOverlayPosition,
    TvOverlayStyle,
    TvClockFormat,
} from '@/types/tv.types';
import {
    TvClockWidget,
    TvStoreBadgeWidget,
    TvTickerBannerWidget,
    TvQrCodeWidget,
    TvBrandingLogoWidget,
} from '@/pages/tv/widgets/TvOverlayWidgets';

const DEFAULT_TEMPLATE: TvDesignTemplate = {
    clock: {
        enabled: true,
        position: 'top-right',
        format: '24h',
        show_seconds: false,
        show_date: false,
        style: 'glass',
        size: 'md',
        color: '#ffffff',
    },
    store_badge: {
        enabled: true,
        position: 'top-left',
        custom_name: null,
        tagline: 'Acessórios Premium para Celular',
        style: 'glass',
        accent_color: '#10b981',
        pulse_dot: true,
    },
    ticker_banner: {
        enabled: false,
        text: 'Películas com garantia de troca! • Capinhas para todos os modelos de iPhone e Samsung',
        tag_prefix: '🔥 OFERTA',
        font_family: 'Inter',
        font_size: 16,
        font_weight: 'bold',
        speed: 'normal',
        bg_color: '#000000',
        bg_opacity: 0.85,
        text_color: '#ffffff',
        padding_y: 'md',
    },
    branding_logo: {
        enabled: false,
        logo_url: null,
        position: 'bottom-left',
        height_px: 48,
        opacity: 0.9,
    },
    qr_code: {
        enabled: false,
        type: 'whatsapp',
        custom_url: null,
        title: 'Chame no WhatsApp',
        title_color: '#ffffff',
        fg_color: '#000000',
        bg_color: '#ffffff',
        position: 'bottom-right',
        size: 'md',
        style: 'glass',
    },
};

// Presets de Temas Prontos
const PRESETS: {
    id: string;
    name: string;
    description: string;
    icon: any;
    color: string;
    template: Partial<TvDesignTemplate>;
}[] = [
    {
        id: 'minimal_dark',
        name: 'Minimalist Dark',
        description: 'Vidro fosco sutil, texto branco puro e acentos esmeralda',
        icon: Sparkles,
        color: '#10b981',
        template: {
            clock: { enabled: true, position: 'top-right', format: '24h', show_seconds: false, show_date: false, style: 'glass', size: 'md', color: '#ffffff' },
            store_badge: { enabled: true, position: 'top-left', custom_name: null, tagline: 'Acessórios Premium para Celular', style: 'glass', accent_color: '#10b981', pulse_dot: true },
            ticker_banner: { enabled: false, text: 'Películas com garantia de troca! • Capinhas para todos os modelos', tag_prefix: '🔥 OFERTA', font_family: 'Inter', font_size: 16, font_weight: 'bold', speed: 'normal', bg_color: '#000000', bg_opacity: 0.85, text_color: '#ffffff', padding_y: 'md' },
            qr_code: { enabled: true, type: 'whatsapp', title: 'Chame no WhatsApp', title_color: '#ffffff', fg_color: '#000000', bg_color: '#ffffff', position: 'bottom-right', size: 'md', style: 'glass' },
        },
    },
    {
        id: 'cyberpunk_neon',
        name: 'Cyberpunk Neon',
        description: 'Bordas brilhantes, relógio neon e letreiro vibrante',
        icon: Zap,
        color: '#6366f1',
        template: {
            clock: { enabled: true, position: 'top-right', format: '24h_seconds', show_seconds: true, show_date: false, style: 'neon', size: 'md', color: '#a5b4fc' },
            store_badge: { enabled: true, position: 'top-left', custom_name: null, tagline: 'Tecnologia & Inovação', style: 'neon', accent_color: '#6366f1', pulse_dot: true },
            ticker_banner: { enabled: true, text: 'Novidades toda semana • Acessórios exclusivos com garantia total', tag_prefix: '⚡ NOVIDADE', font_family: 'Space Grotesk', font_size: 18, font_weight: 'black', speed: 'normal', bg_color: '#09090b', bg_opacity: 0.95, text_color: '#818cf8', padding_y: 'md' },
            qr_code: { enabled: true, type: 'whatsapp', title: 'Atendimento Rápido', title_color: '#a5b4fc', fg_color: '#4f46e5', bg_color: '#ffffff', position: 'bottom-right', size: 'md', style: 'neon' },
        },
    },
    {
        id: 'retail_gold',
        name: 'Varejo & Oferta Gold',
        description: 'Tarja e destaques dourados ideais para promoções no comércio',
        icon: Flame,
        color: '#f59e0b',
        template: {
            clock: { enabled: true, position: 'top-right', format: '24h', show_seconds: false, show_date: true, style: 'glass', size: 'md', color: '#fef08a' },
            store_badge: { enabled: true, position: 'top-left', custom_name: null, tagline: 'As Melhores Ofertas do Dia', style: 'glass', accent_color: '#f59e0b', pulse_dot: true },
            ticker_banner: { enabled: true, text: 'Compre 2 capinhas e ganhe 1 película de vidro hoje!', tag_prefix: '🔥 OFERTA DO DIA', font_family: 'Oswald', font_size: 20, font_weight: 'bold', speed: 'fast', bg_color: '#78350f', bg_opacity: 0.95, text_color: '#fef08a', padding_y: 'lg' },
            qr_code: { enabled: true, type: 'whatsapp', title: 'Garanta seu Desconto', title_color: '#fde68a', fg_color: '#b45309', bg_color: '#fef3c7', position: 'bottom-right', size: 'md', style: 'glass' },
        },
    },
    {
        id: 'pink_brand',
        name: 'Mais Capinhas Brand',
        description: 'Identidade visual oficial da marca em tons rosa e violeta',
        icon: Star,
        color: '#ec4899',
        template: {
            clock: { enabled: true, position: 'top-right', format: '24h', show_seconds: false, show_date: true, style: 'glass', size: 'md', color: '#fbcfe8' },
            store_badge: { enabled: true, position: 'top-left', custom_name: null, tagline: 'Mais Capinhas • Loja Oficial', style: 'glass', accent_color: '#ec4899', pulse_dot: true },
            ticker_banner: { enabled: true, text: 'Personalize sua capinha com fotos ou nome • Peça no balcão!', tag_prefix: '💖 EXCLUSIVO', font_family: 'Poppins', font_size: 16, font_weight: 'bold', speed: 'normal', bg_color: '#831843', bg_opacity: 0.9, text_color: '#fdf2f8', padding_y: 'md' },
            qr_code: { enabled: true, type: 'whatsapp', title: 'Fale com a Vendedora', title_color: '#fbcfe8', fg_color: '#be185d', bg_color: '#ffffff', position: 'bottom-right', size: 'md', style: 'glass' },
        },
    },
];

const GOOGLE_FONT_OPTIONS = [
    { label: 'Inter (Moderna & Neutra)', value: 'Inter' },
    { label: 'Montserrat (Geométrica & Elegante)', value: 'Montserrat' },
    { label: 'Poppins (Arredondada & Amigável)', value: 'Poppins' },
    { label: 'Oswald (Condensada & Ofertas)', value: 'Oswald' },
    { label: 'Bebas Neue (Impacto Total)', value: 'Bebas Neue' },
    { label: 'Space Grotesk (Tech & Futurista)', value: 'Space Grotesk' },
    { label: 'Roboto (Clássica Digital)', value: 'Roboto' },
];

const COLOR_PRESETS = [
    '#ffffff',
    '#000000',
    '#10b981',
    '#6366f1',
    '#ec4899',
    '#f59e0b',
    '#3b82f6',
    '#ef4444',
    '#a855f7',
    '#14b8a6',
];

export function TvDesignStudio() {
    const [selectedScope, setSelectedScope] = useState<string>('global');
    const [template, setTemplate] = useState<TvDesignTemplate>(DEFAULT_TEMPLATE);
    const [previewOrientation, setPreviewOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
    const [previewBg, setPreviewBg] = useState<'dark' | 'light' | 'promo'>('dark');

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const { data: storesRes } = useAdminStores();
    const stores = storesRes?.data || [];

    const { data: designSettingsRes } = useTvDesignSettings();
    const saveGlobalMutation = useSaveGlobalDesign();
    const saveStoreMutation = useSaveStoreDesign();
    const resetStoreMutation = useResetStoreDesign();
    const uploadLogoMutation = useUploadTvLogo();

    const globalTemplate = designSettingsRes?.data?.global || DEFAULT_TEMPLATE;
    const storeOverrides = designSettingsRes?.data?.store_overrides || {};

    // Sincronizar estado local do formulário com o template carregado
    useEffect(() => {
        if (selectedScope === 'global') {
            setTemplate({ ...DEFAULT_TEMPLATE, ...globalTemplate });
        } else {
            const override = storeOverrides[selectedScope];
            if (override?.has_custom_template && override.template) {
                setTemplate({ ...DEFAULT_TEMPLATE, ...override.template });
            } else {
                setTemplate({ ...DEFAULT_TEMPLATE, ...globalTemplate });
            }
        }
    }, [selectedScope, designSettingsRes]);

    const isCustomOverride =
        selectedScope !== 'global' && storeOverrides[selectedScope]?.has_custom_template;

    const currentStoreName =
        selectedScope === 'global'
            ? 'Mais Capinhas (Padrão)'
            : stores.find((s) => String(s.id) === selectedScope)?.name || 'Mais Capinhas';

    const handleSave = () => {
        if (selectedScope === 'global') {
            saveGlobalMutation.mutate(template);
        } else {
            saveStoreMutation.mutate({
                storeId: Number(selectedScope),
                template,
            });
        }
    };

    const handleReset = () => {
        if (selectedScope !== 'global') {
            resetStoreMutation.mutate(Number(selectedScope));
        }
    };

    const applyPreset = (presetTemplate: Partial<TvDesignTemplate>) => {
        setTemplate((prev) => ({
            ...prev,
            ...presetTemplate,
            clock: { ...prev.clock, ...presetTemplate.clock },
            store_badge: { ...prev.store_badge, ...presetTemplate.store_badge },
            ticker_banner: { ...prev.ticker_banner, ...presetTemplate.ticker_banner },
            qr_code: { ...prev.qr_code, ...presetTemplate.qr_code },
        }));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        uploadLogoMutation.mutate(file, {
            onSuccess: (res) => {
                if (res.data?.url) {
                    updateLogo({
                        enabled: true,
                        logo_url: res.data.url,
                    });
                }
            },
        });
    };

    const updateClock = (updates: Partial<TvDesignTemplate['clock']>) => {
        setTemplate((prev) => ({
            ...prev,
            clock: { ...prev.clock, ...updates },
        }));
    };

    const updateStoreBadge = (updates: Partial<TvDesignTemplate['store_badge']>) => {
        setTemplate((prev) => ({
            ...prev,
            store_badge: { ...prev.store_badge, ...updates },
        }));
    };

    const updateTicker = (updates: Partial<TvDesignTemplate['ticker_banner']>) => {
        setTemplate((prev) => ({
            ...prev,
            ticker_banner: { ...prev.ticker_banner, ...updates },
        }));
    };

    const updateQrCode = (updates: Partial<TvDesignTemplate['qr_code']>) => {
        setTemplate((prev) => ({
            ...prev,
            qr_code: { ...prev.qr_code, ...updates },
        }));
    };

    const updateLogo = (updates: Partial<TvDesignTemplate['branding_logo']>) => {
        setTemplate((prev) => ({
            ...prev,
            branding_logo: { ...prev.branding_logo, ...updates },
        }));
    };

    return (
        <div className="space-y-6">
            {/* Barra de Controle de Escopo e Ações */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        <span className="text-sm font-semibold text-foreground">Escopo de Edição:</span>
                    </div>

                    <Select value={selectedScope} onValueChange={setSelectedScope}>
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Selecione o Escopo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="global">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-primary" />
                                    <span className="font-semibold">Padrão da Rede (Todas as Lojas)</span>
                                </div>
                            </SelectItem>
                            {stores.map((s) => {
                                const hasCustom = storeOverrides[String(s.id)]?.has_custom_template;
                                return (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        <div className="flex items-center justify-between w-full gap-2">
                                            <div className="flex items-center gap-2">
                                                <StoreIcon className="h-4 w-4 text-muted-foreground" />
                                                <span>{s.name}</span>
                                            </div>
                                            {hasCustom ? (
                                                <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                                                    Customizado
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                                    Padrão Global
                                                </Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    {isCustomOverride && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            disabled={resetStoreMutation.isPending}
                            className="gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Restaurar Padrão da Rede
                        </Button>
                    )}

                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saveGlobalMutation.isPending || saveStoreMutation.isPending}
                        className="gap-2 shadow-sm font-semibold"
                    >
                        <Save className="h-4 w-4" />
                        Salvar Alterações de Design
                    </Button>
                </div>
            </div>

            {/* Barra de Presets Rápidos (1-Click) */}
            <div className="bg-card p-4 rounded-xl border shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                            Temas Prontos (Presets de 1 Clique)
                        </span>
                    </div>
                    <span className="text-xs text-muted-foreground">Clique para aplicar instantaneamente</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {PRESETS.map((preset) => {
                        const Icon = preset.icon;
                        return (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => applyPreset(preset.template)}
                                className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/50 transition text-left group hover:border-primary/40 hover:shadow-sm"
                            >
                                <div
                                    className="p-2 rounded-md shrink-0 transition group-hover:scale-105"
                                    style={{ backgroundColor: `${preset.color}20`, color: preset.color }}
                                >
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-xs font-bold text-foreground truncate">{preset.name}</p>
                                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                                        {preset.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Grid Principal: Simulador Interativo + Painel de Configurações */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Coluna da Esquerda: Simulador ao Vivo */}
                <div className="xl:col-span-7 space-y-3">
                    <Card className="overflow-hidden border-2 border-primary/20 bg-zinc-950 shadow-2xl">
                        <CardHeader className="p-3 bg-zinc-900/90 border-b border-zinc-800 flex flex-row items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <Tv className="h-4 w-4 text-primary" />
                                <span className="text-xs font-semibold text-zinc-300">
                                    Simulador da TV em Tempo Real
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Alternador de Orientação */}
                                <div className="flex items-center bg-zinc-800 p-0.5 rounded-lg border border-zinc-700">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewOrientation('horizontal')}
                                        className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                                            previewOrientation === 'horizontal'
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        <Monitor className="h-3 w-3" />
                                        16:9
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewOrientation('vertical')}
                                        className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                                            previewOrientation === 'vertical'
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        <Smartphone className="h-3 w-3" />
                                        9:16 (Totem)
                                    </button>
                                </div>

                                {/* Alternador de Fundo */}
                                <div className="flex items-center bg-zinc-800 p-0.5 rounded-lg border border-zinc-700">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewBg('dark')}
                                        className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                                            previewBg === 'dark' ? 'bg-zinc-700 text-white' : 'text-zinc-400'
                                        }`}
                                    >
                                        Escuro
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewBg('light')}
                                        className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                                            previewBg === 'light' ? 'bg-zinc-700 text-white' : 'text-zinc-400'
                                        }`}
                                    >
                                        Claro
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewBg('promo')}
                                        className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                                            previewBg === 'promo' ? 'bg-zinc-700 text-white' : 'text-zinc-400'
                                        }`}
                                    >
                                        Arte
                                    </button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex items-center justify-center bg-zinc-950/80 min-h-[380px]">
                            {/* Canvas da TV */}
                            <div
                                className={`relative overflow-hidden flex items-center justify-center select-none shadow-2xl transition-all duration-300 ${
                                    previewOrientation === 'vertical'
                                        ? 'aspect-[9/16] w-[260px] sm:w-[300px] rounded-2xl border-4 border-zinc-800'
                                        : 'aspect-video w-full'
                                } ${
                                    previewBg === 'dark'
                                        ? 'bg-gradient-to-br from-zinc-900 via-neutral-950 to-zinc-900'
                                        : previewBg === 'light'
                                        ? 'bg-gradient-to-br from-slate-200 via-zinc-100 to-slate-300'
                                        : 'bg-gradient-to-tr from-indigo-950 via-purple-900 to-pink-900'
                                }`}
                            >
                                {/* Arte Fictícia de Demonstração */}
                                <div className="text-center space-y-2 p-6 z-10">
                                    <div className="inline-block p-3 rounded-full bg-white/10 border border-white/15 mb-1 backdrop-blur-sm">
                                        <Sparkles className={`h-8 w-8 ${previewBg === 'light' ? 'text-zinc-800' : 'text-amber-400'}`} />
                                    </div>
                                    <h4
                                        className={`text-xl font-black uppercase tracking-tight ${
                                            previewBg === 'light' ? 'text-zinc-900' : 'text-white'
                                        }`}
                                    >
                                        Mais Capinhas & Acessórios
                                    </h4>
                                    <p
                                        className={`text-xs max-w-xs mx-auto ${
                                            previewBg === 'light' ? 'text-zinc-700' : 'text-white/70'
                                        }`}
                                    >
                                        Exemplo de slide com fotos e vídeos passando a 60 FPS na vitrine da loja
                                    </p>
                                </div>

                                {/* Widgets Renderizados com a Configuração em Tempo Real */}
                                <TvClockWidget config={template.clock} />
                                <TvStoreBadgeWidget config={template.store_badge} fallbackStoreName={currentStoreName} />
                                <TvQrCodeWidget config={template.qr_code} fallbackStoreSlug="loja-demo" />
                                <TvBrandingLogoWidget config={template.branding_logo} />
                                <TvTickerBannerWidget config={template.ticker_banner} />
                            </div>
                        </CardContent>
                    </Card>

                    <p className="text-xs text-muted-foreground text-center">
                        Dica: As TVs conectadas nas lojas físicas receberão este novo layout instantaneamente ao salvar.
                    </p>
                </div>

                {/* Coluna da Direita: Painel de Abas de Configurações */}
                <div className="xl:col-span-5">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Sliders className="h-5 w-5 text-primary" />
                                Customização dos Elementos
                            </CardTitle>
                            <CardDescription>
                                Ajuste fontes, tamanhos, cores, logo e letreiro da TV.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="ticker" className="w-full">
                                <TabsList className="grid grid-cols-5 w-full mb-4">
                                    <TabsTrigger value="ticker" className="text-xs gap-1">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        Letreiro
                                    </TabsTrigger>
                                    <TabsTrigger value="qrcode" className="text-xs gap-1">
                                        <QrCode className="h-3.5 w-3.5" />
                                        QR Code
                                    </TabsTrigger>
                                    <TabsTrigger value="logo" className="text-xs gap-1">
                                        <Layers className="h-3.5 w-3.5" />
                                        Logo
                                    </TabsTrigger>
                                    <TabsTrigger value="clock" className="text-xs gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        Relógio
                                    </TabsTrigger>
                                    <TabsTrigger value="store" className="text-xs gap-1">
                                        <StoreIcon className="h-3.5 w-3.5" />
                                        Loja
                                    </TabsTrigger>
                                </TabsList>

                                {/* ======================================================== */}
                                {/* 1. ABA LETREIRO / TICKER PROMOCIONAL AVANÇADO */}
                                {/* ======================================================== */}
                                <TabsContent value="ticker" className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold">Ativar Letreiro no Rodapé</Label>
                                            <p className="text-xs text-muted-foreground">Mensagem deslizante contínua na base da TV</p>
                                        </div>
                                        <Switch
                                            checked={template.ticker_banner.enabled}
                                            onCheckedChange={(val) => updateTicker({ enabled: val })}
                                        />
                                    </div>

                                    {template.ticker_banner.enabled && (
                                        <div className="space-y-4 pt-1">
                                            {/* Texto Principal */}
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold">Texto do Letreiro</Label>
                                                <Input
                                                    placeholder="Digite o texto da promoção ou comunicado..."
                                                    value={template.ticker_banner.text}
                                                    onChange={(e) => updateTicker({ text: e.target.value })}
                                                />
                                            </div>

                                            {/* Tag / Prefixo de Destaque */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-semibold">Tag de Destaque / Prefixo</Label>
                                                    <div className="flex items-center gap-1">
                                                        {['🔥 OFERTA', '📢 AVISO', '🎉 NOVIDADE', '⭐ MAIS CAPINHAS', ''].map((t) => (
                                                            <button
                                                                key={t || 'none'}
                                                                type="button"
                                                                onClick={() => updateTicker({ tag_prefix: t || null })}
                                                                className={`px-1.5 py-0.5 rounded text-[10px] border transition ${
                                                                    (template.ticker_banner.tag_prefix || '') === t
                                                                        ? 'bg-primary text-primary-foreground font-bold'
                                                                        : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                                                                }`}
                                                            >
                                                                {t || 'Nenhum'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <Input
                                                    placeholder="Ex: 🔥 OFERTA DO DIA"
                                                    value={template.ticker_banner.tag_prefix || ''}
                                                    onChange={(e) => updateTicker({ tag_prefix: e.target.value || null })}
                                                />
                                            </div>

                                            {/* Família de Fonte e Peso */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold flex items-center gap-1">
                                                        <Type className="h-3.5 w-3.5" />
                                                        Família da Fonte
                                                    </Label>
                                                    <Select
                                                        value={template.ticker_banner.font_family || 'Inter'}
                                                        onValueChange={(val) => updateTicker({ font_family: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {GOOGLE_FONT_OPTIONS.map((f) => (
                                                                <SelectItem key={f.value} value={f.value}>
                                                                    {f.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Peso da Fonte</Label>
                                                    <Select
                                                        value={template.ticker_banner.font_weight || 'bold'}
                                                        onValueChange={(val: any) => updateTicker({ font_weight: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="normal">Normal (400)</SelectItem>
                                                            <SelectItem value="semibold">Semi-bold (600)</SelectItem>
                                                            <SelectItem value="bold">Negrito (700)</SelectItem>
                                                            <SelectItem value="black">Extra Black (900)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Tamanho da Fonte com Slider */}
                                            <div className="space-y-2 p-3 rounded-lg border bg-muted/20">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-semibold">Tamanho da Fonte</Label>
                                                    <span className="text-xs font-mono font-bold text-primary">
                                                        {template.ticker_banner.font_size || 16}px
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[template.ticker_banner.font_size || 16]}
                                                    min={12}
                                                    max={36}
                                                    step={1}
                                                    onValueChange={([val]) => updateTicker({ font_size: val })}
                                                />
                                            </div>

                                            {/* Cores: Texto e Fundo da Tarja */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Cor do Texto</Label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={template.ticker_banner.text_color || '#ffffff'}
                                                            onChange={(e) => updateTicker({ text_color: e.target.value })}
                                                            className="h-8 w-10 p-0 border rounded cursor-pointer shrink-0 bg-transparent"
                                                        />
                                                        <Input
                                                            value={template.ticker_banner.text_color || '#ffffff'}
                                                            onChange={(e) => updateTicker({ text_color: e.target.value })}
                                                            className="font-mono text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Cor da Tarja (Fundo)</Label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={template.ticker_banner.bg_color || '#000000'}
                                                            onChange={(e) => updateTicker({ bg_color: e.target.value })}
                                                            className="h-8 w-10 p-0 border rounded cursor-pointer shrink-0 bg-transparent"
                                                        />
                                                        <Input
                                                            value={template.ticker_banner.bg_color || '#000000'}
                                                            onChange={(e) => updateTicker({ bg_color: e.target.value })}
                                                            className="font-mono text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Velocidade e Altura */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Velocidade</Label>
                                                    <Select
                                                        value={template.ticker_banner.speed || 'normal'}
                                                        onValueChange={(val: any) => updateTicker({ speed: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="slow">Lenta e Suave</SelectItem>
                                                            <SelectItem value="normal">Normal</SelectItem>
                                                            <SelectItem value="fast">Rápida</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Altura da Tarja</Label>
                                                    <Select
                                                        value={template.ticker_banner.padding_y || 'md'}
                                                        onValueChange={(val: any) => updateTicker({ padding_y: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="sm">Fina (Discreta)</SelectItem>
                                                            <SelectItem value="md">Média (Padrão)</SelectItem>
                                                            <SelectItem value="lg">Robusta (Destaque)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* ======================================================== */}
                                {/* 2. ABA QR CODE COM CORES CUSTOMIZÁVEIS */}
                                {/* ======================================================== */}
                                <TabsContent value="qrcode" className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold">Ativar QR Code Dinâmico</Label>
                                            <p className="text-xs text-muted-foreground">Exibe QR Code interativo para celulares</p>
                                        </div>
                                        <Switch
                                            checked={template.qr_code.enabled}
                                            onCheckedChange={(val) => updateQrCode({ enabled: val })}
                                        />
                                    </div>

                                    {template.qr_code.enabled && (
                                        <div className="space-y-4 pt-1">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold">Título / Chamada de Ação</Label>
                                                <Input
                                                    placeholder="Chame no WhatsApp"
                                                    value={template.qr_code.title}
                                                    onChange={(e) => updateQrCode({ title: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold">Link de Destino (URL)</Label>
                                                <Input
                                                    placeholder="https://wa.me/5547999999999"
                                                    value={template.qr_code.custom_url || ''}
                                                    onChange={(e) => updateQrCode({ custom_url: e.target.value || null })}
                                                />
                                            </div>

                                            {/* Cores do QR Code (Módulos e Fundo) */}
                                            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/20">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Cor dos Quadrados (QR)</Label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={template.qr_code.fg_color || '#000000'}
                                                            onChange={(e) => updateQrCode({ fg_color: e.target.value })}
                                                            className="h-8 w-10 p-0 border rounded cursor-pointer shrink-0 bg-transparent"
                                                        />
                                                        <Input
                                                            value={template.qr_code.fg_color || '#000000'}
                                                            onChange={(e) => updateQrCode({ fg_color: e.target.value })}
                                                            className="font-mono text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Cor de Fundo do QR</Label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={template.qr_code.bg_color || '#ffffff'}
                                                            onChange={(e) => updateQrCode({ bg_color: e.target.value })}
                                                            className="h-8 w-10 p-0 border rounded cursor-pointer shrink-0 bg-transparent"
                                                        />
                                                        <Input
                                                            value={template.qr_code.bg_color || '#ffffff'}
                                                            onChange={(e) => updateQrCode({ bg_color: e.target.value })}
                                                            className="font-mono text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Posição</Label>
                                                    <Select
                                                        value={template.qr_code.position}
                                                        onValueChange={(val: TvOverlayPosition) => updateQrCode({ position: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="bottom-right">Inferior Dir.</SelectItem>
                                                            <SelectItem value="bottom-left">Inferior Esq.</SelectItem>
                                                            <SelectItem value="top-right">Superior Dir.</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Tamanho</Label>
                                                    <Select
                                                        value={template.qr_code.size}
                                                        onValueChange={(val: 'sm' | 'md' | 'lg') => updateQrCode({ size: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="sm">Pequeno</SelectItem>
                                                            <SelectItem value="md">Médio</SelectItem>
                                                            <SelectItem value="lg">Grande</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Estilo</Label>
                                                    <Select
                                                        value={template.qr_code.style}
                                                        onValueChange={(val: TvOverlayStyle) => updateQrCode({ style: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="glass">Vidro Fosco</SelectItem>
                                                            <SelectItem value="solid">Sólido</SelectItem>
                                                            <SelectItem value="neon">Neon</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* ======================================================== */}
                                {/* 3. ABA LOGOTIPO COM UPLOAD REAL */}
                                {/* ======================================================== */}
                                <TabsContent value="logo" className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold">Ativar Logotipo da Marca</Label>
                                            <p className="text-xs text-muted-foreground">Exibe imagem de marca na tela da TV</p>
                                        </div>
                                        <Switch
                                            checked={template.branding_logo.enabled}
                                            onCheckedChange={(val) => updateLogo({ enabled: val })}
                                        />
                                    </div>

                                    {template.branding_logo.enabled && (
                                        <div className="space-y-4 pt-1">
                                            {/* Uploader de Logomarca */}
                                            <div className="p-4 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/10 text-center space-y-3">
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/png,image/svg+xml,image/jpeg,image/webp"
                                                    onChange={handleLogoUpload}
                                                    className="hidden"
                                                />

                                                {template.branding_logo.logo_url ? (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="h-16 p-2 rounded-lg bg-zinc-900 border flex items-center justify-center">
                                                            <img
                                                                src={template.branding_logo.logo_url}
                                                                alt="Logo Atual"
                                                                className="max-h-full max-w-[200px] object-contain"
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            disabled={uploadLogoMutation.isPending}
                                                            className="text-xs gap-1.5"
                                                        >
                                                            <UploadCloud className="h-3.5 w-3.5" />
                                                            {uploadLogoMutation.isPending ? 'Enviando...' : 'Trocar Logomarca'}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <UploadCloud className="h-8 w-8 text-muted-foreground/60" />
                                                        <div>
                                                            <p className="text-xs font-semibold text-foreground">
                                                                Envie a Logomarca da Loja
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                Formatos recomendados: PNG Transparente ou SVG (Até 10MB)
                                                            </p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            disabled={uploadLogoMutation.isPending}
                                                            className="text-xs gap-1.5 mt-1"
                                                        >
                                                            <UploadCloud className="h-3.5 w-3.5" />
                                                            {uploadLogoMutation.isPending ? 'Enviando...' : 'Selecionar Imagem'}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Slider de Altura */}
                                            <div className="space-y-2 p-3 rounded-lg border bg-muted/20">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-semibold">Altura da Logo</Label>
                                                    <span className="text-xs font-mono font-bold text-primary">
                                                        {template.branding_logo.height_px}px
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[template.branding_logo.height_px]}
                                                    min={24}
                                                    max={140}
                                                    step={2}
                                                    onValueChange={([val]) => updateLogo({ height_px: val })}
                                                />
                                            </div>

                                            {/* Slider de Opacidade */}
                                            <div className="space-y-2 p-3 rounded-lg border bg-muted/20">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-semibold">Opacidade da Logo</Label>
                                                    <span className="text-xs font-mono font-bold text-primary">
                                                        {Math.round(template.branding_logo.opacity * 100)}%
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[template.branding_logo.opacity * 100]}
                                                    min={10}
                                                    max={100}
                                                    step={5}
                                                    onValueChange={([val]) => updateLogo({ opacity: val / 100 })}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold">Posição</Label>
                                                <Select
                                                    value={template.branding_logo.position}
                                                    onValueChange={(val: TvOverlayPosition) => updateLogo({ position: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="bottom-left">Inferior Esquerdo</SelectItem>
                                                        <SelectItem value="bottom-right">Inferior Direito</SelectItem>
                                                        <SelectItem value="top-left">Superior Esquerdo</SelectItem>
                                                        <SelectItem value="top-right">Superior Direito</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* ======================================================== */}
                                {/* 4. ABA RELÓGIO & HORA CERTA */}
                                {/* ======================================================== */}
                                <TabsContent value="clock" className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold">Ativar Hora Certa</Label>
                                            <p className="text-xs text-muted-foreground">Exibir relógio na tela</p>
                                        </div>
                                        <Switch
                                            checked={template.clock.enabled}
                                            onCheckedChange={(val) => updateClock({ enabled: val })}
                                        />
                                    </div>

                                    {template.clock.enabled && (
                                        <div className="space-y-4 pt-1">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Posição</Label>
                                                    <Select
                                                        value={template.clock.position}
                                                        onValueChange={(val: TvOverlayPosition) => updateClock({ position: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="top-right">Superior Direito</SelectItem>
                                                            <SelectItem value="top-left">Superior Esquerdo</SelectItem>
                                                            <SelectItem value="bottom-right">Inferior Direito</SelectItem>
                                                            <SelectItem value="bottom-left">Inferior Esquerdo</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Estilo Visual</Label>
                                                    <Select
                                                        value={template.clock.style}
                                                        onValueChange={(val: TvOverlayStyle) => updateClock({ style: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="glass">Vidro Fosco (Glass)</SelectItem>
                                                            <SelectItem value="solid">Escuro Puro (Solid)</SelectItem>
                                                            <SelectItem value="neon">Brilho Neon</SelectItem>
                                                            <SelectItem value="minimal">Texto Limpo</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold">Formato da Hora</Label>
                                                <Select
                                                    value={template.clock.format}
                                                    onValueChange={(val: TvClockFormat) => updateClock({ format: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="24h">24 Horas Padrão (Ex: 14:30)</SelectItem>
                                                        <SelectItem value="24h_seconds">24 Horas com Segundos (Ex: 14:30:45)</SelectItem>
                                                        <SelectItem value="12h">12 Horas AM/PM (Ex: 02:30 PM)</SelectItem>
                                                        <SelectItem value="full_date_time">Data Completa + Hora</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-1">
                                                <div className="flex items-center justify-between p-2 rounded border">
                                                    <Label className="text-xs">Exibir Segundos</Label>
                                                    <Switch
                                                        checked={template.clock.show_seconds}
                                                        onCheckedChange={(val) => updateClock({ show_seconds: val })}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between p-2 rounded border">
                                                    <Label className="text-xs">Exibir Dia da Semana</Label>
                                                    <Switch
                                                        checked={template.clock.show_date}
                                                        onCheckedChange={(val) => updateClock({ show_date: val })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* ======================================================== */}
                                {/* 5. ABA IDENTIFICAÇÃO DA LOJA */}
                                {/* ======================================================== */}
                                <TabsContent value="store" className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold">Ativar Identificação da Loja</Label>
                                            <p className="text-xs text-muted-foreground">Exibe badge no topo ou rodapé</p>
                                        </div>
                                        <Switch
                                            checked={template.store_badge.enabled}
                                            onCheckedChange={(val) => updateStoreBadge({ enabled: val })}
                                        />
                                    </div>

                                    {template.store_badge.enabled && (
                                        <div className="space-y-3 pt-1">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold">Nome Personalizado (Opcional)</Label>
                                                <Input
                                                    placeholder={currentStoreName}
                                                    value={template.store_badge.custom_name || ''}
                                                    onChange={(e) => updateStoreBadge({ custom_name: e.target.value || null })}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold">Slogan / Subtítulo</Label>
                                                <Input
                                                    placeholder="Acessórios Premium para Celular"
                                                    value={template.store_badge.tagline || ''}
                                                    onChange={(e) => updateStoreBadge({ tagline: e.target.value || null })}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Posição</Label>
                                                    <Select
                                                        value={template.store_badge.position}
                                                        onValueChange={(val: TvOverlayPosition) => updateStoreBadge({ position: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="top-left">Superior Esquerdo</SelectItem>
                                                            <SelectItem value="top-right">Superior Direito</SelectItem>
                                                            <SelectItem value="bottom-left">Inferior Esquerdo</SelectItem>
                                                            <SelectItem value="bottom-right">Inferior Direito</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold">Estilo</Label>
                                                    <Select
                                                        value={template.store_badge.style}
                                                        onValueChange={(val: TvOverlayStyle) => updateStoreBadge({ style: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="glass">Vidro Fosco</SelectItem>
                                                            <SelectItem value="solid">Escuro Puro</SelectItem>
                                                            <SelectItem value="neon">Brilho Neon</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 pt-1">
                                                <Label className="text-xs font-semibold">Cor do Ponto Luminoso (Pulse)</Label>
                                                <div className="flex items-center gap-2">
                                                    {COLOR_PRESETS.map((c) => (
                                                        <button
                                                            key={c}
                                                            type="button"
                                                            onClick={() => updateStoreBadge({ accent_color: c })}
                                                            className={`h-7 w-7 rounded-full transition border-2 ${
                                                                template.store_badge.accent_color === c
                                                                    ? 'border-white scale-110 shadow-lg'
                                                                    : 'border-transparent opacity-70 hover:opacity-100'
                                                            }`}
                                                            style={{ backgroundColor: c }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
