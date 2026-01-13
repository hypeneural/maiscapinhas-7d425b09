/**
 * Clientes Page
 * 
 * Customer list with search, filters, pagination, and CRUD actions.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Plus,
    Pencil,
    Trash2,
    Eye,
    Phone,
    Mail,
    MapPin,
    Smartphone,
    Calendar as CalendarIcon,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, ConfirmDialog, type Column, type RowAction } from '@/components/crud';
import { useCustomers, useDeleteCustomer } from '@/hooks/api/use-customers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Customer, CustomerFilters } from '@/types/customers.types';

const Clientes: React.FC = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);

    // Advanced filters
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
    const [hasDeviceFilter, setHasDeviceFilter] = useState<'all' | '1' | '0'>('all');

    // Build filters object
    const filters: CustomerFilters = {
        keyword: search || undefined,
        initial_date: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        final_date: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
        has_device: hasDeviceFilter !== 'all' ? Number(hasDeviceFilter) as 0 | 1 : undefined,
        page,
        per_page: 25,
    };

    const { data: customersData, isLoading } = useCustomers(filters);
    const deleteMutation = useDeleteCustomer();

    const columns: Column<Customer>[] = [
        {
            key: 'name',
            label: 'Cliente',
            render: (_, customer) => (
                <div className="space-y-1">
                    <p className="font-medium">{customer.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {customer.email && (
                            <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                            </span>
                        )}
                        {customer.phone && (
                            <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'city',
            label: 'Localização',
            render: (_, customer) => (
                customer.city ? (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {customer.city}
                        {customer.state && ` - ${customer.state}`}
                    </span>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )
            ),
        },
        {
            key: 'devices',
            label: 'Aparelhos',
            render: (_, customer) => (
                <div className="flex items-center gap-1">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">
                        {customer.devices?.length || 0}
                    </Badge>
                </div>
            ),
        },
    ];

    const getRowActions = (customer: Customer): RowAction<Customer>[] => [
        {
            label: 'Ver Detalhes',
            icon: <Eye className="h-4 w-4" />,
            onClick: (c) => navigate(`/clientes/${c.id}`),
        },
        {
            label: 'Editar',
            icon: <Pencil className="h-4 w-4" />,
            onClick: (c) => navigate(`/clientes/${c.id}/editar`),
        },
        {
            label: 'Excluir',
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (c) => setConfirmDelete(c),
            variant: 'destructive',
            separator: true,
        },
    ];

    const handleDelete = async () => {
        if (confirmDelete) {
            await deleteMutation.mutateAsync(confirmDelete.id);
            setConfirmDelete(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Clientes"
                description="Gerencie seus clientes e seus aparelhos"
                icon={Users}
            />

            {/* Filters Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Input */}
                    <Input
                        placeholder="Buscar por nome, email, telefone..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-[280px]"
                    />

                    {/* Has Device Filter */}
                    <Select
                        value={hasDeviceFilter}
                        onValueChange={(v) => {
                            setHasDeviceFilter(v as 'all' | '1' | '0');
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Aparelhos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="1">Com aparelho</SelectItem>
                            <SelectItem value="0">Sem aparelho</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Date Range Filter */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'w-[200px] justify-start text-left font-normal',
                                    !dateRange.from && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, 'dd/MM', { locale: ptBR })} - {format(dateRange.to, 'dd/MM', { locale: ptBR })}
                                        </>
                                    ) : (
                                        format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
                                    )
                                ) : (
                                    'Período de Cadastro'
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="range"
                                selected={dateRange as { from: Date; to: Date }}
                                onSelect={(range) => {
                                    setDateRange(range || {});
                                    setPage(1);
                                }}
                                locale={ptBR}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Clear Filters */}
                    {(dateRange.from || search || hasDeviceFilter !== 'all') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setDateRange({});
                                setSearch('');
                                setHasDeviceFilter('all');
                                setPage(1);
                            }}
                            className="h-9 px-3 gap-1 text-muted-foreground"
                        >
                            <X className="h-4 w-4" />
                            Limpar
                        </Button>
                    )}
                </div>

                <Button onClick={() => navigate('/clientes/novo')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Cliente
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Lista de Clientes
                    </CardTitle>
                    <CardDescription>
                        {customersData?.meta?.total || 0} clientes cadastrados
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={customersData?.data || []}
                        columns={columns}
                        loading={isLoading}
                        getRowKey={(c) => c.id}
                        pagination={customersData?.meta}
                        onPageChange={setPage}
                        actions={getRowActions}
                        emptyMessage="Nenhum cliente encontrado"
                        emptyIcon={<Users className="h-12 w-12 text-muted-foreground" />}
                    />
                </CardContent>
            </Card>

            <ConfirmDialog
                open={!!confirmDelete}
                onOpenChange={() => setConfirmDelete(null)}
                title="Excluir Cliente"
                description={
                    <p>
                        Tem certeza que deseja excluir <strong>{confirmDelete?.name}</strong>?
                        <br />
                        <span className="text-muted-foreground text-sm">
                            Esta ação não pode ser desfeita.
                        </span>
                    </p>
                }
                confirmText="Excluir"
                onConfirm={handleDelete}
                loading={deleteMutation.isPending}
                variant="destructive"
            />
        </div>
    );
};

export default Clientes;
