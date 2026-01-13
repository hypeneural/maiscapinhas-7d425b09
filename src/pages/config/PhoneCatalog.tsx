/**
 * Phone Catalog Page (Admin Only)
 * 
 * Manage phone brands and models in a tabbed interface.
 */

import React, { useState } from 'react';
import {
    Smartphone,
    Plus,
    Pencil,
    Trash2,
    Building2,
    Phone,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, ConfirmDialog, type Column, type RowAction } from '@/components/crud';
import {
    usePhoneBrands,
    usePhoneModels,
    useCreateBrand,
    useUpdateBrand,
    useDeleteBrand,
    useCreateModel,
    useUpdateModel,
    useDeleteModel,
} from '@/hooks/api/use-phone-catalog';
import type { PhoneBrand, PhoneModel } from '@/types/customers.types';

// ============================================================
// Brand Form Modal
// ============================================================

interface BrandFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    brand?: PhoneBrand | null;
}

const BrandFormModal: React.FC<BrandFormModalProps> = ({ open, onOpenChange, brand }) => {
    const [name, setName] = useState(brand?.brand_name || '');
    const isEditing = !!brand;

    const createMutation = useCreateBrand();
    const updateMutation = useUpdateBrand();

    React.useEffect(() => {
        if (open) {
            setName(brand?.brand_name || '');
        }
    }, [open, brand]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (isEditing && brand) {
            await updateMutation.mutateAsync({ id: brand.id, data: { brand_name: name } });
        } else {
            await createMutation.mutateAsync({ brand_name: name });
        }
        onOpenChange(false);
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Marca' : 'Nova Marca'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Atualize o nome da marca' : 'Cadastre uma nova marca de celular'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="brand_name">Nome da Marca</Label>
                            <Input
                                id="brand_name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Apple, Samsung, Motorola"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !name.trim()}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Salvar' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

// ============================================================
// Model Form Modal
// ============================================================

interface ModelFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    model?: PhoneModel | null;
    brands: PhoneBrand[];
}

const ModelFormModal: React.FC<ModelFormModalProps> = ({ open, onOpenChange, model, brands }) => {
    const [form, setForm] = useState({
        marketing_name: model?.marketing_name || '',
        brand_id: model?.brand_id?.toString() || '',
        release_year: model?.release_year?.toString() || '',
    });
    const isEditing = !!model;

    const createMutation = useCreateModel();
    const updateMutation = useUpdateModel();

    React.useEffect(() => {
        if (open) {
            setForm({
                marketing_name: model?.marketing_name || '',
                brand_id: model?.brand_id?.toString() || '',
                release_year: model?.release_year?.toString() || '',
            });
        }
    }, [open, model]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.marketing_name.trim() || !form.brand_id) return;

        const data = {
            marketing_name: form.marketing_name,
            brand_id: parseInt(form.brand_id, 10),
            release_year: form.release_year ? parseInt(form.release_year, 10) : undefined,
        };

        if (isEditing && model) {
            await updateMutation.mutateAsync({ id: model.id, data });
        } else {
            await createMutation.mutateAsync(data);
        }
        onOpenChange(false);
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Modelo' : 'Novo Modelo'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Atualize as informações do modelo' : 'Cadastre um novo modelo de celular'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="brand_id">Marca *</Label>
                            <Select
                                value={form.brand_id}
                                onValueChange={(v) => setForm({ ...form, brand_id: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a marca" />
                                </SelectTrigger>
                                <SelectContent>
                                    {brands.map((brand) => (
                                        <SelectItem key={brand.id} value={brand.id.toString()}>
                                            {brand.brand_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="marketing_name">Nome do Modelo *</Label>
                            <Input
                                id="marketing_name"
                                value={form.marketing_name}
                                onChange={(e) => setForm({ ...form, marketing_name: e.target.value })}
                                placeholder="Ex: iPhone 15 Pro Max"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="release_year">Ano de Lançamento</Label>
                            <Input
                                id="release_year"
                                type="number"
                                min={2000}
                                max={2030}
                                value={form.release_year}
                                onChange={(e) => setForm({ ...form, release_year: e.target.value })}
                                placeholder="2024"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !form.marketing_name.trim() || !form.brand_id}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Salvar' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

// ============================================================
// Main Component
// ============================================================

const PhoneCatalog: React.FC = () => {
    const [activeTab, setActiveTab] = useState('brands');
    const [brandPage, setBrandPage] = useState(1);
    const [modelPage, setModelPage] = useState(1);
    const [modelBrandFilter, setModelBrandFilter] = useState<number | null>(null);

    // Modals
    const [brandFormOpen, setBrandFormOpen] = useState(false);
    const [modelFormOpen, setModelFormOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<PhoneBrand | null>(null);
    const [editingModel, setEditingModel] = useState<PhoneModel | null>(null);
    const [confirmDeleteBrand, setConfirmDeleteBrand] = useState<PhoneBrand | null>(null);
    const [confirmDeleteModel, setConfirmDeleteModel] = useState<PhoneModel | null>(null);

    // Data
    const { data: brandsData, isLoading: isLoadingBrands } = usePhoneBrands({
        page: brandPage,
        per_page: 25,
    });
    const { data: modelsData, isLoading: isLoadingModels } = usePhoneModels({
        brand_id: modelBrandFilter || undefined,
        page: modelPage,
        per_page: 25,
    });

    const deleteBrandMutation = useDeleteBrand();
    const deleteModelMutation = useDeleteModel();

    const brands = brandsData?.data || [];
    const models = modelsData?.data || [];

    // Brand columns
    const brandColumns: Column<PhoneBrand>[] = [
        {
            key: 'brand_name',
            label: 'Nome da Marca',
            render: (_, brand) => (
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{brand.brand_name}</span>
                </div>
            ),
        },
        {
            key: 'phones_count',
            label: 'Modelos',
            render: (_, brand) => (
                <Badge variant="secondary">{brand.models_count || 0} modelos</Badge>
            ),
        },
    ];

    const getBrandActions = (brand: PhoneBrand): RowAction<PhoneBrand>[] => [
        {
            label: 'Editar',
            icon: <Pencil className="h-4 w-4" />,
            onClick: (b) => {
                setEditingBrand(b);
                setBrandFormOpen(true);
            },
        },
        {
            label: 'Excluir',
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (b) => setConfirmDeleteBrand(b),
            variant: 'destructive',
            separator: true,
        },
    ];

    // Model columns
    const modelColumns: Column<PhoneModel>[] = [
        {
            key: 'marketing_name',
            label: 'Modelo',
            render: (_, model) => (
                <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <span className="font-medium">{model.marketing_name}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'brand',
            label: 'Marca',
            render: (_, model) => (
                <Badge variant="outline">{model.brand?.brand_name || 'Sem marca'}</Badge>
            ),
        },
        {
            key: 'release_year',
            label: 'Ano',
            render: (_, model) => (
                <span className="text-muted-foreground">{model.release_year || '-'}</span>
            ),
        },
    ];

    const getModelActions = (model: PhoneModel): RowAction<PhoneModel>[] => [
        {
            label: 'Editar',
            icon: <Pencil className="h-4 w-4" />,
            onClick: (m) => {
                setEditingModel(m);
                setModelFormOpen(true);
            },
        },
        {
            label: 'Excluir',
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (m) => setConfirmDeleteModel(m),
            variant: 'destructive',
            separator: true,
        },
    ];

    const handleDeleteBrand = async () => {
        if (confirmDeleteBrand) {
            await deleteBrandMutation.mutateAsync(confirmDeleteBrand.id);
            setConfirmDeleteBrand(null);
        }
    };

    const handleDeleteModel = async () => {
        if (confirmDeleteModel) {
            await deleteModelMutation.mutateAsync(confirmDeleteModel.id);
            setConfirmDeleteModel(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Catálogo de Aparelhos"
                description="Gerencie as marcas e modelos de celulares disponíveis"
                icon={Smartphone}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="brands" className="gap-2">
                        <Building2 className="h-4 w-4" />
                        Marcas
                    </TabsTrigger>
                    <TabsTrigger value="models" className="gap-2">
                        <Phone className="h-4 w-4" />
                        Modelos
                    </TabsTrigger>
                </TabsList>

                {/* Brands Tab */}
                <TabsContent value="brands" className="space-y-4">
                    <div className="flex justify-end">
                        <Button
                            onClick={() => {
                                setEditingBrand(null);
                                setBrandFormOpen(true);
                            }}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Nova Marca
                        </Button>
                    </div>

                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                Marcas de Celular
                            </CardTitle>
                            <CardDescription>
                                {brandsData?.meta?.total || 0} marcas cadastradas
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                data={brands}
                                columns={brandColumns}
                                loading={isLoadingBrands}
                                getRowKey={(b) => b.id}
                                pagination={brandsData?.meta}
                                onPageChange={setBrandPage}
                                actions={getBrandActions}
                                emptyMessage="Nenhuma marca cadastrada"
                                emptyIcon={<Building2 className="h-12 w-12 text-muted-foreground" />}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Models Tab */}
                <TabsContent value="models" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Select
                            value={modelBrandFilter?.toString() || 'all'}
                            onValueChange={(v) =>
                                setModelBrandFilter(v === 'all' ? null : parseInt(v, 10))
                            }
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filtrar por marca" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as marcas</SelectItem>
                                {brands.map((brand) => (
                                    <SelectItem key={brand.id} value={brand.id.toString()}>
                                        {brand.brand_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={() => {
                                setEditingModel(null);
                                setModelFormOpen(true);
                            }}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Novo Modelo
                        </Button>
                    </div>

                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="h-5 w-5 text-primary" />
                                Modelos de Celular
                            </CardTitle>
                            <CardDescription>
                                {modelsData?.meta?.total || 0} modelos cadastrados
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                data={models}
                                columns={modelColumns}
                                loading={isLoadingModels}
                                getRowKey={(m) => m.id}
                                pagination={modelsData?.meta}
                                onPageChange={setModelPage}
                                actions={getModelActions}
                                emptyMessage="Nenhum modelo cadastrado"
                                emptyIcon={<Phone className="h-12 w-12 text-muted-foreground" />}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Brand Form Modal */}
            <BrandFormModal
                open={brandFormOpen}
                onOpenChange={(open) => {
                    setBrandFormOpen(open);
                    if (!open) setEditingBrand(null);
                }}
                brand={editingBrand}
            />

            {/* Model Form Modal */}
            <ModelFormModal
                open={modelFormOpen}
                onOpenChange={(open) => {
                    setModelFormOpen(open);
                    if (!open) setEditingModel(null);
                }}
                model={editingModel}
                brands={brands}
            />

            {/* Delete Brand Confirmation */}
            <ConfirmDialog
                open={!!confirmDeleteBrand}
                onOpenChange={() => setConfirmDeleteBrand(null)}
                title="Excluir Marca"
                description={
                    <p>
                        Tem certeza que deseja excluir a marca{' '}
                        <strong>{confirmDeleteBrand?.brand_name}</strong>?
                        {confirmDeleteBrand?.models_count && confirmDeleteBrand.models_count > 0 && (
                            <span className="block mt-2 text-amber-600">
                                ⚠️ Esta marca possui {confirmDeleteBrand.models_count} modelos
                                vinculados.
                            </span>
                        )}
                    </p>
                }
                confirmText="Excluir"
                onConfirm={handleDeleteBrand}
                loading={deleteBrandMutation.isPending}
                variant="destructive"
            />

            {/* Delete Model Confirmation */}
            <ConfirmDialog
                open={!!confirmDeleteModel}
                onOpenChange={() => setConfirmDeleteModel(null)}
                title="Excluir Modelo"
                description={
                    <p>
                        Tem certeza que deseja excluir o modelo{' '}
                        <strong>{confirmDeleteModel?.marketing_name}</strong>?
                    </p>
                }
                confirmText="Excluir"
                onConfirm={handleDeleteModel}
                loading={deleteModelMutation.isPending}
                variant="destructive"
            />
        </div>
    );
};

export default PhoneCatalog;
