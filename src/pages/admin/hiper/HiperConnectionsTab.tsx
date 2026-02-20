import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Save,
    Cookie,
    Upload,
    ChevronDown,
    ChevronUp,
    Loader2,
    Info,
    Globe,
    CheckCircle2,
    XCircle,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { hiperErpService } from '@/services/admin/hiper-erp.service';
import type {
    HiperConnection,
    CookieSummary,
    ImportTsvResponse,
} from '@/types/hiper-erp.types';

// ============================================================
// Props
// ============================================================

interface HiperConnectionsTabProps {
    activeConnectionId: number | null;
    onConnectionChange: (id: number | null) => void;
}

// ============================================================
// Component
// ============================================================

const HiperConnectionsTab: React.FC<HiperConnectionsTabProps> = ({
    activeConnectionId,
    onConnectionChange,
}) => {
    // --- Connection list ---
    const [connections, setConnections] = useState<HiperConnection[]>([]);
    const [loadingConnections, setLoadingConnections] = useState(false);

    // --- Selected connection detail ---
    const [cookieSummary, setCookieSummary] = useState<CookieSummary | null>(null);

    // --- Form state ---
    const [connectionName, setConnectionName] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [defaultReferer, setDefaultReferer] = useState('');
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [customHeaders, setCustomHeaders] = useState('');
    const [savingConnection, setSavingConnection] = useState(false);

    // --- Cookie Import ---
    const [tsvInput, setTsvInput] = useState('');
    const [importingCookies, setImportingCookies] = useState(false);
    const [importResult, setImportResult] = useState<ImportTsvResponse | null>(null);
    const [importError, setImportError] = useState<string | null>(null);

    // ============================================================
    // Load connections
    // ============================================================

    const fetchConnections = async () => {
        setLoadingConnections(true);
        try {
            const res = await hiperErpService.listConnections();
            setConnections(res.connections ?? []);
            // Auto-select first connection if none selected
            if (!activeConnectionId && res.connections?.length > 0) {
                onConnectionChange(res.connections[0].id);
            }
        } catch (err: any) {
            toast.error(err?.message || 'Erro ao carregar conexões.');
        } finally {
            setLoadingConnections(false);
        }
    };

    useEffect(() => {
        fetchConnections();
    }, []);

    // ============================================================
    // Load connection detail when selection changes
    // ============================================================

    useEffect(() => {
        if (!activeConnectionId) {
            setCookieSummary(null);
            setConnectionName('');
            setBaseUrl('');
            setDefaultReferer('');
            setCustomHeaders('');
            return;
        }

        const loadDetail = async () => {
            try {
                const res = await hiperErpService.showConnection(activeConnectionId);
                const conn = res.connection;
                setConnectionName(conn.name);
                setBaseUrl(conn.base_url);
                setDefaultReferer(conn.default_referer ?? '');
                setCustomHeaders(
                    conn.default_headers && Object.keys(conn.default_headers).length > 0
                        ? JSON.stringify(conn.default_headers, null, 2)
                        : ''
                );
                setCookieSummary(res.cookie_summary);
            } catch (err: any) {
                toast.error(err?.message || 'Erro ao carregar conexão.');
            }
        };
        loadDetail();
    }, [activeConnectionId]);

    // ============================================================
    // Handlers
    // ============================================================

    const handleSaveConnection = async () => {
        if (!connectionName.trim() || !baseUrl.trim()) {
            toast.error('Preencha o nome e a URL base da conexão.');
            return;
        }

        setSavingConnection(true);
        try {
            let defaultHeaders: Record<string, string> | undefined;
            if (customHeaders.trim()) {
                try {
                    defaultHeaders = JSON.parse(customHeaders);
                } catch {
                    toast.error('Headers avançados devem ser um JSON válido.');
                    setSavingConnection(false);
                    return;
                }
            }

            const response = await hiperErpService.upsertConnection({
                id: activeConnectionId,
                name: connectionName.trim(),
                base_url: baseUrl.trim(),
                default_referer: defaultReferer.trim() || undefined,
                default_headers: defaultHeaders,
            });

            onConnectionChange(response.connection.id);
            await fetchConnections();
            toast.success(
                activeConnectionId
                    ? 'Conexão atualizada com sucesso!'
                    : 'Conexão criada com sucesso!'
            );
        } catch (err: any) {
            toast.error(err?.message || 'Erro ao salvar conexão.');
        } finally {
            setSavingConnection(false);
        }
    };

    const handleNewConnection = () => {
        onConnectionChange(null);
        setConnectionName('');
        setBaseUrl('https://maiscapinhas.hiper.com.br');
        setDefaultReferer('https://maiscapinhas.hiper.com.br/operacoes');
        setCustomHeaders('');
        setCookieSummary(null);
    };

    const handleImportCookies = async () => {
        if (!activeConnectionId) {
            toast.error('Salve a conexão primeiro antes de importar cookies.');
            return;
        }
        if (!tsvInput.trim()) {
            toast.error('Cole o TSV dos cookies no campo de texto.');
            return;
        }

        setImportingCookies(true);
        setImportError(null);
        setImportResult(null);
        try {
            const result = await hiperErpService.importTsv(activeConnectionId, tsvInput);
            setImportResult(result);
            setCookieSummary({
                domains: result.domains,
                total_cookies: result.total_cookies,
                last_imported_at: result.last_imported_at,
            });
            toast.success(`${result.imported} cookies importados de ${result.domains.length} domínio(s)!`);
        } catch (err: any) {
            const errorMsg = err?.message || 'Erro ao importar cookies.';
            setImportError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setImportingCookies(false);
        }
    };

    // ============================================================
    // Render
    // ============================================================

    return (
        <div className="space-y-6">
            {/* Connection Selector */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-[250px] flex-1 max-w-md">
                    <Label className="text-sm text-muted-foreground whitespace-nowrap">Conexão Ativa:</Label>
                    <Select
                        value={activeConnectionId?.toString() ?? ''}
                        onValueChange={(val) => onConnectionChange(val ? Number(val) : null)}
                        disabled={loadingConnections}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={loadingConnections ? 'Carregando...' : 'Selecione uma conexão'} />
                        </SelectTrigger>
                        <SelectContent>
                            {connections.map((conn) => (
                                <SelectItem key={conn.id} value={conn.id.toString()}>
                                    <div className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${conn.is_active ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                                        {conn.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline" size="sm" onClick={handleNewConnection} className="gap-1.5">
                    + Nova Conexão
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchConnections} disabled={loadingConnections}>
                    <RefreshCw className={`h-4 w-4 ${loadingConnections ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* 2-column layout: Config + Cookies */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left — Connection Config */}
                <Card className="border-border/60">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Globe className="h-4 w-4 text-blue-400" />
                            Configuração
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="conn-name" className="text-sm">
                                Nome <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="conn-name"
                                placeholder="Hiper - Maiscapinhas"
                                value={connectionName}
                                onChange={(e) => setConnectionName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="conn-url" className="text-sm">
                                URL Base <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="conn-url"
                                type="url"
                                placeholder="https://maiscapinhas.hiper.com.br"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="conn-referer" className="text-sm">Referer Padrão</Label>
                            <Input
                                id="conn-referer"
                                placeholder="https://maiscapinhas.hiper.com.br/operacoes"
                                value={defaultReferer}
                                onChange={(e) => setDefaultReferer(e.target.value)}
                            />
                        </div>

                        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                                    {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    Headers Avançados
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-2">
                                <Textarea
                                    placeholder='{"Accept": "application/json"}'
                                    value={customHeaders}
                                    onChange={(e) => setCustomHeaders(e.target.value)}
                                    rows={3}
                                    className="font-mono text-xs"
                                />
                            </CollapsibleContent>
                        </Collapsible>

                        <Button
                            onClick={handleSaveConnection}
                            disabled={savingConnection || !connectionName.trim() || !baseUrl.trim()}
                            className="gap-2 w-full"
                        >
                            {savingConnection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Salvar Conexão
                        </Button>
                    </CardContent>
                </Card>

                {/* Right — Cookies */}
                <Card className="border-border/60">
                    <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Cookie className="h-4 w-4 text-amber-400" />
                                    Cookies
                                </CardTitle>
                                {cookieSummary && (
                                    <CardDescription className="mt-1">
                                        <span className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                                ✅ {cookieSummary.total_cookies} cookies
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs">
                                                {cookieSummary.domains.length} domínio(s)
                                            </Badge>
                                            {cookieSummary.last_imported_at && (
                                                <span className="text-xs text-muted-foreground">
                                                    Última: {new Date(cookieSummary.last_imported_at).toLocaleString('pt-BR')}
                                                </span>
                                            )}
                                        </span>
                                    </CardDescription>
                                )}
                                {!cookieSummary && activeConnectionId && (
                                    <CardDescription className="mt-1 text-amber-400">Nenhum cookie importado</CardDescription>
                                )}
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                        <Info className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs text-xs space-y-1 p-3">
                                    <p className="font-semibold">Como copiar os cookies:</p>
                                    <ol className="list-decimal ml-3 space-y-0.5">
                                        <li>Abra o Hiper no Chrome e faça login</li>
                                        <li>Pressione <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">F12</kbd></li>
                                        <li>Vá em <strong>Application → Cookies</strong></li>
                                        <li>Selecione o domínio</li>
                                        <li><kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Ctrl+A</kbd> → <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Ctrl+C</kbd></li>
                                        <li>Cole aqui no campo abaixo</li>
                                    </ol>
                                    <p className="text-amber-400 mt-1">⚠️ Repita para todos os domínios e cole tudo junto.</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* Cookie domain badges */}
                        {cookieSummary && cookieSummary.domains.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {cookieSummary.domains.map((domain) => (
                                    <Badge
                                        key={domain}
                                        variant="secondary"
                                        className="text-xs bg-violet-500/15 text-violet-300 border-violet-500/30"
                                    >
                                        <Globe className="h-3 w-3 mr-1" />
                                        {domain}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <Textarea
                            placeholder={
                                'Cole aqui o TSV dos cookies...\n\n' +
                                '(DevTools > Application > Cookies → Ctrl+A → Ctrl+C)'
                            }
                            value={tsvInput}
                            onChange={(e) => setTsvInput(e.target.value)}
                            rows={5}
                            className="font-mono text-xs"
                        />

                        <Button
                            onClick={handleImportCookies}
                            disabled={importingCookies || !activeConnectionId || !tsvInput.trim()}
                            className="gap-2 w-full"
                            variant={!activeConnectionId ? 'secondary' : 'default'}
                        >
                            {importingCookies ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            Importar Cookies
                        </Button>

                        {!activeConnectionId && (
                            <p className="text-xs text-muted-foreground text-center">Salve a conexão primeiro</p>
                        )}

                        {/* Import Result */}
                        {importResult && (
                            <Alert className="border-emerald-500/30 bg-emerald-500/5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                <AlertTitle className="text-emerald-400 text-sm">Cookies importados!</AlertTitle>
                                <AlertDescription className="text-xs">
                                    <strong>{importResult.imported}</strong> cookies de <strong>{importResult.domains.length}</strong> domínio(s)
                                </AlertDescription>
                            </Alert>
                        )}

                        {importError && (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle className="text-sm">Erro na importação</AlertTitle>
                                <AlertDescription className="text-xs">{importError}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default HiperConnectionsTab;
