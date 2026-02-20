/**
 * Sales Validation Page
 * 
 * Allows admins to validate a raw ERP sales JSON against the database.
 * Super admins can also fetch data directly from the Hiper ERP.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
    CheckCircle,
    AlertTriangle,
    XCircle,
    Search,
    FileJson,
    Loader2,
    Database,
    ExternalLink,
    AlertOctagon,
    Lock,
    FileText,
    ArrowRightLeft,
    Globe,
    RefreshCw,
    Store,
    ShoppingBag,
    Ban,
    Hash,
    Clock,
    MapPin,
    ChevronDown,
    Phone,
    MessageCircle,
    User,
    Receipt,
    CreditCard,
    ShieldCheck,
    Eye,
    Barcode,
    Tag,
    Filter,
    SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/PageHeader';
import { validateSale, validateSaleBatch } from '@/services/sales.service';
import { getAllPublicStores, type PublicStore } from '@/services/stores.service';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { hiperErpService } from '@/services/admin/hiper-erp.service';
import type { HiperConnection } from '@/types/hiper-erp.types';
import { ValidationNav } from './ValidationNav';

//  Comparison block types 
interface ComparisonMatch {
    erp: Record<string, any> | null;
    db: Record<string, any> | null;
    match: boolean | Record<string, boolean>;
}

interface Comparison {
    operacao: ComparisonMatch;
    loja: ComparisonMatch;
    vendedor: ComparisonMatch;
    fiscal: ComparisonMatch;
    itens: Array<{ erp: Record<string, any> | null; db: Record<string, any> | null; match: boolean }>;
    pagamentos: Array<{ erp: Record<string, any> | null; db: Record<string, any> | null; match: boolean }>;
    match_summary: {
        operacao_uuid: boolean;
        total: boolean;
        loja: boolean;
        vendedor: boolean;
        fiscal: boolean;
        all_itens: boolean;
        all_pagamentos: boolean;
        perfect: boolean;
    };
}

interface ValidationResult {
    ok: boolean;
    found: boolean;
    match_100: boolean;
    content_match?: boolean;
    status_db?: string | null;
    expected_status_db?: string | null;
    status_match?: boolean | null;
    comparison?: Comparison | null;
    operation_id?: string;
    url?: string;
    reason?: string;
    status_erp?: string;
    all_candidates_count?: number;
    best_match?: {
        pdv_venda_id?: number;
        id_operacao_db?: number;
        erp_id_orig?: string;
        data_hora_utc?: string;
        total?: number;
        match_type?: 'uuid' | 'golden_key_uuid' | 'fiscal_key_nfce' | 'heuristic';
        store_identity_match?: boolean;
        seller_identity_match?: boolean;
        status_match?: boolean | null;
        expected_status_db?: string | null;
        status_db?: string | null;
        items_exact: boolean;
        payments_exact: boolean;
        db_details?: {
            venda?: {
                store_id?: number;
                store_name?: string;
                store_city?: string;
                store_pdv_id?: number;
                store_pdv_name?: string;
                store_cnpj?: string;
                store_razao_social?: string;
                canal?: string;
                id_operacao?: number;
                id_turno?: string;
                turno_seq?: number;
                data_hora?: string;
                total?: number;
                status?: string | null;
                erp_operacao_uuid?: string;
                erp_loja_uuid?: string;
                fiscal?: {
                    nfce_chave?: string;
                    nfce_numero?: string;
                    nfce_serie?: string;
                    nfce_modelo?: string;
                };
            };
            itens?: Array<{
                line_no?: number;
                id_produto?: number;
                codigo_barras?: string;
                nome_produto?: string;
                qtd?: number;
                preco_unit?: number;
                total?: number;
                desconto?: number;
                valor_original?: number;
                preco_original?: number;
                vendedor_pdv_id?: number;
                vendedor_guid?: string;
                vendedor_nome?: string;
                vendedor_login?: string;
                vendedor_user_id?: number;
                vendedor_whatsapp?: string | null;
            }>;
            pagamentos?: Array<{
                line_no?: number;
                id_finalizador?: number;
                meio_pagamento?: string;
                valor?: number;
                troco?: number;
                parcelas?: number;
            }>;
            summary?: {
                itens?: { qtd_linhas?: number; qtd_total?: number; valor_total?: number; desconto_total?: number };
                pagamentos?: { qtd_linhas?: number; valor_total?: number; troco_total?: number };
            };
            // Legacy v1 fields (backwards compat)
            store_db?: { id: number; nome_hiper: string };
            user_db?: { nome: string; login: string; user_id: number };
            timestamps?: { data_venda: string; created_at: string };
            identifiers?: { id_operacao: number; id_turno: number; erp_operacao_uuid: string };
            fiscal?: { nfce_chave: string; nfce_numero: string };
        };
    };
    search?: {
        window_utc?: [string, string];
        total_searched?: number;
        store_id?: number;
    };
    error?: string;
    erp_status?: number;
    missing_cookies?: string[];
}

// Multi-result response (multiple UUIDs)
interface MultiValidationResponse {
    source: string;
    batch_count: number;
    missing_cookies?: string[];
    results: ValidationResult[];
}

interface SaleSummary {
    codigo: number | null;
    erp_id: string | null;
    erp_loja_uuid: string | null;
    valor: string | null;
    valor_liquido: number | null;
    data: string | null;
    turno: string | null;
    turno_seq: number | null;
    turno_id: string | null;
    loja_erp_id: string | null;
    loja_nome: string | null;
    loja_cidade: string | null;
    found_in_db: boolean;
    cancelada: boolean;
    concluida: boolean;
    tipo: string | null;
    itens: number | null;
}

interface BatchAppliedFilters {
    store_id?: number;
    store_guid?: string;
    turno_seq?: number;
    operation_code?: number;
    date_from?: string;
    date_to?: string;
    hour_from?: string;
    hour_to?: string;
    value_exact?: number;
    value_min?: number;
    value_max?: number;
}

interface BatchValidationResponse {
    ok?: boolean;
    source: 'json' | 'erp';
    batch_count: number;
    input_total?: number;
    input_total_after_filters?: number;
    erp_total_returned?: number;
    erp_total_after_filters?: number;
    applied_filters?: BatchAppliedFilters;
    url?: string;
    missing_cookies?: string[];
    results: Array<{
        input_id: string;
        sale_summary?: SaleSummary;
        validation: ValidationResult;
    }>;
}


const SalesValidation: React.FC = () => {
    const { isSuperAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState('single');
    const [jsonInput, setJsonInput] = useState('');
    const [batchInput, setBatchInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ValidationResult | null>(null);
    const [multiResults, setMultiResults] = useState<ValidationResult[] | null>(null);
    const [batchResult, setBatchResult] = useState<BatchValidationResponse | null>(null);

    // --- Source mode state ---
    const [singleSource, setSingleSource] = useState<'erp' | 'payload'>('erp');
    const [uuidInput, setUuidInput] = useState('');
    const [batchSource, setBatchSource] = useState<'json' | 'erp'>('erp');
    const [connections, setConnections] = useState<HiperConnection[]>([]);
    const [loadingConnections, setLoadingConnections] = useState(false);
    const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
    const [expandedBatchIdx, setExpandedBatchIdx] = useState<Set<number>>(new Set());

    // --- Modal state ---
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [detailsModalItem, setDetailsModalItem] = useState<BatchValidationResponse['results'][0] | null>(null);
    const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
    const [comparisonModalData, setComparisonModalData] = useState<ValidationResult | null>(null);
    const [comparisonModalLoading, setComparisonModalLoading] = useState(false);

    // --- Batch filter state ---
    const [batchSearchText, setBatchSearchText] = useState('');
    const [batchConfidenceFilter, setBatchConfidenceFilter] = useState<'all' | 'exact' | 'approx' | 'not_found'>('all');
    const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(true);
    const [storeOptions, setStoreOptions] = useState<PublicStore[]>([]);
    const [loadingStoreOptions, setLoadingStoreOptions] = useState(false);
    const [batchFilterStoreId, setBatchFilterStoreId] = useState('all');
    const [batchFilterTurnoSeq, setBatchFilterTurnoSeq] = useState('all');
    const [batchFilterOperationCode, setBatchFilterOperationCode] = useState('');
    const [batchFilterDateFrom, setBatchFilterDateFrom] = useState('');
    const [batchFilterDateTo, setBatchFilterDateTo] = useState('');
    const [batchFilterHourFrom, setBatchFilterHourFrom] = useState('');
    const [batchFilterHourTo, setBatchFilterHourTo] = useState('');
    const [batchFilterValueMode, setBatchFilterValueMode] = useState<'range' | 'exact'>('range');
    const [batchFilterValueExact, setBatchFilterValueExact] = useState('');
    const [batchFilterValueMin, setBatchFilterValueMin] = useState('');
    const [batchFilterValueMax, setBatchFilterValueMax] = useState('');

    const activeAdvancedFilterCount = useMemo(() => {
        let count = 0;

        if (batchFilterStoreId !== 'all') count += 1;
        if (batchFilterTurnoSeq !== 'all') count += 1;
        if (batchFilterOperationCode.trim()) count += 1;
        if (batchFilterDateFrom) count += 1;
        if (batchFilterDateTo) count += 1;
        if (batchFilterHourFrom) count += 1;
        if (batchFilterHourTo) count += 1;

        if (batchFilterValueMode === 'exact') {
            if (batchFilterValueExact.trim()) count += 1;
        } else if (batchFilterValueMin.trim() || batchFilterValueMax.trim()) {
            count += 1;
        }

        return count;
    }, [
        batchFilterStoreId,
        batchFilterTurnoSeq,
        batchFilterOperationCode,
        batchFilterDateFrom,
        batchFilterDateTo,
        batchFilterHourFrom,
        batchFilterHourTo,
        batchFilterValueMode,
        batchFilterValueExact,
        batchFilterValueMin,
        batchFilterValueMax,
    ]);

    // Filtered batch results (client-side, no API call)
    const filteredBatchResults = useMemo(() => {
        if (!batchResult) return [];
        let items = batchResult.results;
        // Text search
        if (batchSearchText.trim()) {
            const q = batchSearchText.toLowerCase();
            items = items.filter(item => {
                const s = item.sale_summary;
                return (
                    (s?.codigo?.toString() || '').includes(q) ||
                    (s?.loja_nome || '').toLowerCase().includes(q) ||
                    (s?.loja_cidade || '').toLowerCase().includes(q) ||
                    (s?.data || '').toLowerCase().includes(q) ||
                    (s?.erp_id || '').toLowerCase().includes(q) ||
                    (s?.turno || '').toLowerCase().includes(q)
                );
            });
        }
        // Confidence filter
        if (batchConfidenceFilter !== 'all') {
            items = items.filter(item => {
                const v = item.validation;
                if (batchConfidenceFilter === 'exact') return v.found && v.match_100;
                if (batchConfidenceFilter === 'approx') return v.found && !v.match_100;
                if (batchConfidenceFilter === 'not_found') return !v.found;
                return true;
            });
        }
        return items;
    }, [batchResult, batchSearchText, batchConfidenceFilter]);


    // Fetch connections when ERP mode is selected (either tab)
    useEffect(() => {
        const needsConns = (singleSource === 'erp' || batchSource === 'erp') && connections.length === 0 && isSuperAdmin;
        if (needsConns) {
            const fetchConns = async () => {
                setLoadingConnections(true);
                try {
                    const res = await hiperErpService.listConnections();
                    setConnections(res.connections ?? []);
                    if (res.connections?.length > 0) {
                        setSelectedConnectionId(res.connections[0].id);
                    }
                } catch (err: any) {
                    toast.error(err?.message || 'Erro ao carregar conexões.');
                } finally {
                    setLoadingConnections(false);
                }
            };
            fetchConns();
        }
    }, [singleSource, batchSource, isSuperAdmin]);

    useEffect(() => {
        if (activeTab !== 'batch' || storeOptions.length > 0) return;

        let mounted = true;

        const fetchStores = async () => {
            setLoadingStoreOptions(true);
            try {
                const res = await getAllPublicStores({ per_page: 300 });
                if (!mounted) return;
                setStoreOptions((res.data ?? []).filter((s) => !!s.id));
            } catch (err: any) {
                if (mounted) {
                    toast.error(err?.message || 'Não foi possível carregar as lojas para filtro.');
                }
            } finally {
                if (mounted) {
                    setLoadingStoreOptions(false);
                }
            }
        };

        fetchStores();

        return () => {
            mounted = false;
        };
    }, [activeTab, storeOptions.length]);

    // Parse JSON safely to extract comparison fields
    const parsedPayload = useMemo(() => {
        try {
            return jsonInput ? JSON.parse(jsonInput) : null;
        } catch {
            return null;
        }
    }, [jsonInput]);

    const parseNumberInput = (value: string): number | null => {
        const normalized = value.trim().replace(',', '.');
        if (!normalized) return null;

        const parsed = Number(normalized);
        if (!Number.isFinite(parsed)) return null;

        return parsed;
    };

    const resetAdvancedFilters = () => {
        setBatchFilterStoreId('all');
        setBatchFilterTurnoSeq('all');
        setBatchFilterOperationCode('');
        setBatchFilterDateFrom('');
        setBatchFilterDateTo('');
        setBatchFilterHourFrom('');
        setBatchFilterHourTo('');
        setBatchFilterValueMode('range');
        setBatchFilterValueExact('');
        setBatchFilterValueMin('');
        setBatchFilterValueMax('');
    };

    const buildBatchFiltersPayload = (): BatchAppliedFilters => {
        const filters: BatchAppliedFilters = {};

        if (batchFilterStoreId !== 'all') {
            const storeId = Number(batchFilterStoreId);
            filters.store_id = storeId;

            const selectedStore = storeOptions.find((store) => store.id === storeId);
            const storeGuid = selectedStore?.guid ?? selectedStore?.uuid ?? selectedStore?.store_uuid ?? selectedStore?.loja_uuid;
            if (storeGuid) {
                filters.store_guid = storeGuid;
            }
        }

        if (batchFilterTurnoSeq !== 'all') {
            filters.turno_seq = Number(batchFilterTurnoSeq);
        }

        if (batchFilterOperationCode.trim()) {
            const operationCode = Number(batchFilterOperationCode);
            if (!Number.isInteger(operationCode) || operationCode <= 0) {
                throw new Error('Código da operação inválido. Use apenas números inteiros.');
            }
            filters.operation_code = operationCode;
        }

        if (batchFilterDateFrom) {
            filters.date_from = batchFilterDateFrom;
        }

        if (batchFilterDateTo) {
            filters.date_to = batchFilterDateTo;
        }

        if (batchFilterDateFrom && batchFilterDateTo && batchFilterDateFrom > batchFilterDateTo) {
            throw new Error('Data inicial não pode ser maior que a data final.');
        }

        if (batchFilterHourFrom) {
            filters.hour_from = batchFilterHourFrom;
        }

        if (batchFilterHourTo) {
            filters.hour_to = batchFilterHourTo;
        }

        if (batchFilterValueMode === 'exact') {
            if (batchFilterValueExact.trim()) {
                const exact = parseNumberInput(batchFilterValueExact);
                if (exact === null || exact < 0) {
                    throw new Error('Valor exato inválido.');
                }
                filters.value_exact = exact;
            }
        } else {
            const min = parseNumberInput(batchFilterValueMin);
            const max = parseNumberInput(batchFilterValueMax);

            if (batchFilterValueMin.trim() && (min === null || min < 0)) {
                throw new Error('Valor mínimo inválido.');
            }

            if (batchFilterValueMax.trim() && (max === null || max < 0)) {
                throw new Error('Valor máximo inválido.');
            }

            if (min !== null) {
                filters.value_min = min;
            }
            if (max !== null) {
                filters.value_max = max;
            }
            if (min !== null && max !== null && min > max) {
                throw new Error('Valor mínimo não pode ser maior que o valor máximo.');
            }
        }

        return filters;
    };

    const handleValidate = async () => {
        if (singleSource === 'erp') {
            // --- ERP by UUID mode ---
            if (!uuidInput.trim()) {
                toast.error('Insira pelo menos um UUID.');
                return;
            }
            setIsLoading(true);
            setResult(null);
            setMultiResults(null);

            try {
                const data = await validateSale({
                    source: 'erp',
                    operation_ids: uuidInput.trim(),
                    connection_id: selectedConnectionId ?? undefined,
                });

                // Check if multi-result (multiple UUIDs)
                if (data.results && Array.isArray(data.results)) {
                    setMultiResults(data.results);
                    const found = data.results.filter((r: any) => r.found).length;
                    toast.success(`${found}/${data.results.length} vendas encontradas.`);
                } else {
                    setResult(data);
                    if (data.ok && data.found && data.comparison?.match_summary?.perfect) {
                        toast.success('Venda validada  -  match perfeito!');
                    } else if (data.ok && data.found) {
                        toast.warning('Venda encontrada com divergências.');
                    } else if (!data.ok && data.error) {
                        toast.error(data.error);
                    } else {
                        toast.error('Venda não encontrada.');
                    }
                }
            } catch (error: any) {
                console.error('Validation error:', error);
                setResult({ ok: false, found: false, match_100: false, error: error?.message || 'Erro ao conectar com o servidor.' });
                toast.error('Erro ao validar venda.');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // --- Payload (legacy) mode ---
        if (!jsonInput.trim()) {
            toast.error('Por favor, insira o JSON da venda.');
            return;
        }
        try { JSON.parse(jsonInput); } catch { toast.error('JSON inválido.'); return; }

        setIsLoading(true);
        setResult(null);
        setMultiResults(null);

        try {
            const data = await validateSale({ source: 'payload', payload: jsonInput });
            setResult(data);
            if (data.status_erp === 'CANCELLED') {
                toast.info('Venda CANCELADA no ERP.');
            } else if (data.ok && data.found && data.match_100) {
                toast.success('Venda validada com sucesso!');
            } else if (data.ok && data.found) {
                toast.warning('Venda encontrada com divergências.');
            } else {
                toast.error('Venda não encontrada ou erro na validação.');
            }
        } catch (error) {
            console.error('Validation error:', error);
            setResult({ ok: false, found: false, match_100: false, error: 'Erro ao conectar com o servidor.' });
            toast.error('Erro ao validar venda.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBatchValidate = async () => {
        let filters: BatchAppliedFilters = {};
        try {
            filters = buildBatchFiltersPayload();
        } catch (err: any) {
            toast.error(err?.message || 'Filtros avançados inválidos.');
            return;
        }

        if (batchSource === 'erp') {
            // --- ERP mode (simplified: backend uses pre-configured endpoint) ---
            setIsLoading(true);
            setBatchResult(null);

            try {
                const data = await validateSaleBatch({
                    source: 'erp',
                    connection_id: selectedConnectionId ?? undefined,
                    filters,
                });

                setBatchResult(data);

                if (data.missing_cookies && data.missing_cookies.length > 0) {
                    toast.warning(`Atenção: ${data.missing_cookies.length} cookie(s) faltando. Reimporte na página Hiper ERP.`);
                } else {
                    toast.success(`${data.batch_count} vendas do ERP processadas.`);
                }
            } catch (error: any) {
                console.error('ERP batch validation error:', error);
                toast.error(error?.message || 'Erro ao buscar/validar do ERP.');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // --- JSON mode (existing) ---
        let payload;
        try {
            payload = JSON.parse(batchInput);
            // If user pastes just an array, wrap it in { Lista: [...] }
            if (Array.isArray(payload)) {
                payload = { Lista: payload };
            }
            if (!payload.Lista || !Array.isArray(payload.Lista)) {
                throw new Error('Formato inválido. Esperado objeto com chave "Lista" ou array direto.');
            }
        } catch (e) {
            toast.error('JSON inválido ou mal formatado.');
            return;
        }

        setIsLoading(true);
        setBatchResult(null);

        try {
            const data = await validateSaleBatch({
                ...payload,
                filters,
            });
            setBatchResult(data);
            toast.success(`${data.batch_count} vendas processadas.`);
        } catch (error) {
            console.error('Batch validation error:', error);
            toast.error('Erro ao validar lote.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatDateTime = (isoString?: string) => {
        if (!isoString) return ' - ';
        return new Date(isoString).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const formatAppliedFilterLabel = (key: string, value: unknown): string => {
        if (value === null || value === undefined || value === '') return '';

        switch (key) {
            case 'store_id':
                return `Loja #${value}`;
            case 'store_guid':
                return `GUID loja ${String(value).slice(0, 8)}...`;
            case 'turno_seq':
                return `${value}º Turno`;
            case 'operation_code':
                return `Operação ERP ${value}`;
            case 'date_from':
                return `Data inicial ${value}`;
            case 'date_to':
                return `Data final ${value}`;
            case 'hour_from':
                return `Hora inicial ${value}`;
            case 'hour_to':
                return `Hora final ${value}`;
            case 'value_exact':
                return `Valor exato ${formatCurrency(Number(value))}`;
            case 'value_min':
                return `Valor mín. ${formatCurrency(Number(value))}`;
            case 'value_max':
                return `Valor máx. ${formatCurrency(Number(value))}`;
            default:
                return `${key}: ${String(value)}`;
        }
    };

    // Helper to determine status color/icon/text based on match flags
    const getStatusConfig = (res: ValidationResult) => {
        if (res.status_erp === 'CANCELLED') {
            return { color: "text-blue-600", bgColor: "bg-blue-500/10", borderColor: "border-l-blue-500", icon: AlertOctagon, title: "Venda Cancelada no ERP", description: res.reason || "Esta venda consta como cancelada no sistema de origem." };
        }
        if (!res.found) {
            return { color: "text-red-600", bgColor: "bg-red-500/10", borderColor: "border-l-red-500", icon: XCircle, title: "Venda Não Encontrada", description: res.reason || res.error || "Não encontramos registro compatível no banco de dados." };
        }
        if (res.match_100) {
            const perfect = res.comparison?.match_summary?.perfect || (res.content_match === true);
            if (perfect) {
                return { color: "text-green-600", bgColor: "bg-green-500/10", borderColor: "border-l-green-500", icon: ShieldCheck, title: "Match Perfeito (UUID)", description: "UUID bateu e todos os dados conferem." };
            }
            return { color: "text-amber-600", bgColor: "bg-amber-500/10", borderColor: "border-l-amber-500", icon: Lock, title: "UUID Encontrado  -  Com Divergências", description: "O UUID bateu mas há diferenças nos itens ou pagamentos." };
        }
        // heuristic
        return { color: "text-amber-600", bgColor: "bg-amber-500/10", borderColor: "border-l-amber-500", icon: AlertTriangle, title: "Provável Correspondência (Heurística)", description: "Encontrada baseada em loja, valor total e horário aproximado." };
    };

    const normalizeDbStatus = (status?: string | null): string | null => {
        if (!status) return null;
        const normalized = status.trim().toUpperCase();
        if (!normalized) return null;
        if (['CANCELADA', 'CANCELADO', 'CANCELLED'].includes(normalized)) return 'CANCELADO';
        if (['CONCLUIDA', 'CONCLUIDO', 'COMPLETED'].includes(normalized)) return 'CONCLUIDO';
        return normalized;
    };

    const resolveStatusValidation = (validation: ValidationResult, summary?: SaleSummary) => {
        const expected = normalizeDbStatus(
            validation.expected_status_db
            ?? (summary?.cancelada ? 'CANCELADO' : summary?.concluida ? 'CONCLUIDO' : null)
        );
        const db = normalizeDbStatus(
            validation.status_db
            ?? validation.best_match?.status_db
            ?? validation.best_match?.db_details?.venda?.status
            ?? null
        );
        const statusMatch = typeof validation.status_match === 'boolean'
            ? validation.status_match
            : (expected && db ? expected === db : null);

        return {
            expected,
            db,
            statusMatch,
        };
    };

    const getMatchBadge = (validation: ValidationResult, summary?: SaleSummary) => {
        const statusInfo = resolveStatusValidation(validation, summary);

        if (summary?.cancelada) {
            if (!validation.found) {
                return { text: 'Cancelada no ERP', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', icon: Ban, dot: 'bg-blue-500' };
            }
            if (statusInfo.statusMatch === true) {
                return { text: 'Cancelada • Status OK', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', icon: ShieldCheck, dot: 'bg-emerald-500' };
            }
            if (statusInfo.statusMatch === false) {
                return { text: 'Cancelada • Status Divergente', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', icon: AlertTriangle, dot: 'bg-red-500' };
            }
            return { text: 'Cancelada • Match parcial', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', icon: AlertOctagon, dot: 'bg-blue-500' };
        }

        if (!validation.found) {
            return { text: 'Não Encontrada', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', icon: XCircle, dot: 'bg-red-500' };
        }

        if (statusInfo.statusMatch === false) {
            return { text: 'Status Divergente', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', icon: AlertTriangle, dot: 'bg-red-500' };
        }

        if (validation.match_100) {
            return { text: 'Match Exato', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', icon: ShieldCheck, dot: 'bg-emerald-500' };
        }

        return { text: 'Match Aproximado', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', icon: AlertTriangle, dot: 'bg-amber-500' };
    };

    const ComparisonRow = ({ label, erpValue, dbValue, isCurrency = false, highlightDiff = false }: any) => {
        const isDiff = erpValue != dbValue && (erpValue !== undefined && dbValue !== undefined);
        // Simple equality check, for currency use small epsilon if needed but string comparison usually ok for display

        return (
            <div className={cn(
                "grid grid-cols-1 md:grid-cols-3 gap-2 py-3 border-b border-dashed last:border-0",
                isDiff && highlightDiff ? "bg-red-50/50 dark:bg-red-900/10" : ""
            )}>
                <div className="font-medium text-sm text-muted-foreground flex items-center">{label}</div>
                <div className="font-mono text-sm break-all">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">ERP (Origem)</span>
                    <span className={cn(isDiff && highlightDiff ? "text-red-600 font-bold" : "")}>
                        {errorMessage(erpValue, isCurrency)}
                    </span>
                </div>
                <div className="font-mono text-sm break-all">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Banco (Destino)</span>
                    <span className={cn(isDiff && highlightDiff ? "text-red-600 font-bold" : "")}>
                        {errorMessage(dbValue, isCurrency)}
                    </span>
                </div>
            </div>
        );
    };

    const errorMessage = (val: any, isCurrency: boolean) => {
        if (val === undefined || val === null || val === '') return ' - ';
        if (isCurrency && typeof val === 'number') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
        return val;
    }

    //  Shared Comparison sub-components 

    const MatchBadge = ({ ok, label }: { ok: boolean; label: string }) => (
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium inline-flex items-center gap-1",
            ok ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-300"
        )}>
            {ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {label}
        </span>
    );

    const MatchSummaryBar = ({ summary }: { summary: Comparison['match_summary'] }) => (
        <div className="flex flex-wrap gap-1.5 py-2">
            <MatchBadge ok={summary.operacao_uuid} label="UUID" />
            <MatchBadge ok={summary.total} label="Total" />
            <MatchBadge ok={summary.loja} label="Loja" />
            <MatchBadge ok={summary.vendedor} label="Vendedor" />
            <MatchBadge ok={summary.fiscal} label="Fiscal" />
            <MatchBadge ok={summary.all_itens} label="Itens" />
            <MatchBadge ok={summary.all_pagamentos} label="Pagamentos" />
        </div>
    );

    const SectionRow = ({ label, value }: { label: string; value: any }) => (
        <div className="flex justify-between py-1 text-xs border-b border-dashed border-muted-foreground/10 last:border-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono text-right break-all max-w-[60%]">{value ?? ' - '}</span>
        </div>
    );

    const SectionCard = ({ title, icon: Icon, erp, db, match }: { title: string; icon: any; erp: Record<string, any> | null; db: Record<string, any> | null; match: boolean | Record<string, boolean> }) => {
        const isMatch = typeof match === 'boolean' ? match : Object.values(match).every(v => v);
        return (
            <Collapsible defaultOpen={!isMatch}>
                <CollapsibleTrigger className="flex items-center justify-between w-full text-left py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {title}
                        {isMatch ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="grid grid-cols-2 gap-3 px-3 pb-3 pt-1">
                        <div className="rounded-lg border bg-muted/20 p-2.5">
                            <span className="text-[10px] font-semibold text-muted-foreground block mb-1.5">ERP (Hiper)</span>
                            {erp ? Object.entries(erp).map(([k, v]) => <SectionRow key={k} label={k} value={typeof v === 'boolean' ? (v ? 'Sim' : 'Não') : String(v)} />) : <p className="text-xs text-muted-foreground italic">Não disponível</p>}
                        </div>
                        <div className="rounded-lg border bg-muted/20 p-2.5">
                            <span className="text-[10px] font-semibold text-muted-foreground block mb-1.5">Banco Local</span>
                            {db ? Object.entries(db).map(([k, v]) => <SectionRow key={k} label={k} value={typeof v === 'boolean' ? (v ? 'Sim' : 'Não') : String(v)} />) : <p className="text-xs text-muted-foreground italic">Não disponível</p>}
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        );
    };

    const ItemsComparisonTable = ({ items }: { items: Comparison['itens'] }) => (
        <Collapsible defaultOpen={items.some(i => !i.match)}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    Itens ({items.length})
                    {items.every(i => i.match) ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="overflow-x-auto px-3 pb-3">
                    <table className="w-full text-xs">
                        <thead><tr className="text-muted-foreground border-b">
                            <th className="py-1.5 text-left w-8">#</th>
                            <th className="py-1.5 text-left">Código</th>
                            <th className="py-1.5 text-left">Nome</th>
                            <th className="py-1.5 text-right">Qtd</th>
                            <th className="py-1.5 text-right">Total</th>
                            <th className="py-1.5 text-left">Vendedor</th>
                            <th className="py-1.5 text-center">Status</th>
                        </tr></thead>
                        <tbody>
                            {items.map((item, i) => (
                                <tr key={i} className={cn("border-b last:border-0", !item.match && "bg-red-50/50 dark:bg-red-900/10")}>
                                    <td className="py-1.5 text-muted-foreground">{i + 1}</td>
                                    <td className="py-1.5 font-mono">{item.erp?.codigo || item.db?.codigo || ' - '}</td>
                                    <td className="py-1.5">{item.erp?.nome || item.db?.nome || ' - '}</td>
                                    <td className="py-1.5 text-right">
                                        {item.erp ? item.erp.qtd : ' - '}
                                        {item.erp && item.db && item.erp.qtd !== item.db.qtd && <span className="text-red-500 ml-1">{' -> '}{item.db.qtd}</span>}
                                    </td>
                                    <td className="py-1.5 text-right font-mono">
                                        {item.erp ? formatCurrency(item.erp.total) : ' - '}
                                        {item.erp && item.db && Math.abs(item.erp.total - item.db.total) >= 0.01 && <span className="text-red-500 block text-[10px]">DB: {formatCurrency(item.db.total)}</span>}
                                    </td>
                                    <td className="py-1.5">{item.erp?.vendedor || item.db?.vendedor || ' - '}</td>
                                    <td className="py-1.5 text-center">
                                        {item.match ? <CheckCircle className="w-3.5 h-3.5 text-green-500 mx-auto" /> : (
                                            !item.erp ? <span className="text-[9px] text-amber-600">Só DB</span> :
                                                !item.db ? <span className="text-[9px] text-red-600">Só ERP</span> :
                                                    <XCircle className="w-3.5 h-3.5 text-red-500 mx-auto" />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );

    const PaymentsComparisonTable = ({ payments }: { payments: Comparison['pagamentos'] }) => (
        <Collapsible defaultOpen={payments.some(p => !p.match)}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Pagamentos ({payments.length})
                    {payments.every(p => p.match) ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="overflow-x-auto px-3 pb-3">
                    <table className="w-full text-xs">
                        <thead><tr className="text-muted-foreground border-b">
                            <th className="py-1.5 text-left w-8">#</th>
                            <th className="py-1.5 text-left">Meio</th>
                            <th className="py-1.5 text-right">Valor</th>
                            <th className="py-1.5 text-right">Troco</th>
                            <th className="py-1.5 text-right">Parcelas</th>
                            <th className="py-1.5 text-center">Status</th>
                        </tr></thead>
                        <tbody>
                            {payments.map((pmt, i) => (
                                <tr key={i} className={cn("border-b last:border-0", !pmt.match && "bg-red-50/50 dark:bg-red-900/10")}>
                                    <td className="py-1.5 text-muted-foreground">{i + 1}</td>
                                    <td className="py-1.5">{pmt.erp?.meio || pmt.db?.meio || ' - '}</td>
                                    <td className="py-1.5 text-right font-mono">
                                        {pmt.erp ? formatCurrency(pmt.erp.valor) : ' - '}
                                        {pmt.erp && pmt.db && Math.abs(pmt.erp.valor - pmt.db.valor) >= 0.01 && <span className="text-red-500 block text-[10px]">DB: {formatCurrency(pmt.db.valor)}</span>}
                                    </td>
                                    <td className="py-1.5 text-right font-mono">{pmt.erp?.troco ?? pmt.db?.troco ?? ' - '}</td>
                                    <td className="py-1.5 text-right">{pmt.erp?.parcela ?? pmt.db?.parcelas ?? ' - '}</td>
                                    <td className="py-1.5 text-center">
                                        {pmt.match ? <CheckCircle className="w-3.5 h-3.5 text-green-500 mx-auto" /> : (
                                            !pmt.erp ? <span className="text-[9px] text-amber-600">Só DB</span> :
                                                !pmt.db ? <span className="text-[9px] text-red-600">Só ERP</span> :
                                                    <XCircle className="w-3.5 h-3.5 text-red-500 mx-auto" />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );

    const ComparisonView = ({ cmp, url, vendedor }: { cmp: Comparison; url?: string; vendedor?: any }) => (
        <Card className="shadow-sm border-muted-foreground/20">
            <CardHeader className="pb-2 border-b bg-muted/5">
                <CardTitle className="text-base font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                        Comparação ERP vs Banco Local
                    </div>
                    <div className="flex items-center gap-2">
                        {cmp.match_summary.perfect ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 h-6">✓ Perfeito</Badge>
                        ) : (
                            <Badge variant="destructive" className="h-6">Divergências</Badge>
                        )}
                        {url && (
                            <a href={url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1"><Globe className="w-3 h-3" /> Hiper</Button>
                            </a>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-1">
                <MatchSummaryBar summary={cmp.match_summary} />
                <div className="divide-y">
                    <SectionCard title="Operação" icon={Receipt} erp={cmp.operacao.erp} db={cmp.operacao.db} match={cmp.operacao.match} />
                    <SectionCard title="Loja" icon={Store} erp={cmp.loja.erp} db={cmp.loja.db} match={cmp.loja.match} />
                    <SectionCard title="Vendedor" icon={User} erp={cmp.vendedor.erp} db={cmp.vendedor.db} match={cmp.vendedor.match} />
                    {vendedor?.db?.whatsapp && (
                        <div className="px-3 py-1.5">
                            <a href={`https://wa.me/55${vendedor.db.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:underline">
                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp: {vendedor.db.whatsapp}
                            </a>
                        </div>
                    )}
                    <SectionCard title="Fiscal (NFC-e)" icon={FileText} erp={cmp.fiscal.erp} db={cmp.fiscal.db} match={cmp.fiscal.match} />
                    {cmp.itens && cmp.itens.length > 0 && <ItemsComparisonTable items={cmp.itens} />}
                    {cmp.pagamentos && cmp.pagamentos.length > 0 && <PaymentsComparisonTable payments={cmp.pagamentos} />}
                </div>
            </CardContent>
        </Card>
    );

    // --- Modal handlers ---
    const openDetailsModal = (item: BatchValidationResponse['results'][0]) => {
        setDetailsModalItem(item);
        setDetailsModalOpen(true);
    };

    const openComparisonModal = async (erpId: string) => {
        setComparisonModalLoading(true);
        setComparisonModalData(null);
        setComparisonModalOpen(true);
        try {
            const res = await validateSale({
                source: 'erp',
                operation_ids: erpId,
                connection_id: selectedConnectionId ?? undefined,
            });
            setComparisonModalData(res);
        } catch (err: any) {
            toast.error(err?.message || 'Erro ao buscar comparativo.');
            setComparisonModalOpen(false);
        } finally {
            setComparisonModalLoading(false);
        }
    };

    const statusConfig = result ? getStatusConfig(result) : null;

    // Default heuristics for ERP values if not present
    const erpTotal = parsedPayload?.ValorTotalLiquido;
    const erpStore = parsedPayload?.Loja?.Nome;
    const erpSeller = parsedPayload?.Itens?.[0]?.NomeDoVendedor || parsedPayload?.Itens?.[0]?.Vendedor?.Nome || parsedPayload?.NomeDoUsuarioQueRealizouAOperacao;
    const erpDate = parsedPayload?.Data;

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
            <PageHeader
                title="Validação de Vendas"
                description="Valide dados de vendas do ERP contra o banco local"
            />

            <ValidationNav />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="single">Validação Individual</TabsTrigger>
                    <TabsTrigger value="batch">Validação em Lote (Batch)</TabsTrigger>
                </TabsList>

                <TabsContent value="single" className="space-y-6 min-h-[600px]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                        {/* Input Section */}
                        <Card className="h-full flex flex-col shadow-md border-muted-foreground/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Database className="h-5 w-5 text-primary" />
                                    Validação Individual
                                </CardTitle>
                                <CardDescription>
                                    Busque pelo UUID da operação ou cole o JSON manualmente.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col gap-4">
                                {/* Source Toggle */}
                                <div className="rounded-lg border border-border/60 p-3 bg-muted/10">
                                    <Label className="text-xs text-muted-foreground mb-2 block">Fonte dos dados</Label>
                                    <RadioGroup
                                        value={singleSource}
                                        onValueChange={(v) => setSingleSource(v as 'erp' | 'payload')}
                                        className="flex gap-4"
                                    >
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value="erp" id="single-erp" />
                                            <Label htmlFor="single-erp" className="text-sm cursor-pointer flex items-center gap-1.5">
                                                <Globe className="h-3.5 w-3.5" />
                                                Buscar do ERP (UUID)
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem value="payload" id="single-payload" />
                                            <Label htmlFor="single-payload" className="text-sm cursor-pointer flex items-center gap-1.5">
                                                <FileJson className="h-3.5 w-3.5" />
                                                JSON Manual
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {singleSource === 'erp' ? (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-sm">UUID(s) da Operação</Label>
                                            <Input
                                                placeholder="ee07b5ea-0929-4d14-ba79-328bef67819c"
                                                className="font-mono text-xs"
                                                value={uuidInput}
                                                onChange={(e) => setUuidInput(e.target.value)}
                                            />
                                            <p className="text-[10px] text-muted-foreground">
                                                Separe múltiplos UUIDs por vírgula.
                                            </p>
                                        </div>
                                        {/* Connection selector (shared) */}
                                        {connections.length > 1 && (
                                            <div className="space-y-1.5">
                                                <Label className="text-sm">Conexão ERP</Label>
                                                <Select
                                                    value={selectedConnectionId?.toString() ?? ''}
                                                    onValueChange={(v) => setSelectedConnectionId(v ? Number(v) : null)}
                                                    disabled={loadingConnections}
                                                >
                                                    <SelectTrigger><SelectValue placeholder={loadingConnections ? 'Carregando...' : 'Selecione'} /></SelectTrigger>
                                                    <SelectContent>
                                                        {connections.map((c) => (
                                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={cn("h-2 w-2 rounded-full", c.is_active ? 'bg-emerald-400' : 'bg-zinc-500')} />
                                                                    {c.name}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        {connections.length === 1 && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                                Conexão: <span className="font-medium text-foreground">{connections[0].name}</span>
                                            </div>
                                        )}
                                        {loadingConnections && connections.length === 0 && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Carregando conexões...
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Textarea
                                        placeholder='{ "CodigoDaOperacao": 12345, ... }'
                                        className="flex-1 font-mono text-xs min-h-[300px] resize-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                        value={jsonInput}
                                        onChange={(e) => setJsonInput(e.target.value)}
                                    />
                                )}

                                <Button
                                    onClick={handleValidate}
                                    disabled={isLoading || (singleSource === 'erp' ? !uuidInput.trim() : !jsonInput.trim())}
                                    size="lg"
                                    className="w-full font-semibold shadow-sm"
                                >
                                    {isLoading && activeTab === 'single' ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validando...</>
                                    ) : (
                                        <><Search className="mr-2 h-4 w-4" /> Validar Venda</>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Result Section */}
                        <div className="space-y-6">
                            {!result && !multiResults && !isLoading && (
                                <Card className="h-full flex items-center justify-center bg-muted/20 border-dashed border-2">
                                    <CardContent className="text-center py-12">
                                        <Search className="h-16 w-16 mx-auto text-muted-foreground/30 mb-6" />
                                        <h3 className="text-xl font-medium text-muted-foreground">
                                            Aguardando Validação
                                        </h3>
                                        <p className="text-sm text-muted-foreground/70 max-w-xs mx-auto mt-2">
                                            {singleSource === 'erp'
                                                ? 'Insira o UUID da operação e clique em validar.'
                                                : 'Cole o JSON ao lado e clique em validar para ver a análise.'}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {isLoading && activeTab === 'single' && (
                                <Card className="h-full flex items-center justify-center border-none shadow-none bg-transparent">
                                    <CardContent className="text-center py-12">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50 animate-pulse"></div>
                                            <Loader2 className="relative h-16 w-16 mx-auto text-primary animate-spin mb-6" />
                                        </div>
                                        <h3 className="text-xl font-medium">Verificando Integridade...</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                                            Consultando UUIDs, Chaves Fiscais e Assinaturas de Venda.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Multi-result rendering (multiple UUIDs) */}
                            {multiResults && multiResults.length > 0 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Database className="h-4 w-4" />
                                        {multiResults.length} resultado(s)
                                    </div>
                                    {multiResults.map((res, idx) => {
                                        const sc = getStatusConfig(res);
                                        return (
                                            <div key={idx} className="space-y-3">
                                                <Card className={cn("border-l-4 shadow-sm", sc.borderColor, sc.bgColor)}>
                                                    <CardContent className="pt-4 pb-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className={cn("p-2 rounded-full shrink-0", sc.bgColor, sc.color)}>
                                                                <sc.icon className="h-6 w-6" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className={cn("text-base font-bold", sc.color)}>{sc.title}</h4>
                                                                <p className="text-xs text-muted-foreground">{sc.description}</p>
                                                                {res.operation_id && (
                                                                    <p className="text-[10px] font-mono text-muted-foreground mt-1">UUID: {res.operation_id}</p>
                                                                )}
                                                                {res.best_match?.pdv_venda_id && (
                                                                    <Link to={`/admin/pdv/sales/${res.best_match.pdv_venda_id}`} className="mt-2 inline-block">
                                                                        <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
                                                                            Ver Venda <ExternalLink className="h-3 w-3" />
                                                                        </Button>
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                {res.comparison && (
                                                    <ComparisonView cmp={res.comparison} url={res.url} vendedor={res.comparison.vendedor} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Single Result */}
                            {result && statusConfig && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Layer 1: Main Status Card */}
                                    <Card className={cn(
                                        "border-l-4 shadow-sm overflow-hidden",
                                        statusConfig.borderColor,
                                        result.status_erp === 'CANCELLED' ? 'bg-blue-50 dark:bg-blue-950/20' :
                                            result.found ? statusConfig.bgColor : 'bg-red-50 dark:bg-red-950/20'
                                    )}>
                                        <CardContent className="pt-6 pb-6">
                                            <div className="flex items-start gap-4">
                                                <div className={cn(
                                                    "p-3 rounded-full shrink-0",
                                                    statusConfig.bgColor,
                                                    statusConfig.color,
                                                    result.found ? "bg-white/50 dark:bg-black/20" : ""
                                                )}>
                                                    <statusConfig.icon className="h-8 w-8" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={cn("text-xl font-bold mb-1", statusConfig.color)}>
                                                        {statusConfig.title}
                                                    </h3>
                                                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                                                        {statusConfig.description}
                                                    </p>

                                                    {/* Badges */}
                                                    {result.found && result.best_match && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            <Badge variant="outline" className={cn(
                                                                "flex items-center gap-1.5 h-7 px-3",
                                                                result.best_match.store_identity_match
                                                                    ? "border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                                                                    : "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300"
                                                            )}>
                                                                {result.best_match.store_identity_match ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                                                <span>Loja: {result.best_match.store_identity_match ? 'Verificada' : 'Atenção'}</span>
                                                            </Badge>
                                                            <Badge variant="outline" className={cn(
                                                                "flex items-center gap-1.5 h-7 px-3",
                                                                result.best_match.seller_identity_match
                                                                    ? "border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                                                                    : "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300"
                                                            )}>
                                                                {result.best_match.seller_identity_match ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                                                <span>Vendedor: {result.best_match.seller_identity_match ? 'Verificado' : 'Divergente'}</span>
                                                            </Badge>
                                                            <Badge variant="outline" className={cn(
                                                                "flex items-center gap-1.5 h-7 px-3",
                                                                result.content_match
                                                                    ? "border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                                                                    : "border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                                                            )}>
                                                                {result.content_match ? <Database className="w-3.5 h-3.5" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
                                                                <span>Dados: {result.content_match ? '100% Sincronizados' : 'Divergência'}</span>
                                                            </Badge>
                                                        </div>
                                                    )}

                                                    {result.best_match?.pdv_venda_id && (
                                                        <div className="mt-4 pt-4 border-t border-dashed border-black/5 dark:border-white/5">
                                                            <Link to={`/admin/pdv/sales/${result.best_match.pdv_venda_id}`}>
                                                                <Button variant="outline" size="sm" className="gap-2 bg-background/50 hover:bg-background">
                                                                    Ver Detalhes da Venda
                                                                    <ExternalLink className="h-3 w-3" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Layer 2: Comparison  -  use ComparisonView if available, else legacy */}
                                    {result.found && result.comparison && (
                                        <ComparisonView cmp={result.comparison} url={result.url} vendedor={result.comparison.vendedor} />
                                    )}

                                    {result.found && !result.comparison && result.best_match && (
                                        <Card className="shadow-sm border-muted-foreground/20">
                                            <CardHeader className="pb-3 border-b bg-muted/5">
                                                <CardTitle className="text-base font-medium flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                                                        Comparativo de Dados (Payload vs Banco)
                                                    </div>
                                                    {!result.content_match && (
                                                        <Badge variant="destructive" className="h-6">Requer Atenção</Badge>
                                                    )}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <div className="space-y-0">
                                                    <ComparisonRow label="Loja" erpValue={erpStore} dbValue={result.best_match.db_details?.venda?.store_name || result.best_match.db_details?.store_db?.nome_hiper} highlightDiff={!result.best_match.store_identity_match} />
                                                    <ComparisonRow label="Vendedor" erpValue={erpSeller} dbValue={result.best_match.db_details?.itens?.[0]?.vendedor_nome || result.best_match.db_details?.user_db?.nome} highlightDiff={!result.best_match.seller_identity_match} />
                                                    <ComparisonRow label="Valor Total" erpValue={erpTotal} dbValue={result.best_match.db_details?.venda?.total || result.best_match.total} isCurrency highlightDiff={Math.abs((erpTotal || 0) - (result.best_match.total || 0)) > 0.05} />
                                                    <ComparisonRow label="Data Venda" erpValue={erpDate ? formatDateTime(erpDate) : ' - '} dbValue={formatDateTime(result.best_match.db_details?.venda?.data_hora || result.best_match.db_details?.timestamps?.data_venda)} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Debug Info */}
                                    {(!result.found || result.best_match?.match_type === 'heuristic') && result.search && (
                                        <Alert variant="default" className="bg-muted/30 border-dashed border-2">
                                            <Search className="h-4 w-4 text-muted-foreground" />
                                            <AlertTitle>Parâmetros da Busca (Debug)</AlertTitle>
                                            <AlertDescription className="mt-3 text-xs font-mono text-muted-foreground space-y-2">
                                                {result.search.store_id && (
                                                    <div className="flex justify-between border-b border-dashed border-muted-foreground/20 pb-1">
                                                        <span>Loja ID:</span>
                                                        <span className="font-bold">{result.search.store_id}</span>
                                                    </div>
                                                )}
                                                {result.search.window_utc && (
                                                    <div className="flex flex-col gap-1 border-b border-dashed border-muted-foreground/20 pb-1">
                                                        <span>Janela de Busca (UTC):</span>
                                                        <span className="font-bold text-[10px] break-all">
                                                            {result.search.window_utc[0]} <br />
                                                            {result.search.window_utc[1]}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span>Total Buscado:</span>
                                                    <span className="font-bold">{result.search.total_searched !== undefined ? formatCurrency(result.search.total_searched) : ' - '}</span>
                                                </div>
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="batch" className="space-y-6 min-h-[600px]">
                    <div className="space-y-6">
                        {/* Batch Input Section */}
                        <Card className="flex flex-col shadow-md border-muted-foreground/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileJson className="h-5 w-5 text-primary" />
                                    Validação em Lote
                                </CardTitle>
                                <CardDescription>
                                    Valide múltiplas vendas de uma vez - cole o JSON ou busque direto do ERP.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col gap-4">
                                {/* Source Selector  -  only for super admins */}
                                {isSuperAdmin && (
                                    <div className="rounded-lg border border-border/60 p-3 bg-muted/10">
                                        <Label className="text-xs text-muted-foreground mb-2 block">Fonte dos dados</Label>
                                        <RadioGroup
                                            value={batchSource}
                                            onValueChange={(v) => setBatchSource(v as 'json' | 'erp')}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="erp" id="src-erp-b" />
                                                <Label htmlFor="src-erp-b" className="text-sm cursor-pointer flex items-center gap-1.5">
                                                    <Globe className="h-3.5 w-3.5" />
                                                    Buscar do ERP
                                                </Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="json" id="src-json-b" />
                                                <Label htmlFor="src-json-b" className="text-sm cursor-pointer flex items-center gap-1.5">
                                                    <FileJson className="h-3.5 w-3.5" />
                                                    JSON Manual
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                )}

                                {/* Advanced API Filters */}
                                <Collapsible open={advancedFiltersOpen} onOpenChange={setAdvancedFiltersOpen}>
                                    <div className="rounded-lg border border-border/60 bg-muted/10">
                                        <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/20 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <SlidersHorizontal className="h-4 w-4 text-primary" />
                                                <div>
                                                    <p className="text-sm font-medium">Filtros avançados (API)</p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Loja, turno, data/hora, valor ou faixa e código da operação
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {activeAdvancedFilterCount > 0 && (
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {activeAdvancedFilterCount} ativo(s)
                                                    </Badge>
                                                )}
                                                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", advancedFiltersOpen && "rotate-180")} />
                                            </div>
                                        </CollapsibleTrigger>

                                        <CollapsibleContent>
                                            <div className="px-3 pb-3 space-y-3 border-t border-border/40">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Loja</Label>
                                                        <Select
                                                            value={batchFilterStoreId}
                                                            onValueChange={setBatchFilterStoreId}
                                                            disabled={loadingStoreOptions}
                                                        >
                                                            <SelectTrigger className="h-9 text-xs">
                                                                <SelectValue placeholder={loadingStoreOptions ? 'Carregando lojas...' : 'Todas as lojas'} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">Todas as lojas</SelectItem>
                                                                {storeOptions.map((store) => (
                                                                    <SelectItem key={store.id} value={store.id.toString()}>
                                                                        {store.name}{store.city ? ` • ${store.city}` : ''}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Turno (Sequencial)</Label>
                                                        <Select value={batchFilterTurnoSeq} onValueChange={setBatchFilterTurnoSeq}>
                                                            <SelectTrigger className="h-9 text-xs">
                                                                <SelectValue placeholder="Todos os turnos" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">Todos os turnos</SelectItem>
                                                                {[1, 2, 3, 4, 5, 6].map((seq) => (
                                                                    <SelectItem key={seq} value={seq.toString()}>
                                                                        {seq}º Turno
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Código da Operação (ERP)</Label>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            step={1}
                                                            placeholder="Ex.: 298870"
                                                            className="h-9 text-xs"
                                                            value={batchFilterOperationCode}
                                                            onChange={(e) => setBatchFilterOperationCode(e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Data inicial</Label>
                                                        <Input
                                                            type="date"
                                                            className="h-9 text-xs"
                                                            value={batchFilterDateFrom}
                                                            onChange={(e) => setBatchFilterDateFrom(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Data final</Label>
                                                        <Input
                                                            type="date"
                                                            className="h-9 text-xs"
                                                            value={batchFilterDateTo}
                                                            onChange={(e) => setBatchFilterDateTo(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Hora inicial</Label>
                                                        <Input
                                                            type="time"
                                                            className="h-9 text-xs"
                                                            value={batchFilterHourFrom}
                                                            onChange={(e) => setBatchFilterHourFrom(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Hora final</Label>
                                                        <Input
                                                            type="time"
                                                            className="h-9 text-xs"
                                                            value={batchFilterHourTo}
                                                            onChange={(e) => setBatchFilterHourTo(e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">Filtro de valor</Label>
                                                        <Select
                                                            value={batchFilterValueMode}
                                                            onValueChange={(value) => setBatchFilterValueMode(value as 'range' | 'exact')}
                                                        >
                                                            <SelectTrigger className="h-9 text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="range">Faixa de valor</SelectItem>
                                                                <SelectItem value="exact">Valor exato</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {batchFilterValueMode === 'exact' ? (
                                                        <div className="space-y-1.5 md:col-span-2">
                                                            <Label className="text-xs">Valor exato</Label>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                step="0.01"
                                                                placeholder="Ex.: 114.00"
                                                                className="h-9 text-xs"
                                                                value={batchFilterValueExact}
                                                                onChange={(e) => setBatchFilterValueExact(e.target.value)}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs">Valor mínimo</Label>
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    step="0.01"
                                                                    placeholder="Ex.: 50.00"
                                                                    className="h-9 text-xs"
                                                                    value={batchFilterValueMin}
                                                                    onChange={(e) => setBatchFilterValueMin(e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs">Valor máximo</Label>
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    step="0.01"
                                                                    placeholder="Ex.: 500.00"
                                                                    className="h-9 text-xs"
                                                                    value={batchFilterValueMax}
                                                                    onChange={(e) => setBatchFilterValueMax(e.target.value)}
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between gap-2 pt-1">
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Estes filtros são enviados no POST para <code className="font-mono">api/v1/pdv/sales/validate-batch</code>.
                                                    </p>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-xs"
                                                        onClick={resetAdvancedFilters}
                                                        disabled={activeAdvancedFilterCount === 0}
                                                    >
                                                        Limpar filtros
                                                    </Button>
                                                </div>
                                            </div>
                                        </CollapsibleContent>
                                    </div>
                                </Collapsible>

                                {/* JSON Manual Mode */}
                                {batchSource === 'json' && (
                                    <>
                                        <Textarea
                                            placeholder='{ "Lista": [ { "Id": "...", "ValorTotalLiquido": 150.00, ... } ] }'
                                            className="flex-1 font-mono text-xs min-h-[200px] resize-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            value={batchInput}
                                            onChange={(e) => setBatchInput(e.target.value)}
                                        />
                                        <Button
                                            onClick={handleBatchValidate}
                                            disabled={isLoading || !batchInput}
                                            size="lg"
                                            className="w-full font-semibold shadow-sm"
                                        >
                                            {isLoading && activeTab === 'batch' ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Processando Lote...
                                                </>
                                            ) : (
                                                <>
                                                    <Search className="mr-2 h-4 w-4" />
                                                    Validar Lote
                                                </>
                                            )}
                                        </Button>
                                    </>
                                )}

                                {/* ERP Mode */}
                                {batchSource === 'erp' && (
                                    <>
                                        {/* Connection Selector */}
                                        {connections.length > 1 && (
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm">Conexão</Label>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={async () => {
                                                            setLoadingConnections(true);
                                                            try {
                                                                const res = await hiperErpService.listConnections();
                                                                setConnections(res.connections ?? []);
                                                            } catch { } finally {
                                                                setLoadingConnections(false);
                                                            }
                                                        }}
                                                        disabled={loadingConnections}
                                                    >
                                                        <RefreshCw className={cn("h-3 w-3", loadingConnections && "animate-spin")} />
                                                    </Button>
                                                </div>
                                                <Select
                                                    value={selectedConnectionId?.toString() ?? ''}
                                                    onValueChange={(v) => setSelectedConnectionId(v ? Number(v) : null)}
                                                    disabled={loadingConnections}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={loadingConnections ? 'Carregando...' : 'Selecione'} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {connections.map((c) => (
                                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={cn("h-2 w-2 rounded-full", c.is_active ? 'bg-emerald-400' : 'bg-zinc-500')} />
                                                                    {c.name}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Single connection info */}
                                        {connections.length === 1 && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                                Conexão: <span className="font-medium text-foreground">{connections[0].name}</span>
                                            </div>
                                        )}

                                        {/* Loading state */}
                                        {loadingConnections && connections.length === 0 && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Carregando conexões...
                                            </div>
                                        )}

                                        {/* Info: backend uses pre-configured endpoint */}
                                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                            <span>
                                                O endpoint <code className="px-1 py-0.5 bg-emerald-100 dark:bg-emerald-900 rounded text-[10px] font-mono">operacoes.listar.vendas</code> será usado com os filtros acima (quando preenchidos).
                                            </span>
                                        </div>

                                        <Button
                                            onClick={handleBatchValidate}
                                            disabled={isLoading || !selectedConnectionId}
                                            size="lg"
                                            className="w-full font-semibold shadow-sm gap-2"
                                        >
                                            {isLoading && activeTab === 'batch' ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Buscando do ERP e Validando...
                                                </>
                                            ) : (
                                                <>
                                                    <Globe className="h-4 w-4" />
                                                    Buscar do ERP e Validar
                                                </>
                                            )}
                                        </Button>

                                        {!selectedConnectionId && !loadingConnections && connections.length > 0 && (
                                            <p className="text-xs text-muted-foreground text-center">Selecione uma conexão acima.</p>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Batch Result Section */}
                        <div className="space-y-6">

                            {isLoading && activeTab === 'batch' && (
                                <Card className="h-full flex items-center justify-center border-none shadow-none bg-transparent">
                                    <CardContent className="text-center py-12">
                                        <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-6" />
                                        <h3 className="text-xl font-medium">Processando Lote...</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                                            Analisando cada venda individualmente.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {batchResult && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Missing Cookies Warning (ERP mode) */}
                                    {batchResult.missing_cookies && batchResult.missing_cookies.length > 0 && (
                                        <Alert className="border-amber-500/30 bg-amber-500/5">
                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            <AlertTitle className="text-amber-600 dark:text-amber-400 text-sm">Cookies Expirados</AlertTitle>
                                            <AlertDescription className="text-xs">
                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                    {batchResult.missing_cookies.map((c) => (
                                                        <Badge key={c} variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-300">
                                                            {c}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <p className="mt-2 text-muted-foreground">
                                                    Reimporte os cookies em{' '}
                                                    <Link to="/admin/hiper/conexao" className="underline text-primary">
                                                        Conexão ERP Hiper
                                                    </Link>.
                                                </p>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-slate-50/80 to-white dark:from-slate-900/80 dark:to-slate-800/50">
                                        <CardContent className="pt-5 pb-4 space-y-4">
                                            <div className="flex items-center justify-between flex-wrap gap-3">
                                                <div>
                                                    <h3 className="text-lg font-bold">Resumo do Lote</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {batchResult.batch_count} vendas processadas
                                                        {batchResult.source === 'erp' && batchResult.erp_total_returned !== undefined && (
                                                            <span>
                                                                {' '}• ERP retornou {batchResult.erp_total_returned}
                                                                {batchResult.erp_total_after_filters !== undefined && `, ${batchResult.erp_total_after_filters} após filtros`}
                                                            </span>
                                                        )}
                                                        {batchResult.source === 'json' && batchResult.input_total !== undefined && (
                                                            <span>
                                                                {' '}• JSON recebeu {batchResult.input_total}
                                                                {batchResult.input_total_after_filters !== undefined && `, ${batchResult.input_total_after_filters} após filtros`}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                {batchResult.source === 'erp' && (
                                                    <Badge variant="secondary" className="text-[10px] bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/30">
                                                        <Globe className="h-3 w-3 mr-1" />
                                                        ERP
                                                    </Badge>
                                                )}
                                            </div>
                                            {batchResult.applied_filters && Object.keys(batchResult.applied_filters).length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {Object.entries(batchResult.applied_filters).map(([key, value]) => {
                                                        const label = formatAppliedFilterLabel(key, value);
                                                        if (!label) return null;

                                                        return (
                                                            <Badge
                                                                key={`${key}-${value}`}
                                                                variant="outline"
                                                                className="text-[10px] border-blue-300/60 text-blue-700 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-950/20"
                                                            >
                                                                {label}
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {(() => {
                                                const total = batchResult.results.length;
                                                const matchExact = batchResult.results.filter(r => r.validation.found && r.validation.match_100).length;
                                                const matchApprox = batchResult.results.filter(r => r.validation.found && !r.validation.match_100).length;
                                                const notFound = batchResult.results.filter(r => !r.validation.found).length;
                                                const cancelled = batchResult.results.filter(r => r.sale_summary?.cancelada).length;
                                                const pctExact = total > 0 ? (matchExact / total) * 100 : 0;
                                                const pctApprox = total > 0 ? (matchApprox / total) * 100 : 0;
                                                const pctNotFound = total > 0 ? (notFound / total) * 100 : 0;
                                                return (
                                                    <>
                                                        <div className="h-2.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex">
                                                            {pctExact > 0 && <div className="bg-emerald-500 transition-all duration-700 ease-out" style={{ width: `${pctExact}%` }} />}
                                                            {pctApprox > 0 && <div className="bg-amber-400 transition-all duration-700 ease-out" style={{ width: `${pctApprox}%` }} />}
                                                            {pctNotFound > 0 && <div className="bg-red-400 transition-all duration-700 ease-out" style={{ width: `${pctNotFound}%` }} />}
                                                        </div>
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                            <div className="flex items-center gap-2 rounded-lg border bg-white/60 dark:bg-white/5 px-3 py-2">
                                                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                                                                <div>
                                                                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{matchExact}</div>
                                                                    <div className="text-[10px] text-muted-foreground leading-tight">Match Exato</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 rounded-lg border bg-white/60 dark:bg-white/5 px-3 py-2">
                                                                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shrink-0" />
                                                                <div>
                                                                    <div className="text-lg font-bold text-amber-500 dark:text-amber-400">{matchApprox}</div>
                                                                    <div className="text-[10px] text-muted-foreground leading-tight">Match Aprox.</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 rounded-lg border bg-white/60 dark:bg-white/5 px-3 py-2">
                                                                <span className="h-2.5 w-2.5 rounded-full bg-red-400 shrink-0" />
                                                                <div>
                                                                    <div className="text-lg font-bold text-red-500 dark:text-red-400">{notFound}</div>
                                                                    <div className="text-[10px] text-muted-foreground leading-tight">Não Encontrada</div>
                                                                </div>
                                                            </div>
                                                            {cancelled > 0 && (
                                                                <div className="flex items-center gap-2 rounded-lg border bg-white/60 dark:bg-white/5 px-3 py-2">
                                                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-400 shrink-0" />
                                                                    <div>
                                                                        <div className="text-lg font-bold text-blue-500 dark:text-blue-400">{cancelled}</div>
                                                                        <div className="text-[10px] text-muted-foreground leading-tight">Cancelada</div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                            {batchResult.source === 'erp' && batchResult.url && (
                                                <code className="text-[10px] text-muted-foreground break-all block">
                                                    {batchResult.url}
                                                </code>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Filter Bar */}
                                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar por código, loja, data..."
                                                className="pl-9 h-9 text-sm"
                                                value={batchSearchText}
                                                onChange={(e) => setBatchSearchText(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {[
                                                { key: 'all' as const, label: 'Todos', count: batchResult.results.length },
                                                { key: 'exact' as const, label: 'Exato', count: batchResult.results.filter(r => r.validation.found && r.validation.match_100).length },
                                                { key: 'approx' as const, label: 'Aprox.', count: batchResult.results.filter(r => r.validation.found && !r.validation.match_100).length },
                                                { key: 'not_found' as const, label: 'Não encontrada', count: batchResult.results.filter(r => !r.validation.found).length },
                                            ].map(f => (
                                                <Button
                                                    key={f.key}
                                                    variant={batchConfidenceFilter === f.key ? 'default' : 'outline'}
                                                    size="sm"
                                                    className={cn(
                                                        "h-8 text-xs gap-1.5 transition-all",
                                                        batchConfidenceFilter === f.key && f.key === 'exact' && 'bg-emerald-600 hover:bg-emerald-700',
                                                        batchConfidenceFilter === f.key && f.key === 'approx' && 'bg-amber-500 hover:bg-amber-600',
                                                        batchConfidenceFilter === f.key && f.key === 'not_found' && 'bg-red-500 hover:bg-red-600',
                                                    )}
                                                    onClick={() => setBatchConfidenceFilter(f.key)}
                                                >
                                                    {f.label}
                                                    <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-[10px] bg-white/20 text-inherit">
                                                        {f.count}
                                                    </Badge>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Batch Results Table */}
                                    <div className="rounded-lg border overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-muted/50 text-xs text-muted-foreground">
                                                        <th className="text-left px-3 py-2.5 font-medium">Cod.</th>
                                                        <th className="text-left px-3 py-2.5 font-medium">Loja</th>
                                                        <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">Data / Hora</th>
                                                        <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Turno</th>
                                                        <th className="text-center px-3 py-2.5 font-medium hidden sm:table-cell">Itens</th>
                                                        <th className="text-right px-3 py-2.5 font-medium">Valor</th>
                                                        <th className="text-center px-3 py-2.5 font-medium">Confiança</th>
                                                        <th className="text-center px-3 py-2.5 font-medium">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredBatchResults.length === 0 && (
                                                        <tr>
                                                            <td colSpan={8} className="text-center py-8 text-muted-foreground">
                                                                <Filter className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                                                <p className="text-sm">Nenhum resultado encontrado com os filtros atuais.</p>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {filteredBatchResults.map((item, index) => {
                                                        const config = getStatusConfig(item.validation);
                                                        const summary = item.sale_summary;
                                                        const statusInfo = resolveStatusValidation(item.validation, summary);
                                                        const canOpenDetails = Boolean(item.validation.best_match?.db_details);
                                                        const canOpenComparison = Boolean(summary?.erp_id);
                                                        const showActions = canOpenDetails || canOpenComparison;
                                                        const CodeIcon = summary?.cancelada ? Ban : config.icon;
                                                        return (
                                                            <tr
                                                                key={item.input_id || index}
                                                                className={cn(
                                                                    "border-b last:border-0 transition-all duration-200 hover:bg-muted/40 hover:shadow-sm",
                                                                    summary?.cancelada && "bg-blue-50/30 dark:bg-blue-950/10",
                                                                    !item.validation.found && !summary?.cancelada && "bg-muted/10 opacity-60"
                                                                )}
                                                            >
                                                                {/* Cod. */}
                                                                <td className="px-3 py-2.5 font-mono text-xs">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <CodeIcon className={cn("h-3.5 w-3.5 shrink-0", config.color)} />
                                                                        {summary?.codigo ? (
                                                                            <span className="font-semibold">{summary.codigo}</span>
                                                                        ) : (
                                                                            <span className="text-muted-foreground truncate max-w-[80px]" title={item.input_id}>
                                                                                {item.input_id.substring(0, 8)}...
                                                                            </span>
                                                                        )}
                                                                        {summary?.cancelada && (
                                                                            <Badge variant="outline" className="text-[9px] h-4 px-1 border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300">
                                                                                <Ban className="h-2 w-2" />
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                {/* Loja */}
                                                                <td className="px-3 py-2.5 text-xs max-w-[180px]">
                                                                    {summary?.loja_nome ? (
                                                                        <div className={cn(!summary.found_in_db && "text-amber-600 dark:text-amber-400")}>
                                                                            <span className="truncate block">
                                                                                {summary.loja_nome}
                                                                            </span>
                                                                            {summary.loja_cidade && (
                                                                                <span className="text-[10px] text-muted-foreground truncate block">
                                                                                    {summary.loja_cidade}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : summary?.loja_erp_id ? (
                                                                        <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400" title={summary.loja_erp_id}>
                                                                            {summary.loja_erp_id.substring(0, 8)}...
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-muted-foreground"> - </span>
                                                                    )}
                                                                </td>
                                                                {/* Data / Hora */}
                                                                <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">
                                                                    {summary?.data || ' - '}
                                                                </td>
                                                                {/* Turno */}
                                                                <td className="px-3 py-2.5 text-xs hidden md:table-cell">
                                                                    {summary?.turno ? (
                                                                        <span className="px-1.5 py-0.5 rounded bg-muted/50 border border-border/50 text-[10px]">
                                                                            {summary.turno}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-muted-foreground"> - </span>
                                                                    )}
                                                                </td>
                                                                {/* Qtd Itens */}
                                                                <td className="px-3 py-2.5 text-center text-xs hidden sm:table-cell">
                                                                    {summary?.itens != null ? (
                                                                        <span className="font-medium">{summary.itens}</span>
                                                                    ) : (
                                                                        <span className="text-muted-foreground"> - </span>
                                                                    )}
                                                                </td>
                                                                {/* Valor */}
                                                                <td className="px-3 py-2.5 text-right font-semibold text-xs">
                                                                    {summary?.valor || (summary?.valor_liquido != null ? formatCurrency(summary.valor_liquido) : ' - ')}
                                                                </td>
                                                                {/* Confiança */}
                                                                <td className="px-3 py-2.5 text-center">
                                                                    {(() => {
                                                                        const badge = getMatchBadge(item.validation, summary);
                                                                        return (
                                                                            <div>
                                                                                <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all", badge.bg, badge.border, badge.color)}>
                                                                                    <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", badge.dot)} />
                                                                                    {badge.text}
                                                                                </div>
                                                                                {statusInfo.expected && (
                                                                                    <div className={cn(
                                                                                        "mt-1 text-[10px] leading-tight",
                                                                                        statusInfo.statusMatch === true && "text-emerald-600 dark:text-emerald-400",
                                                                                        statusInfo.statusMatch === false && "text-red-600 dark:text-red-400",
                                                                                        statusInfo.statusMatch === null && "text-muted-foreground"
                                                                                    )}>
                                                                                        {statusInfo.statusMatch === true ? 'Status OK' : statusInfo.statusMatch === false ? 'Status Divergente' : 'Status Pendente'}
                                                                                        <span className="block font-mono">
                                                                                            ERP: {statusInfo.expected} | DB: {statusInfo.db ?? '—'}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                                {summary?.found_in_db && !item.validation.found && (
                                                                                    <div className="mt-1 text-[10px] leading-tight text-blue-600 dark:text-blue-400">
                                                                                        Registro localizado no banco
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </td>
                                                                {/* Ações */}
                                                                <td className="px-3 py-2.5 text-center">
                                                                    {showActions ? (
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            {canOpenDetails && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-7 w-7 text-muted-foreground hover:text-blue-600"
                                                                                    title="Detalhes da venda no banco"
                                                                                    onClick={() => openDetailsModal(item)}
                                                                                >
                                                                                    <Eye className="h-3.5 w-3.5" />
                                                                                </Button>
                                                                            )}
                                                                            {canOpenComparison && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-7 w-7 text-muted-foreground hover:text-violet-600"
                                                                                    title="Comparativo ERP vs Banco"
                                                                                    onClick={() => openComparisonModal(summary!.erp_id!)}
                                                                                >
                                                                                    <ArrowRightLeft className="h-3.5 w-3.5" />
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted-foreground/50"> - </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/*  Modal: Detalhes da Venda  */}
            <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-blue-500" />
                            Detalhes da Venda
                        </DialogTitle>
                        <DialogDescription>
                            Dados registrados no banco local
                        </DialogDescription>
                    </DialogHeader>
                    {detailsModalItem && (() => {
                        const db = detailsModalItem.validation.best_match?.db_details;
                        const venda = db?.venda;
                        const itens = db?.itens ?? [];
                        const pgtos = db?.pagamentos ?? [];
                        const smry = db?.summary;
                        const fiscal = venda?.fiscal;
                        return (
                            <ScrollArea className="flex-1 pr-4 -mr-4">
                                <div className="space-y-4 pb-2">
                                    {/* Store Info */}
                                    <div className="rounded-lg border p-3 bg-muted/10 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Store className="h-4 w-4 text-primary" />
                                            <span className="font-semibold text-sm">{venda?.store_name || ' - '}</span>
                                        </div>
                                        {venda?.store_city && (
                                            <p className="text-xs text-muted-foreground">
                                                Cidade: {venda.store_city}
                                            </p>
                                        )}
                                        {venda?.store_cnpj && (
                                            <p className="text-xs text-muted-foreground">
                                                CNPJ: {venda.store_cnpj}{venda.store_razao_social ? `  ·  ${venda.store_razao_social}` : ''}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            {venda?.canal && <span>Canal: <strong>{venda.canal}</strong></span>}
                                            {venda?.id_operacao && <span>Operação: <strong>{venda.id_operacao}</strong></span>}
                                            {venda?.turno_seq && <span>{venda.turno_seq}º Turno</span>}
                                            {venda?.data_hora && <span>{formatDateTime(venda.data_hora)}</span>}
                                        </div>
                                        {venda?.erp_operacao_uuid && (
                                            <p className="font-mono text-[10px] text-muted-foreground break-all">
                                                ERP UUID: {venda.erp_operacao_uuid}
                                            </p>
                                        )}
                                    </div>

                                    {/* Fiscal */}
                                    {fiscal?.nfce_chave && (
                                        <div className="rounded-lg border p-3 bg-muted/10">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium text-sm">NFC-e</span>
                                            </div>
                                            <p className="font-mono text-[10px] text-muted-foreground break-all">
                                                Chave: {fiscal.nfce_chave}
                                            </p>
                                            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                                {fiscal.nfce_numero && <span>Nº: <strong>{fiscal.nfce_numero}</strong></span>}
                                                {fiscal.nfce_serie && <span>Série: <strong>{fiscal.nfce_serie}</strong></span>}
                                                {fiscal.nfce_modelo && <span>Modelo: <strong>{fiscal.nfce_modelo}</strong></span>}
                                            </div>
                                        </div>
                                    )}

                                    {/* Items Table */}
                                    {itens.length > 0 && (
                                        <div className="rounded-lg border overflow-hidden">
                                            <div className="px-3 py-2 bg-muted/30 border-b flex items-center gap-2">
                                                <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="font-medium text-sm">Itens ({itens.length})</span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-muted/20 text-muted-foreground">
                                                            <th className="text-left px-3 py-1.5 font-medium">#</th>
                                                            <th className="text-left px-3 py-1.5 font-medium">Produto</th>
                                                            <th className="text-right px-3 py-1.5 font-medium">Qtd</th>
                                                            <th className="text-right px-3 py-1.5 font-medium">Unit.</th>
                                                            <th className="text-right px-3 py-1.5 font-medium">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {itens.map((it, i) => (
                                                            <tr key={i} className="border-b last:border-0">
                                                                <td className="px-3 py-2 text-muted-foreground">{it.line_no ?? i + 1}</td>
                                                                <td className="px-3 py-2">
                                                                    <div className="font-medium">{it.nome_produto || ' - '}</div>
                                                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground mt-0.5">
                                                                        {it.codigo_barras && (
                                                                            <span className="flex items-center gap-0.5">
                                                                                <Barcode className="h-2.5 w-2.5" />
                                                                                {it.codigo_barras}
                                                                            </span>
                                                                        )}
                                                                        {it.valor_original != null && it.desconto != null && it.desconto > 0 && (
                                                                            <span className="flex items-center gap-0.5">
                                                                                <Tag className="h-2.5 w-2.5" />
                                                                                De: {formatCurrency(it.valor_original)} (-{formatCurrency(it.desconto)})
                                                                            </span>
                                                                        )}
                                                                        {it.vendedor_nome && (
                                                                            <span className="flex items-center gap-0.5">
                                                                                <User className="h-2.5 w-2.5" />
                                                                                {it.vendedor_nome}{it.vendedor_user_id ? ` (ID ${it.vendedor_user_id})` : ''}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2 text-right font-mono">{it.qtd ?? ' - '}</td>
                                                                <td className="px-3 py-2 text-right font-mono">{it.preco_unit != null ? formatCurrency(it.preco_unit) : ' - '}</td>
                                                                <td className="px-3 py-2 text-right font-mono font-semibold">{it.total != null ? formatCurrency(it.total) : ' - '}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Payments Table */}
                                    {pgtos.length > 0 && (
                                        <div className="rounded-lg border overflow-hidden">
                                            <div className="px-3 py-2 bg-muted/30 border-b flex items-center gap-2">
                                                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="font-medium text-sm">Pagamentos ({pgtos.length})</span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-muted/20 text-muted-foreground">
                                                            <th className="text-left px-3 py-1.5 font-medium">#</th>
                                                            <th className="text-left px-3 py-1.5 font-medium">Meio</th>
                                                            <th className="text-right px-3 py-1.5 font-medium">Valor</th>
                                                            <th className="text-right px-3 py-1.5 font-medium">Troco</th>
                                                            <th className="text-right px-3 py-1.5 font-medium">Parcelas</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pgtos.map((p, i) => (
                                                            <tr key={i} className="border-b last:border-0">
                                                                <td className="px-3 py-2 text-muted-foreground">{p.line_no ?? i + 1}</td>
                                                                <td className="px-3 py-2 font-medium">{p.meio_pagamento || ' - '}</td>
                                                                <td className="px-3 py-2 text-right font-mono">{p.valor != null ? formatCurrency(p.valor) : ' - '}</td>
                                                                <td className="px-3 py-2 text-right font-mono">{p.troco != null ? formatCurrency(p.troco) : ' - '}</td>
                                                                <td className="px-3 py-2 text-right">{p.parcelas ?? ' - '}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Summary */}
                                    {smry && (
                                        <div className="rounded-lg border p-3 bg-muted/10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Receipt className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium text-sm">Resumo</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                {smry.itens && (
                                                    <div className="space-y-0.5">
                                                        <span className="text-muted-foreground">Itens</span>
                                                        <div>{smry.itens.qtd_linhas} linhas  ·  Total: <strong>{formatCurrency(smry.itens.valor_total ?? 0)}</strong></div>
                                                        {(smry.itens.desconto_total ?? 0) > 0 && <div className="text-amber-600">Desc: {formatCurrency(smry.itens.desconto_total ?? 0)}</div>}
                                                    </div>
                                                )}
                                                {smry.pagamentos && (
                                                    <div className="space-y-0.5">
                                                        <span className="text-muted-foreground">Pagamentos</span>
                                                        <div>{smry.pagamentos.qtd_linhas} linhas  ·  Total: <strong>{formatCurrency(smry.pagamentos.valor_total ?? 0)}</strong></div>
                                                        {(smry.pagamentos.troco_total ?? 0) > 0 && <div>Troco: {formatCurrency(smry.pagamentos.troco_total ?? 0)}</div>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        );
                    })()}
                    <DialogFooter className="mt-2 flex gap-2">
                        <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>Fechar</Button>
                        {detailsModalItem?.sale_summary?.erp_id && (
                            <Button
                                variant="default"
                                className="gap-1.5"
                                onClick={() => {
                                    setDetailsModalOpen(false);
                                    openComparisonModal(detailsModalItem.sale_summary!.erp_id!);
                                }}
                            >
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                                Ver Comparativo
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/*  Modal: Comparativo ERP vs DB  */}
            <Dialog open={comparisonModalOpen} onOpenChange={setComparisonModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowRightLeft className="h-5 w-5 text-violet-500" />
                            Comparativo ERP vs Banco Local
                        </DialogTitle>
                        <DialogDescription>
                            Comparação granular item a item
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                        {comparisonModalLoading && (
                            <div className="flex flex-col items-center justify-center py-16">
                                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                                <p className="text-sm text-muted-foreground">Buscando dados detalhados do ERP...</p>
                            </div>
                        )}
                        {!comparisonModalLoading && comparisonModalData && (
                            <div className="space-y-4 pb-2">
                                {comparisonModalData.comparison ? (
                                    <ComparisonView
                                        cmp={comparisonModalData.comparison}
                                        url={comparisonModalData.url}
                                        vendedor={comparisonModalData.comparison.vendedor}
                                    />
                                ) : (
                                    <div className="text-center py-8">
                                        {comparisonModalData.found ? (
                                            <p className="text-sm text-muted-foreground">Venda encontrada, mas sem dados de comparação disponíveis.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                <XCircle className="h-10 w-10 text-red-400 mx-auto" />
                                                <p className="text-sm font-medium">Venda não encontrada no banco</p>
                                                <p className="text-xs text-muted-foreground">{comparisonModalData.reason || 'Nenhum registro correspondente.'}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter className="mt-2">
                        <Button variant="outline" onClick={() => setComparisonModalOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SalesValidation;

