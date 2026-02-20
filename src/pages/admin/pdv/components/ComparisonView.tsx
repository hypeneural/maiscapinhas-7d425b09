/**
 * ComparisonView — Renders the full comparison block from the validation API.
 * Shows 6 sections: Operação, Loja, Vendedor, Fiscal, Itens, Pagamentos + match_summary.
 */
import React, { useState } from 'react';
import {
    CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronRight,
    ExternalLink, MessageCircle, Store, User, FileText, ShoppingBag,
    CreditCard, Hash, Calendar, DollarSign,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ComparisonData {
    operacao?: { erp?: any; db?: any; match?: Record<string, boolean> };
    loja?: { erp?: any; db?: any; match?: boolean };
    vendedor?: { erp?: any; db?: any; match?: boolean };
    fiscal?: { erp?: any; db?: any; match?: boolean };
    itens?: Array<{ erp?: any; db?: any; match?: boolean }>;
    pagamentos?: Array<{ erp?: any; db?: any; match?: boolean }>;
    match_summary?: Record<string, boolean>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MatchIcon = ({ ok }: { ok?: boolean }) => ok
    ? <CheckCircle className="h-3.5 w-3.5 text-green-600" />
    : <XCircle className="h-3.5 w-3.5 text-red-500" />;

const MatchBadge = ({ ok, label }: { ok?: boolean; label: string }) => (
    <Badge variant="outline" className={cn(
        "text-[10px] h-5 gap-1 font-medium",
        ok ? "border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
            : "border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
    )}>
        <MatchIcon ok={ok} /> {label}: {ok ? '✓' : '✗'}
    </Badge>
);

const fmt = (v: any) => v === undefined || v === null || v === '' ? '—' : String(v);

const fmtCurrency = (v: any) => {
    if (v === undefined || v === null) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v));
};

const fmtDate = (v?: string) => {
    if (!v) return '—';
    try { return new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return v; }
};

const SideBySideRow = ({ label, erp, db, isDiff, icon }: {
    label: string; erp: string; db: string; isDiff?: boolean; icon?: React.ReactNode;
}) => (
    <div className={cn("grid grid-cols-[140px_1fr_1fr] gap-2 py-2 px-3 border-b border-dashed last:border-0 text-sm",
        isDiff ? "bg-red-50/50 dark:bg-red-900/10" : ""
    )}>
        <div className="font-medium text-muted-foreground flex items-center gap-1.5 text-xs">
            {icon}{label}
        </div>
        <div className="font-mono text-xs break-all">
            <span className="text-[9px] text-muted-foreground block">ERP</span>
            <span className={cn(isDiff && "text-red-600 font-bold")}>{erp}</span>
        </div>
        <div className="font-mono text-xs break-all">
            <span className="text-[9px] text-muted-foreground block">DB Local</span>
            <span className={cn(isDiff && "text-red-600 font-bold")}>{db}</span>
        </div>
    </div>
);

// ─── Collapsible Section ─────────────────────────────────────────────────────

const Section = ({ title, icon, match, defaultOpen = false, children }: {
    title: string; icon: React.ReactNode; match?: boolean; defaultOpen?: boolean; children: React.ReactNode;
}) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border rounded-lg overflow-hidden">
            <button onClick={() => setOpen(!open)} className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors",
                match === false ? "bg-red-50/30 dark:bg-red-900/5" : "bg-muted/10"
            )}>
                <div className="flex items-center gap-2">
                    {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    {icon}{title}
                </div>
                <MatchIcon ok={match} />
            </button>
            {open && <div className="border-t">{children}</div>}
        </div>
    );
};

// ─── Match Summary Bar ───────────────────────────────────────────────────────

const MatchSummaryBar = ({ summary }: { summary: Record<string, boolean> }) => {
    const labels: Record<string, string> = {
        operacao_uuid: 'UUID', total: 'Total', loja: 'Loja', vendedor: 'Vendedor',
        fiscal: 'Fiscal', all_itens: 'Itens', all_pagamentos: 'Pagamentos',
    };
    return (
        <div className="flex flex-wrap gap-1.5">
            {Object.entries(labels).map(([key, label]) => (
                summary[key] !== undefined ? <MatchBadge key={key} ok={summary[key]} label={label} /> : null
            ))}
            {summary.perfect !== undefined && (
                <Badge variant={summary.perfect ? "default" : "destructive"} className="text-[10px] h-5 ml-1">
                    {summary.perfect ? '✅ Match Perfeito' : '⚠️ Divergências'}
                </Badge>
            )}
        </div>
    );
};

// ─── Items Table ─────────────────────────────────────────────────────────────

const ItemsTable = ({ items }: { items: Array<{ erp?: any; db?: any; match?: boolean }> }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-xs">
            <thead>
                <tr className="border-b bg-muted/20">
                    <th className="px-2 py-1.5 text-left w-8">#</th>
                    <th className="px-2 py-1.5 text-left">Código</th>
                    <th className="px-2 py-1.5 text-left">Nome (ERP)</th>
                    <th className="px-2 py-1.5 text-left">Nome (DB)</th>
                    <th className="px-2 py-1.5 text-right">Qtd</th>
                    <th className="px-2 py-1.5 text-right">Total ERP</th>
                    <th className="px-2 py-1.5 text-right">Total DB</th>
                    <th className="px-2 py-1.5 text-center w-8">✓</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item, i) => (
                    <tr key={i} className={cn("border-b last:border-0",
                        item.match === false ? "bg-red-50/50 dark:bg-red-900/10" : ""
                    )}>
                        <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                        <td className="px-2 py-1.5 font-mono">{fmt(item.erp?.codigo ?? item.db?.codigo)}</td>
                        <td className="px-2 py-1.5">{item.erp ? fmt(item.erp.nome) : <span className="text-red-500 italic">Não existe no ERP</span>}</td>
                        <td className="px-2 py-1.5">{item.db ? fmt(item.db.nome) : <span className="text-red-500 italic">Não existe no DB</span>}</td>
                        <td className="px-2 py-1.5 text-right font-mono">
                            {fmt(item.erp?.qtd)}{item.erp?.qtd !== item.db?.qtd && item.db ? <span className="text-red-500"> / {fmt(item.db?.qtd)}</span> : ''}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono">{fmtCurrency(item.erp?.total)}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{fmtCurrency(item.db?.total)}</td>
                        <td className="px-2 py-1.5 text-center"><MatchIcon ok={item.match} /></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// ─── Payments Table ──────────────────────────────────────────────────────────

const PaymentsTable = ({ payments }: { payments: Array<{ erp?: any; db?: any; match?: boolean }> }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-xs">
            <thead>
                <tr className="border-b bg-muted/20">
                    <th className="px-2 py-1.5 text-left w-8">#</th>
                    <th className="px-2 py-1.5 text-left">Meio (ERP)</th>
                    <th className="px-2 py-1.5 text-left">Meio (DB)</th>
                    <th className="px-2 py-1.5 text-right">Valor ERP</th>
                    <th className="px-2 py-1.5 text-right">Valor DB</th>
                    <th className="px-2 py-1.5 text-right">Troco</th>
                    <th className="px-2 py-1.5 text-right">Parcelas</th>
                    <th className="px-2 py-1.5 text-center w-8">✓</th>
                </tr>
            </thead>
            <tbody>
                {payments.map((p, i) => (
                    <tr key={i} className={cn("border-b last:border-0",
                        p.match === false ? "bg-red-50/50 dark:bg-red-900/10" : ""
                    )}>
                        <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                        <td className="px-2 py-1.5">{p.erp ? fmt(p.erp.meio) : <span className="text-red-500 italic">—</span>}</td>
                        <td className="px-2 py-1.5">{p.db ? fmt(p.db.meio) : <span className="text-red-500 italic">—</span>}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{fmtCurrency(p.erp?.valor)}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{fmtCurrency(p.db?.valor)}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{fmtCurrency(p.erp?.troco ?? p.db?.troco)}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{fmt(p.erp?.parcela ?? p.erp?.parcelas ?? p.db?.parcelas)}</td>
                        <td className="px-2 py-1.5 text-center"><MatchIcon ok={p.match} /></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// ─── Main Comparison View ────────────────────────────────────────────────────

export const ComparisonView: React.FC<{
    comparison: ComparisonData;
    url?: string;
}> = ({ comparison, url }) => {
    const { operacao, loja, vendedor, fiscal, itens, pagamentos, match_summary } = comparison;

    const opMatch = operacao?.match;
    const allOpMatch = opMatch ? Object.values(opMatch).every(Boolean) : undefined;

    return (
        <div className="space-y-3">
            {/* Match Summary */}
            {match_summary && (
                <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-lg bg-muted/20 border">
                    <span className="text-xs font-medium text-muted-foreground">Resumo do Match:</span>
                    <MatchSummaryBar summary={match_summary} />
                </div>
            )}

            {/* ERP Link */}
            {url && (
                <a href={url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> Ver no Hiper ERP
                </a>
            )}

            {/* Section 1: Operação */}
            {operacao && (
                <Section title="Operação" icon={<Hash className="h-3.5 w-3.5 text-purple-500" />} match={allOpMatch} defaultOpen>
                    <SideBySideRow label="UUID" erp={fmt(operacao.erp?.uuid)} db={fmt(operacao.db?.uuid)}
                        isDiff={opMatch?.uuid === false} icon={<Hash className="h-3 w-3" />} />
                    <SideBySideRow label="Código" erp={fmt(operacao.erp?.codigo)} db={fmt(operacao.db?.id_operacao)} />
                    <SideBySideRow label="Total" erp={fmtCurrency(operacao.erp?.total)} db={fmtCurrency(operacao.db?.total)}
                        isDiff={opMatch?.total === false} icon={<DollarSign className="h-3 w-3" />} />
                    <SideBySideRow label="Data" erp={fmtDate(operacao.erp?.data)} db={fmtDate(operacao.db?.data)}
                        icon={<Calendar className="h-3 w-3" />} />
                    <SideBySideRow label="Tipo / Canal" erp={fmt(operacao.erp?.tipo)} db={fmt(operacao.db?.canal)} />
                    <SideBySideRow label="Status" erp={operacao.erp?.cancelada ? 'Cancelada' : operacao.erp?.concluida ? 'Concluída' : '—'}
                        db={fmt(operacao.db?.status)} />
                </Section>
            )}

            {/* Section 2: Loja */}
            {loja && (
                <Section title="Loja" icon={<Store className="h-3.5 w-3.5 text-blue-500" />} match={loja.match}>
                    <SideBySideRow label="UUID" erp={fmt(loja.erp?.uuid)} db={fmt(loja.db?.uuid)} icon={<Hash className="h-3 w-3" />} />
                    <SideBySideRow label="Nome" erp={fmt(loja.erp?.nome)} db={fmt(loja.db?.nome)} icon={<Store className="h-3 w-3" />} />
                    {loja.db?.store_id && <SideBySideRow label="Store ID" erp="—" db={fmt(loja.db.store_id)} />}
                </Section>
            )}

            {/* Section 3: Vendedor */}
            {vendedor && (
                <Section title="Vendedor" icon={<User className="h-3.5 w-3.5 text-emerald-500" />} match={vendedor.match}>
                    <SideBySideRow label="GUID" erp={fmt(vendedor.erp?.guid)} db={fmt(vendedor.db?.guid)} icon={<Hash className="h-3 w-3" />} />
                    <SideBySideRow label="Nome" erp={fmt(vendedor.erp?.nome_no_item ?? vendedor.erp?.nome)} db={fmt(vendedor.db?.nome)}
                        icon={<User className="h-3 w-3" />} />
                    {vendedor.db?.login && <SideBySideRow label="Login" erp="—" db={fmt(vendedor.db.login)} />}
                    {vendedor.db?.whatsapp && (
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-dashed">
                            <span className="text-xs text-muted-foreground w-[140px] flex items-center gap-1.5">
                                <MessageCircle className="h-3 w-3" /> WhatsApp
                            </span>
                            <a href={`https://wa.me/55${vendedor.db.whatsapp}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:underline font-medium">
                                <MessageCircle className="h-3 w-3" /> {vendedor.db.whatsapp}
                            </a>
                        </div>
                    )}
                </Section>
            )}

            {/* Section 4: Fiscal */}
            {fiscal && (
                <Section title="Fiscal (NFC-e)" icon={<FileText className="h-3.5 w-3.5 text-orange-500" />} match={fiscal.match}>
                    <SideBySideRow label="Chave" erp={fmt(fiscal.erp?.chave)} db={fmt(fiscal.db?.chave)} />
                    <SideBySideRow label="Número" erp={fmt(fiscal.erp?.numero)} db={fmt(fiscal.db?.numero)} />
                    <SideBySideRow label="Série" erp={fmt(fiscal.erp?.serie)} db={fmt(fiscal.db?.serie)} />
                    <SideBySideRow label="Modelo" erp={fmt(fiscal.erp?.modelo)} db={fmt(fiscal.db?.modelo)} />
                </Section>
            )}

            {/* Section 5: Itens */}
            {itens && itens.length > 0 && (
                <Section title={`Itens (${itens.length})`} icon={<ShoppingBag className="h-3.5 w-3.5 text-pink-500" />}
                    match={itens.every(i => i.match)} defaultOpen={!itens.every(i => i.match)}>
                    <ItemsTable items={itens} />
                </Section>
            )}

            {/* Section 6: Pagamentos */}
            {pagamentos && pagamentos.length > 0 && (
                <Section title={`Pagamentos (${pagamentos.length})`} icon={<CreditCard className="h-3.5 w-3.5 text-indigo-500" />}
                    match={pagamentos.every(p => p.match)} defaultOpen={!pagamentos.every(p => p.match)}>
                    <PaymentsTable payments={pagamentos} />
                </Section>
            )}
        </div>
    );
};

export default ComparisonView;
