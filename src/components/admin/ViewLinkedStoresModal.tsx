/**
 * ViewLinkedStoresModal
 * 
 * Modal to view all stores linked to a user with their info and roles.
 */

import React from 'react';
import { Store, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { UserStoreBinding, StoreRole } from '@/types/admin.types';

// ============================================================
// Types
// ============================================================

interface ViewLinkedStoresModalProps {
    userName: string;
    stores: UserStoreBinding[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// ============================================================
// Constants
// ============================================================

const ROLE_BADGES: Record<StoreRole, { label: string; className: string }> = {
    admin: { label: 'Administrador', className: 'bg-red-100 text-red-700 border-red-200' },
    gerente: { label: 'Gerente', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    conferente: { label: 'Conferente', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    vendedor: { label: 'Vendedor', className: 'bg-green-100 text-green-700 border-green-200' },
    fabrica: { label: 'Fábrica', className: 'bg-purple-100 text-purple-700 border-purple-200' },
};

// ============================================================
// Component
// ============================================================

export function ViewLinkedStoresModal({
    userName,
    stores,
    open,
    onOpenChange,
}: ViewLinkedStoresModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-primary" />
                        Lojas de {userName}
                    </DialogTitle>
                    <DialogDescription>
                        {stores.length} loja(s) vinculada(s) a este usuário
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Loja</TableHead>
                                <TableHead>Cidade</TableHead>
                                <TableHead>Cargo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stores.map((store) => {
                                const badge = ROLE_BADGES[store.role] || { label: store.role, className: 'bg-gray-100 text-gray-700' };
                                return (
                                    <TableRow key={store.store_id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-md bg-primary/10">
                                                    <Store className="h-4 w-4 text-primary" />
                                                </div>
                                                <span className="font-medium">{store.store_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                {store.store_city || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={badge.className}>
                                                {badge.label}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Fechar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ViewLinkedStoresModal;
