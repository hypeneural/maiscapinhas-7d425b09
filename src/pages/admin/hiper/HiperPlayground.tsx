import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Play,
    Copy,
    Check,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Trash2,
    Plus,
    Code2,
    ArrowRight,
    Zap,
    ExternalLink,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { hiperErpService } from '@/services/admin/hiper-erp.service';
import type {
    HiperConnection,
    HiperEndpoint,
    ExecuteResponse,
} from '@/types/hiper-erp.types';

// ============================================================
// Helpers
// ============================================================

/** Extract {placeholder} names from a path string */
function extractPathParams(path: string): string[] {
    const matches = path.match(/\{(\w+)\}/g);
    return matches ? matches.map((m) => m.replace(/[{}]/g, '')) : [];
}

/** Pretty-print JSON with fallback */
function prettyJson(val: any): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') {
        try {
            return JSON.stringify(JSON.parse(val), null, 2);
        } catch {
            return val;
        }
    }
    return JSON.stringify(val, null, 2);
}

/** Build the final URL preview */
function buildUrlPreview(baseUrl: string, path: string, params: Array<{ key: string; value: string }>): string {
    let resolvedPath = path;
    params.forEach((p) => {
        if (p.key && p.value) {
            resolvedPath = resolvedPath.replace(`{${p.key}}`, p.value);
        }
    });
    return `${baseUrl.replace(/\/$/, '')}${resolvedPath}`;
}

// ============================================================
// Component
// ============================================================

const HiperPlayground: React.FC = () => {
    // --- Connections ---
    const [connections, setConnections] = useState<HiperConnection[]>([]);
    const [loadingConnections, setLoadingConnections] = useState(false);
    const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);

    // --- Endpoints catalog ---
    const [endpoints, setEndpoints] = useState<HiperEndpoint[]>([]);
    const [loadingEndpoints, setLoadingEndpoints] = useState(false);
    const [selectedKey, setSelectedKey] = useState<string>('');

    // --- Params / Query / Body ---
    const [params, setParams] = useState<Array<{ key: string; value: string }>>([]);
    const [queryEntries, setQueryEntries] = useState<Array<{ key: string; value: string }>>([]);
    const [bodyJson, setBodyJson] = useState('');

    // --- Execution ---
    const [executing, setExecuting] = useState(false);
    const [executeResult, setExecuteResult] = useState<ExecuteResponse | null>(null);
    const [executeError, setExecuteError] = useState<string | null>(null);
    const [responseCopied, setResponseCopied] = useState(false);

    // --- Derived ---
    const selectedEndpoint = useMemo(
        () => endpoints.find((ep) => ep.key === selectedKey) ?? null,
        [endpoints, selectedKey]
    );

    const selectedConnection = useMemo(
        () => connections.find((c) => c.id === selectedConnectionId) ?? null,
        [connections, selectedConnectionId]
    );

    const urlPreview = useMemo(() => {
        if (!selectedConnection || !selectedEndpoint) return '';
        return buildUrlPreview(selectedConnection.base_url, selectedEndpoint.path, params);
    }, [selectedConnection, selectedEndpoint, params]);

    // ============================================================
    // Load data on mount
    // ============================================================

    const fetchConnections = async () => {
        setLoadingConnections(true);
        try {
            const res = await hiperErpService.listConnections();
            setConnections(res.connections ?? []);
            if (res.connections?.length > 0 && !selectedConnectionId) {
                setSelectedConnectionId(res.connections[0].id);
            }
        } catch (err: any) {
            toast.error(err?.message || 'Erro ao carregar conexões.');
        } finally {
            setLoadingConnections(false);
        }
    };

    const fetchEndpoints = async () => {
        setLoadingEndpoints(true);
        try {
            const res = await hiperErpService.listEndpoints();
            setEndpoints(res.endpoints ?? []);
        } catch (err: any) {
            toast.error(err?.message || 'Erro ao carregar endpoints.');
        } finally {
            setLoadingEndpoints(false);
        }
    };

    useEffect(() => {
        fetchConnections();
        fetchEndpoints();
    }, []);

    // ============================================================
    // When endpoint selection changes, populate defaults
    // ============================================================

    useEffect(() => {
        if (!selectedEndpoint) {
            setParams([]);
            setQueryEntries([]);
            setBodyJson('');
            return;
        }

        // Path params
        const pathParamNames = extractPathParams(selectedEndpoint.path);
        setParams(pathParamNames.map((k) => ({ key: k, value: '' })));

        // Query template
        if (selectedEndpoint.query_template && Object.keys(selectedEndpoint.query_template).length > 0) {
            setQueryEntries(
                Object.entries(selectedEndpoint.query_template).map(([k, v]) => ({
                    key: k,
                    value: typeof v === 'string' ? v : JSON.stringify(v),
                }))
            );
        } else {
            setQueryEntries([]);
        }

        // Body template (POST only)
        if (selectedEndpoint.method === 'POST' && selectedEndpoint.body_template) {
            setBodyJson(prettyJson(selectedEndpoint.body_template));
        } else {
            setBodyJson('');
        }

        // Clear previous result
        setExecuteResult(null);
        setExecuteError(null);
    }, [selectedEndpoint]);

    // ============================================================
    // Handlers
    // ============================================================

    const handleExecute = async () => {
        if (!selectedConnectionId) {
            toast.error('Selecione uma conexão.');
            return;
        }
        if (!selectedKey) {
            toast.error('Selecione um endpoint.');
            return;
        }

        setExecuting(true);
        setExecuteResult(null);
        setExecuteError(null);

        try {
            // Build params object
            const paramsObj: Record<string, string> = {};
            params.forEach((p) => {
                if (p.key.trim() && p.value.trim()) {
                    paramsObj[p.key.trim()] = p.value.trim();
                }
            });

            // Build query object
            const queryObj: Record<string, any> = {};
            queryEntries.forEach((q) => {
                if (q.key.trim()) {
                    queryObj[q.key.trim()] = q.value;
                }
            });

            // Build body object
            let bodyObj: Record<string, any> | undefined;
            if (selectedEndpoint?.method === 'POST' && bodyJson.trim()) {
                try {
                    bodyObj = JSON.parse(bodyJson);
                } catch {
                    toast.error('O corpo (body) deve ser um JSON válido.');
                    setExecuting(false);
                    return;
                }
            }

            const result = await hiperErpService.execute({
                connection_id: selectedConnectionId,
                endpoint_key: selectedKey,
                params: Object.keys(paramsObj).length > 0 ? paramsObj : undefined,
                query: Object.keys(queryObj).length > 0 ? queryObj : undefined,
                body: bodyObj,
            });

            setExecuteResult(result);

            if (result.missing_cookies?.length > 0) {
                toast.warning(`Atenção: ${result.missing_cookies.length} cookie(s) faltando.`);
            } else {
                toast.success(`Request executado — Status ${result.status}`);
            }
        } catch (err: any) {
            const errorMsg = err?.message || 'Erro ao executar request.';
            setExecuteError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setExecuting(false);
        }
    };

    const handleCopyResponse = async () => {
        if (!executeResult?.response) return;
        try {
            await navigator.clipboard.writeText(prettyJson(executeResult.response));
            setResponseCopied(true);
            toast.success('Resposta copiada!');
            setTimeout(() => setResponseCopied(false), 2000);
        } catch {
            toast.error('Não foi possível copiar.');
        }
    };

    // --- Key-value helpers ---
    const updateParam = (index: number, field: 'key' | 'value', val: string) => {
        setParams((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: val } : p)));
    };

    const updateQuery = (index: number, field: 'key' | 'value', val: string) => {
        setQueryEntries((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: val } : q)));
    };

    const addQuery = () => setQueryEntries((prev) => [...prev, { key: '', value: '' }]);
    const removeQuery = (index: number) => setQueryEntries((prev) => prev.filter((_, i) => i !== index));

    // ============================================================
    // Render
    // ============================================================

    return (
        <div className="space-y-6">
            {/* Selectors */}
            <Card className="border-border/60">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Zap className="h-4 w-4 text-orange-400" />
                        Montar Request
                    </CardTitle>
                    <CardDescription>
                        Selecione a conexão e o endpoint, preencha os parâmetros e execute.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Connection + Endpoint selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Connection */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm">Conexão</Label>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchConnections} disabled={loadingConnections}>
                                    <RefreshCw className={`h-3 w-3 ${loadingConnections ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                            <Select
                                value={selectedConnectionId?.toString() ?? ''}
                                onValueChange={(val) => setSelectedConnectionId(val ? Number(val) : null)}
                                disabled={loadingConnections}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingConnections ? 'Carregando...' : 'Selecione'} />
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

                        {/* Endpoint */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm">Endpoint</Label>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchEndpoints} disabled={loadingEndpoints}>
                                    <RefreshCw className={`h-3 w-3 ${loadingEndpoints ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                            <Select value={selectedKey} onValueChange={setSelectedKey} disabled={loadingEndpoints}>
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingEndpoints ? 'Carregando...' : 'Selecione'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {endpoints.map((ep) => (
                                        <SelectItem key={ep.key} value={ep.key}>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] px-1.5 ${ep.method === 'GET'
                                                            ? 'text-emerald-400 border-emerald-500/40'
                                                            : 'text-amber-400 border-amber-500/40'
                                                        }`}
                                                >
                                                    {ep.method}
                                                </Badge>
                                                <span className="font-mono text-xs">{ep.key}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Endpoint detail + URL preview */}
                    {selectedEndpoint && (
                        <div className="rounded-lg bg-muted/30 border border-border/40 p-3 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                    variant="outline"
                                    className={
                                        selectedEndpoint.method === 'GET'
                                            ? 'text-emerald-400 border-emerald-500/40'
                                            : 'text-amber-400 border-amber-500/40'
                                    }
                                >
                                    {selectedEndpoint.method}
                                </Badge>
                                <code className="text-sm font-mono text-foreground/80">{selectedEndpoint.path}</code>
                            </div>
                            {urlPreview && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                    <code className="break-all">{urlPreview}</code>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Path Params */}
                    {params.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-sm">
                                Parâmetros de URL
                            </Label>
                            <div className="space-y-2">
                                {params.map((p, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 min-w-[130px]">
                                            <Code2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <code className="text-xs text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded">
                                                {'{' + p.key + '}'}
                                            </code>
                                        </div>
                                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <Input
                                            placeholder={`Valor de ${p.key}`}
                                            value={p.value}
                                            onChange={(e) => updateParam(i, 'value', e.target.value)}
                                            className="font-mono text-xs"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Query Params */}
                    {selectedEndpoint && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm">Query Parameters</Label>
                                <Button variant="ghost" size="sm" onClick={addQuery} className="gap-1 h-7 text-xs">
                                    <Plus className="h-3 w-3" />
                                    Adicionar
                                </Button>
                            </div>
                            {queryEntries.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">Nenhum query parameter.</p>
                            ) : (
                                <div className="space-y-2">
                                    {queryEntries.map((q, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <Input
                                                placeholder="chave"
                                                value={q.key}
                                                onChange={(e) => updateQuery(i, 'key', e.target.value)}
                                                className="font-mono text-xs max-w-[150px]"
                                            />
                                            <span className="text-muted-foreground text-xs">=</span>
                                            <Input
                                                placeholder="valor"
                                                value={q.value}
                                                onChange={(e) => updateQuery(i, 'value', e.target.value)}
                                                className="font-mono text-xs"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                                                onClick={() => removeQuery(i)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Body (POST only) */}
                    {selectedEndpoint?.method === 'POST' && (
                        <div className="space-y-2">
                            <Label className="text-sm">
                                Body
                                <Badge variant="outline" className="ml-1.5 text-[10px] text-amber-400 border-amber-500/40">POST</Badge>
                            </Label>
                            <Textarea
                                placeholder='{"filtro": "valor", ...}'
                                value={bodyJson}
                                onChange={(e) => setBodyJson(e.target.value)}
                                rows={8}
                                className="font-mono text-xs"
                            />
                            <p className="text-xs text-muted-foreground">
                                O body faz <strong>merge</strong> com o body_template do endpoint.
                            </p>
                        </div>
                    )}

                    {/* Body disabled for GET */}
                    {selectedEndpoint?.method === 'GET' && (
                        <div className="rounded-lg bg-muted/20 border border-border/30 p-3">
                            <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                                <Code2 className="h-3.5 w-3.5" />
                                Endpoint GET — body desabilitado
                            </p>
                        </div>
                    )}

                    <Separator />

                    {/* Execute Button */}
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleExecute}
                            disabled={executing || !selectedConnectionId || !selectedKey}
                            className="gap-2"
                        >
                            {executing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                            Executar Request
                        </Button>

                        {!selectedConnectionId && (
                            <span className="text-xs text-muted-foreground">Selecione uma conexão</span>
                        )}

                        {selectedConnectionId && !selectedKey && (
                            <span className="text-xs text-muted-foreground">Selecione um endpoint</span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Response */}
            {(executeResult || executeError) && (
                <Card className="border-border/60">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            {executeResult ? (
                                <>
                                    {executeResult.status >= 200 && executeResult.status < 300 ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-400" />
                                    )}
                                    Resultado
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-4 w-4 text-red-400" />
                                    Erro
                                </>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {executeResult && (
                            <>
                                {/* Status header */}
                                <div className="flex items-center gap-3 flex-wrap">
                                    <Badge
                                        variant="outline"
                                        className={
                                            executeResult.status >= 200 && executeResult.status < 300
                                                ? 'text-emerald-400 border-emerald-500/40'
                                                : executeResult.status >= 400
                                                    ? 'text-red-400 border-red-500/40'
                                                    : 'text-amber-400 border-amber-500/40'
                                        }
                                    >
                                        Status {executeResult.status}
                                    </Badge>
                                    <code className="text-xs text-muted-foreground break-all">{executeResult.url}</code>
                                </div>

                                {/* Missing cookies */}
                                {executeResult.missing_cookies?.length > 0 && (
                                    <Alert className="border-amber-500/30 bg-amber-500/5">
                                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                                        <AlertTitle className="text-amber-400 text-sm">Cookies faltando</AlertTitle>
                                        <AlertDescription>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {executeResult.missing_cookies.map((name) => (
                                                    <Badge key={name} variant="destructive" className="text-xs">
                                                        {name}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Reimporte os cookies na aba Conexões.
                                            </p>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Response JSON */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-muted-foreground">Resposta (JSON)</Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="gap-1 h-7 text-xs"
                                            onClick={handleCopyResponse}
                                        >
                                            {responseCopied ? (
                                                <Check className="h-3 w-3 text-emerald-400" />
                                            ) : (
                                                <Copy className="h-3 w-3" />
                                            )}
                                            Copiar
                                        </Button>
                                    </div>
                                    <div className="rounded-lg bg-zinc-950 border border-border/50 overflow-auto max-h-[500px]">
                                        <pre className="p-4 text-xs text-emerald-300 whitespace-pre-wrap font-mono">
                                            {prettyJson(executeResult.response)}
                                        </pre>
                                    </div>
                                </div>
                            </>
                        )}

                        {executeError && (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle>Erro na execução</AlertTitle>
                                <AlertDescription className="text-sm">{executeError}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default HiperPlayground;
