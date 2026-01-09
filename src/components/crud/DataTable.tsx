/**
 * DataTable Component
 * 
 * A reusable table component with pagination, search, sorting, and row actions.
 * Designed for CRUD operations in admin pages.
 */

import React, { useState, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MoreVertical, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

export interface Column<T> {
    /** Unique key for the column */
    key: string;
    /** Display label for the header */
    label: string;
    /** Custom render function */
    render?: (value: unknown, row: T, index: number) => React.ReactNode;
    /** Whether the column is sortable */
    sortable?: boolean;
    /** CSS class for the cell */
    className?: string;
    /** CSS class for the header */
    headerClassName?: string;
}

export interface RowAction<T> {
    /** Action label */
    label: string;
    /** Icon component (optional) */
    icon?: React.ReactNode;
    /** Action handler */
    onClick: (row: T) => void;
    /** Whether to show separator before this action */
    separator?: boolean;
    /** Variant for styling */
    variant?: 'default' | 'destructive';
    /** Whether the action is disabled */
    disabled?: (row: T) => boolean;
    /** Whether to hide this action */
    hidden?: (row: T) => boolean;
}

export interface PaginationMeta {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

export interface DataTableProps<T> {
    /** Array of data to display */
    data: T[];
    /** Column definitions */
    columns: Column<T>[];
    /** Loading state */
    loading?: boolean;
    /** Pagination meta from API */
    pagination?: PaginationMeta;
    /** Search placeholder */
    searchPlaceholder?: string;
    /** Callback when search changes (debounced internally) */
    onSearch?: (query: string) => void;
    /** Callback when page changes */
    onPageChange?: (page: number) => void;
    /** Row actions dropdown */
    actions?: RowAction<T>[] | ((row: T) => RowAction<T>[]);
    /** Unique key extractor for rows */
    getRowKey: (row: T) => string | number;
    /** Empty state message */
    emptyMessage?: string;
    /** Empty state icon */
    emptyIcon?: React.ReactNode;
    /** Additional class for the container */
    className?: string;
}

// ============================================================
// Component
// ============================================================

export function DataTable<T>({
    data,
    columns,
    loading = false,
    pagination,
    searchPlaceholder = 'Buscar...',
    onSearch,
    onPageChange,
    actions,
    getRowKey,
    emptyMessage = 'Nenhum item encontrado',
    emptyIcon,
    className,
}: DataTableProps<T>) {
    const [searchValue, setSearchValue] = useState('');
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    // Debounced search
    const handleSearchChange = useCallback((value: string) => {
        setSearchValue(value);

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeout = setTimeout(() => {
            onSearch?.(value);
        }, 300);

        setSearchTimeout(timeout);
    }, [onSearch, searchTimeout]);

    // Get value from nested path (e.g., "user.name")
    const getValue = (row: T, key: string): unknown => {
        return key.split('.').reduce((obj, k) => {
            if (obj && typeof obj === 'object' && k in obj) {
                return (obj as Record<string, unknown>)[k];
            }
            return undefined;
        }, row as unknown);
    };

    // Render cell content
    const renderCell = (column: Column<T>, row: T, index: number) => {
        const value = getValue(row, column.key);

        if (column.render) {
            return column.render(value, row, index);
        }

        if (value === null || value === undefined) {
            return <span className="text-muted-foreground">-</span>;
        }

        if (typeof value === 'boolean') {
            return value ? 'Sim' : 'Não';
        }

        return String(value);
    };

    // Get actions for a row
    const getRowActions = (row: T): RowAction<T>[] => {
        if (!actions) return [];
        if (typeof actions === 'function') return actions(row);
        return actions;
    };

    // Loading skeleton
    if (loading && data.length === 0) {
        return (
            <div className={cn('space-y-4', className)}>
                {onSearch && (
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                )}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map((col) => (
                                    <TableHead key={col.key}>
                                        <Skeleton className="h-4 w-20" />
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    {columns.map((col) => (
                                        <TableCell key={col.key}>
                                            <Skeleton className="h-4 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Search */}
            {onSearch && (
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead
                                    key={column.key}
                                    className={cn(column.headerClassName)}
                                >
                                    {column.label}
                                </TableHead>
                            ))}
                            {actions && <TableHead className="w-[50px]" />}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (actions ? 1 : 0)}
                                    className="h-32 text-center"
                                >
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        {emptyIcon}
                                        <span>{emptyMessage}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, index) => {
                                const rowActions = getRowActions(row);
                                const visibleActions = rowActions.filter(
                                    (action) => !action.hidden?.(row)
                                );

                                return (
                                    <TableRow key={getRowKey(row)}>
                                        {columns.map((column) => (
                                            <TableCell
                                                key={column.key}
                                                className={cn(column.className)}
                                            >
                                                {renderCell(column, row, index)}
                                            </TableCell>
                                        ))}
                                        {actions && (
                                            <TableCell>
                                                {visibleActions.length > 0 && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {visibleActions.map((action, actionIndex) => (
                                                                <React.Fragment key={action.label}>
                                                                    {action.separator && actionIndex > 0 && (
                                                                        <DropdownMenuSeparator />
                                                                    )}
                                                                    <DropdownMenuItem
                                                                        onClick={() => action.onClick(row)}
                                                                        disabled={action.disabled?.(row)}
                                                                        className={cn(
                                                                            action.variant === 'destructive' &&
                                                                            'text-destructive focus:text-destructive'
                                                                        )}
                                                                    >
                                                                        {action.icon && (
                                                                            <span className="mr-2">{action.icon}</span>
                                                                        )}
                                                                        {action.label}
                                                                    </DropdownMenuItem>
                                                                </React.Fragment>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-muted-foreground">
                        Mostrando {((pagination.current_page - 1) * pagination.per_page) + 1} a{' '}
                        {Math.min(pagination.current_page * pagination.per_page, pagination.total)} de{' '}
                        {pagination.total} itens
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pagination.current_page === 1}
                            onClick={() => onPageChange?.(1)}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pagination.current_page === 1}
                            onClick={() => onPageChange?.(pagination.current_page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="px-3 text-sm">
                            Página {pagination.current_page} de {pagination.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pagination.current_page === pagination.last_page}
                            onClick={() => onPageChange?.(pagination.current_page + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pagination.current_page === pagination.last_page}
                            onClick={() => onPageChange?.(pagination.last_page)}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataTable;
