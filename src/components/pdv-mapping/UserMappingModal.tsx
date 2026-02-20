import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, Check, Loader2, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserSearchResult {
    id: number;
    name: string;
    email: string;
    active: boolean;
    role: string;
    avatar_url?: string;
}

interface UserMappingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectUser: (user: UserSearchResult) => void;
    title?: string;
    description?: string;
    isLoading?: boolean;
    initialSearch?: string;
}

export const UserMappingModal: React.FC<UserMappingModalProps> = ({
    open,
    onOpenChange,
    onSelectUser,
    title = "Vincular Usuário",
    description = "Busque um usuário do ERP para vincular a esta identidade do PDV.",
    isLoading = false,
    initialSearch = ''
}) => {
    const [search, setSearch] = useState(initialSearch);

    // Reset search when modal opens with new initialSearch or when closed
    React.useEffect(() => {
        if (open) {
            setSearch(initialSearch);
        } else {
            setSearch('');
        }
    }, [open, initialSearch]);

    const debouncedSearch = useDebounce(search, 300);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const { data: users, isLoading: isSearching } = useQuery({
        queryKey: ['users-search', debouncedSearch],
        queryFn: async () => {
            if (!debouncedSearch || debouncedSearch.length < 2) return [];
            // Assuming we have a user search endpoint. If not, we might need adjustments.
            // Using a hypothetical endpoint for now based on typical patterns.
            const response = await apiGet<ApiResponse<UserSearchResult[]>>(`/admin/users/search?q=${debouncedSearch}`);
            return response.data;
        },
        enabled: debouncedSearch.length >= 2,
    });

    const handleSelect = (user: UserSearchResult) => {
        onSelectUser(user);
        onOpenChange(false);
        setSearch('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome ou email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <ScrollArea className="h-[300px] border rounded-md p-2">
                        {isSearching ? (
                            <div className="flex justify-center items-center h-full text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                Buscando...
                            </div>
                        ) : users && users.length > 0 ? (
                            <div className="space-y-1">
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                                        onClick={() => handleSelect(user)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={user.avatar_url} />
                                                <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm leading-none">{user.name}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                            {user.role}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : debouncedSearch.length >= 2 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                <p>Nenhum usuário encontrado.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open('/config/usuarios/novo', '_blank')}
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Criar Novo Usuário
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <Search className="h-8 w-8 mb-2 opacity-50" />
                                <p>Digite para buscar...</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
