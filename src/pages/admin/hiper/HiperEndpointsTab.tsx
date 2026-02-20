import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Save,
    Trash2,
    ChevronDown,
    ChevronUp,
    Loader2,
    Plus,
    Pencil,
    ListTree,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { hiperErpService } from '@/services/admin/hiper-erp.service';
import type { HiperEndpoint } from '@/types/hiper-erp.types';

// ============================================================
// Component
// ============================================================

const HiperEndpointsTab: React.FC = () => {
    // --- Endpoints list ---
    const [endpoints, setEndpoints] = useState<HiperEndpoint[]>([]);
    const [loading, setLoading] = useState(false);

    // --- Form state ---
    const [editId, setEditId] = useState<number | null>(null);
    const [formKey, setFormKey] = useState('');
    const [formMethod, setFormMethod] = useState<'GET' | 'POST'>('GET');
    const [formPath, setFormPath] = useState('');
    const [formHeaders, setFormHeaders] = useState('');
    const [formQuery, setFormQuery] = useState('');
    const [formBody, setFormBody] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // --- Collapsible state ---
    const [headersOpen, setHeadersOpen] = useState(false);
    const [queryOpen, setQueryOpen] = useState(false);
    const [bodyOpen, setBodyOpen] = useState(false);

    // ============================================================
    // Load endpoints
    // ============================================================

    const fetchEndpoints = async () => {
        setLoading(true);
        try {
            const res = await hiperErpService.listEndpoints();
            setEndpoints(res.endpoints ?? []);
        } catch (err: any) {
            toast.error(err?.message || 'Erro ao carregar endpoints.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEndpoints();
    }, []);

    // ============================================================
    // Form helpers
    // ============================================================

    const resetForm = () => {
        setEditId(null);
        setFormKey('');
        setFormMethod('GET');
        setFormPath('');
        setFormHeaders('');
        setFormQuery('');
        setFormBody('');
        setHeadersOpen(false);
        setQueryOpen(false);
        setBodyOpen(false);
    };

    const loadEndpointIntoForm = (ep: HiperEndpoint) => {
        setEditId(ep.id);
        setFormKey(ep.key);
        setFormMethod(ep.method);
        setFormPath(ep.path);
        setFormHeaders(ep.headers ? JSON.stringify(ep.headers, null, 2) : '');
        setFormQuery(ep.query_template ? JSON.stringify(ep.query_template, null, 2) : '');
        setFormBody(ep.body_template ? JSON.stringify(ep.body_template, null, 2) : '');
        setHeadersOpen(!!ep.headers);
        setQueryOpen(!!ep.query_template);
        setBodyOpen(!!ep.body_template);
    };

    // ============================================================
    // Handlers
    // ============================================================

    const handleSave = async () => {
        if (!formKey.trim() || !formPath.trim()) {
            toast.error('Preencha pelo menos a Key e o Path.');
            return;
        }

        setSaving(true);
        try {
            // Parse optional JSON fields
            let headers: Record<string, string> | null = null;
            let queryTemplate: Record<string, any> | null = null;
            let bodyTemplate: Record<string, any> | null = null;

            if (formHeaders.trim()) {
                try { headers = JSON.parse(formHeaders); } catch {
                    toast.error('Headers deve ser um JSON válido.');
                    setSaving(false);
                    return;
                }
            }
            if (formQuery.trim()) {
                try { queryTemplate = JSON.parse(formQuery); } catch {
                    toast.error('Query Template deve ser um JSON válido.');
                    setSaving(false);
                    return;
                }
            }
            if (formBody.trim()) {
                try { bodyTemplate = JSON.parse(formBody); } catch {
                    toast.error('Body Template deve ser um JSON válido.');
                    setSaving(false);
                    return;
                }
            }

            await hiperErpService.upsertEndpoint({
                id: editId,
                key: formKey.trim(),
                method: formMethod,
                path: formPath.trim(),
                headers,
                query_template: queryTemplate,
                body_template: bodyTemplate,
            });

            toast.success(editId ? 'Endpoint atualizado!' : 'Endpoint criado!');
            resetForm();
            await fetchEndpoints();
        } catch (err: any) {
            toast.error(err?.message || 'Erro ao salvar endpoint.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editId) return;
        setDeleting(true);
        try {
            await hiperErpService.deleteEndpoint(editId);
            toast.success('Endpoint deletado.');
            resetForm();
            await fetchEndpoints();
        } catch (err: any) {
            toast.error(err?.message || 'Erro ao deletar endpoint.');
        } finally {
            setDeleting(false);
        }
    };

    // ============================================================
    // Render
    // ============================================================

    return (
        <div className="space-y-6">
            {/* Endpoints Table */}
            <Card className="border-border/60">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ListTree className="h-4 w-4 text-blue-400" />
                            Endpoints Cadastrados
                            <Badge variant="secondary" className="text-xs ml-1">
                                {endpoints.length}
                            </Badge>
                        </CardTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchEndpoints} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading && endpoints.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Carregando...
                        </div>
                    ) : endpoints.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            Nenhum endpoint cadastrado. Crie o primeiro abaixo.
                        </p>
                    ) : (
                        <div className="border border-border/50 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50 bg-muted/30">
                                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Key</th>
                                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-[80px]">Método</th>
                                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Path</th>
                                        <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground w-[60px]">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {endpoints.map((ep) => (
                                        <tr
                                            key={ep.id}
                                            className={`border-b border-border/30 cursor-pointer transition-colors hover:bg-muted/20 ${editId === ep.id ? 'bg-violet-500/5 border-violet-500/20' : ''}`}
                                            onClick={() => loadEndpointIntoForm(ep)}
                                        >
                                            <td className="px-3 py-2.5">
                                                <code className="text-xs font-mono">{ep.key}</code>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] ${ep.method === 'GET'
                                                            ? 'text-emerald-400 border-emerald-500/40'
                                                            : 'text-amber-400 border-amber-500/40'
                                                        }`}
                                                >
                                                    {ep.method}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <code className="text-xs text-muted-foreground font-mono truncate block max-w-[300px]">
                                                    {ep.path}
                                                </code>
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Endpoint Form */}
            <Card className="border-border/60">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        {editId ? (
                            <>
                                <Pencil className="h-4 w-4 text-amber-400" />
                                Editar Endpoint
                                <Badge variant="secondary" className="text-xs">ID: {editId}</Badge>
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 text-emerald-400" />
                                Novo Endpoint
                            </>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Key + Method */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-sm">
                                Key <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                placeholder="operacoes.detalhes"
                                value={formKey}
                                onChange={(e) => setFormKey(e.target.value)}
                                className="font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm">Método</Label>
                            <Select value={formMethod} onValueChange={(v) => setFormMethod(v as 'GET' | 'POST')}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GET">
                                        <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 text-xs">GET</Badge>
                                    </SelectItem>
                                    <SelectItem value="POST">
                                        <Badge variant="outline" className="text-amber-400 border-amber-500/40 text-xs">POST</Badge>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Path */}
                    <div className="space-y-1.5">
                        <Label className="text-sm">
                            Path <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            placeholder="/operacoes/{id}/detalhes"
                            value={formPath}
                            onChange={(e) => setFormPath(e.target.value)}
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            Use <code className="px-1 py-0.5 bg-muted rounded text-[10px]">{'{placeholder}'}</code> para parâmetros dinâmicos
                        </p>
                    </div>

                    {/* Collapsible: Headers */}
                    <Collapsible open={headersOpen} onOpenChange={setHeadersOpen}>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground w-full justify-start">
                                {headersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                Headers (JSON)
                                {formHeaders.trim() && <Badge variant="secondary" className="text-[10px] ml-1">definido</Badge>}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-1">
                            <Textarea
                                placeholder='{"Content-Type": "application/json"}'
                                value={formHeaders}
                                onChange={(e) => setFormHeaders(e.target.value)}
                                rows={3}
                                className="font-mono text-xs"
                            />
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Collapsible: Query Template */}
                    <Collapsible open={queryOpen} onOpenChange={setQueryOpen}>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground w-full justify-start">
                                {queryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                Query Template (JSON)
                                {formQuery.trim() && <Badge variant="secondary" className="text-[10px] ml-1">definido</Badge>}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-1">
                            <Textarea
                                placeholder='{"page": "1", "limit": "50"}'
                                value={formQuery}
                                onChange={(e) => setFormQuery(e.target.value)}
                                rows={3}
                                className="font-mono text-xs"
                            />
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Collapsible: Body Template (POST only) */}
                    <Collapsible open={bodyOpen} onOpenChange={setBodyOpen}>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground w-full justify-start">
                                {bodyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                Body Template (JSON)
                                {formMethod === 'GET' && <span className="text-xs text-muted-foreground ml-1">(só para POST)</span>}
                                {formBody.trim() && <Badge variant="secondary" className="text-[10px] ml-1">definido</Badge>}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-1">
                            <Textarea
                                placeholder='{"filtro": {"Lojas": []}}'
                                value={formBody}
                                onChange={(e) => setFormBody(e.target.value)}
                                rows={6}
                                className="font-mono text-xs"
                                disabled={formMethod === 'GET'}
                            />
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            onClick={handleSave}
                            disabled={saving || !formKey.trim() || !formPath.trim()}
                            className="gap-2"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {editId ? 'Atualizar' : 'Criar'} Endpoint
                        </Button>

                        {editId && (
                            <Button
                                onClick={handleDelete}
                                disabled={deleting}
                                variant="destructive"
                                className="gap-2"
                            >
                                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Deletar
                            </Button>
                        )}

                        {editId && (
                            <Button variant="ghost" size="sm" onClick={resetForm}>
                                Cancelar
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default HiperEndpointsTab;
