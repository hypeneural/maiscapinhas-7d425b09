/**
 * Mobile Sidebar Component
 * 
 * Sidebar navigation for mobile devices, used inside Sheet drawer.
 */

import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useFilteredMenu } from '@/hooks/useFilteredMenu';
import { usePermissions } from '@/hooks/usePermissions';
import { ROLE_LABELS } from '@/lib/permissions';
import { LogOut, Store, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import type { MenuItem } from '@/lib/config/menuConfig';

interface MobileSidebarProps {
    onNavigate?: () => void;
}

const MobileNavItem: React.FC<{
    item: MenuItem;
    depth?: number;
    onNavigate?: () => void;
}> = ({ item, depth = 0, onNavigate }) => {
    const location = useLocation();
    const isActive = location.pathname === item.path ||
        (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
    const Icon = item.icon;

    return (
        <NavLink
            to={item.path}
            onClick={onNavigate}
            className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                depth > 0 ? 'ml-4 text-sm' : '',
                isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground/80 hover:bg-muted active:bg-muted'
            )}
        >
            <Icon className={cn('w-5 h-5 shrink-0', isActive && 'text-primary')} />
            <span className="truncate">{item.label}</span>
            {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
            )}
        </NavLink>
    );
};

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ onNavigate }) => {
    const { user, logout } = useAuth();
    const { menu, isLoading } = useFilteredMenu();
    const { currentStore, currentRole } = usePermissions();
    const [expandedSections, setExpandedSections] = React.useState<string[]>([]);
    const [profileModalOpen, setProfileModalOpen] = useState(false);

    // Auto-expand sections that contain the current path
    const location = useLocation();
    React.useEffect(() => {
        const currentSection = menu.find((section) =>
            section.items.some(
                (item) =>
                    location.pathname === item.path ||
                    location.pathname.startsWith(item.path + '/')
            )
        );
        if (currentSection && !expandedSections.includes(currentSection.id)) {
            setExpandedSections((prev) => [...prev, currentSection.id]);
        }
    }, [location.pathname, menu]);

    const toggleSection = (sectionId: string) => {
        setExpandedSections((prev) =>
            prev.includes(sectionId)
                ? prev.filter((id) => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    const handleLogout = () => {
        onNavigate?.();
        logout();
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Logo */}
            <div className="flex items-center gap-3 p-4 border-b">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                    <Store className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                    <span className="font-display font-bold text-lg">Mais Capinhas</span>
                    {currentStore && (
                        <p className="text-xs text-muted-foreground truncate">
                            {currentStore.name}
                        </p>
                    )}
                </div>
            </div>

            {/* User info */}
            {user && (
                <div className="flex items-center gap-3 px-4 py-3 border-b">
                    <Avatar
                        className="h-10 w-10 cursor-pointer ring-2 ring-transparent hover:ring-primary/50 transition-all"
                        onClick={() => setProfileModalOpen(true)}
                    >
                        {user.avatar_url ? (
                            <AvatarImage src={user.avatar_url} alt={user.name || 'Avatar'} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name || 'Usuário'}</p>
                        {currentRole && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                {ROLE_LABELS[currentRole]}
                            </Badge>
                        )}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    menu.map((section) => {
                        const isExpanded = expandedSections.includes(section.id);
                        const hasMultipleItems = section.items.length > 1;

                        // For sections with single item, render directly
                        if (!hasMultipleItems) {
                            return (
                                <div key={section.id}>
                                    {section.items.map((item) => (
                                        <MobileNavItem
                                            key={item.id}
                                            item={item}
                                            onNavigate={onNavigate}
                                        />
                                    ))}
                                </div>
                            );
                        }

                        // For sections with multiple items, render collapsible
                        return (
                            <div key={section.id} className="space-y-1">
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                                        'text-foreground/80 hover:bg-muted active:bg-muted'
                                    )}
                                >
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-1 text-left">
                                        {section.title}
                                    </span>
                                    <ChevronRight
                                        className={cn(
                                            'w-4 h-4 transition-transform text-muted-foreground',
                                            isExpanded && 'rotate-90'
                                        )}
                                    />
                                </button>
                                {isExpanded && (
                                    <div className="space-y-1">
                                        {section.items.map((item) => (
                                            <MobileNavItem
                                                key={item.id}
                                                item={item}
                                                depth={1}
                                                onNavigate={onNavigate}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </nav>

            <Separator />

            {/* Logout */}
            <div className="p-4">
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sair
                </Button>
            </div>

            {/* Profile Edit Modal */}
            <ProfileEditModal
                open={profileModalOpen}
                onOpenChange={setProfileModalOpen}
            />
        </div>
    );
};

export default MobileSidebar;
