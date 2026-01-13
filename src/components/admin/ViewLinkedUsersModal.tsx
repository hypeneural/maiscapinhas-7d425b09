/**
 * ViewLinkedUsersModal
 * 
 * Modal to view all users linked to a store with their info and roles.
 */

import React from 'react';
import { Users, X, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import type { StoreUserBinding, StoreRole } from '@/types/admin.types';

// ============================================================
// Types
// ============================================================

interface ViewLinkedUsersModalProps {
    storeName: string;
    users: StoreUserBinding[];
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

export function ViewLinkedUsersModal({
    storeName,
    users,
    open,
    onOpenChange,
}: ViewLinkedUsersModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Usuários de {storeName}
                    </DialogTitle>
                    <DialogDescription>
                        {users.length} usuário(s) vinculado(s) a esta loja
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Cargo</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => {
                                const badge = ROLE_BADGES[user.role] || { label: user.role, className: 'bg-gray-100 text-gray-700' };
                                return (
                                    <TableRow key={user.user_id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatar_url || undefined} />
                                                    <AvatarFallback className="text-xs">
                                                        {user.user_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{user.user_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {user.user_email}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={badge.className}>
                                                {badge.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.user_active ? 'default' : 'secondary'}>
                                                {user.user_active ? 'Ativo' : 'Inativo'}
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

export default ViewLinkedUsersModal;
