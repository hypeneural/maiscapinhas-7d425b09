/**
 * Validation Navigation
 * 
 * Shared tab-style navigation between Sales Validation & Closure Validation pages.
 */

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ShoppingBag, Wallet } from 'lucide-react';

const tabs = [
    { path: '/gestao/validacao-vendas', label: 'Validação de Vendas', icon: ShoppingBag },
    { path: '/gestao/validacao-fechamentos', label: 'Validação de Fechamentos', icon: Wallet },
];

export function ValidationNav() {
    const { pathname } = useLocation();

    return (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border w-fit">
            {tabs.map((tab) => {
                const active = pathname === tab.path;
                return (
                    <Link
                        key={tab.path}
                        to={tab.path}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                            active
                                ? "bg-background text-foreground shadow-sm border"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
