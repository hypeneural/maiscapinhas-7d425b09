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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, ConfirmDialog, type Column, type RowAction } from '@/components/crud';
import { useCustomers, useDeleteCustomer } from '@/hooks/api/use-customers';
import type { Customer, CustomerFilters } from '@/types/customers.types';

const Clientes: React.FC = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);

    const filters: CustomerFilters = {
        name: search || undefined,
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

            <div className="flex justify-between items-center">
                <div />
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
                        onSearch={setSearch}
                        searchPlaceholder="Buscar por nome, email ou telefone..."
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
