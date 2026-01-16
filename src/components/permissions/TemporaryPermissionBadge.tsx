/**
 * TemporaryPermissionBadge Component
 * 
 * Shows a badge for temporary permissions with expiration info.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TemporaryPermission, ExpiringPermission } from '@/types/api';

interface TemporaryPermissionBadgeProps {
    permission: TemporaryPermission;
}

/**
 * Badge showing temporary permission with expiration
 */
export function TemporaryPermissionBadge({ permission }: TemporaryPermissionBadgeProps) {
    const expiresAt = parseISO(permission.expires_at);
    const daysUntilExpiry = differenceInDays(expiresAt, new Date());
    const isExpiringSoon = daysUntilExpiry <= 3;

    const timeRemaining = formatDistanceToNow(expiresAt, {
        addSuffix: true,
        locale: ptBR,
    });

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Badge
                    variant={isExpiringSoon ? 'destructive' : 'secondary'}
                    className="gap-1 cursor-help"
                >
                    {isExpiringSoon ? (
                        <AlertTriangle className="h-3 w-3" />
                    ) : (
                        <Clock className="h-3 w-3" />
                    )}
                    Temporário
                </Badge>
            </TooltipTrigger>
            <TooltipContent>
                <div className="text-sm">
                    <p className="font-medium">Permissão temporária</p>
                    <p className="text-muted-foreground">
                        Expira {timeRemaining}
                    </p>
                    {permission.granted_by && (
                        <p className="text-muted-foreground mt-1">
                            Concedida por: {permission.granted_by}
                        </p>
                    )}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}

interface ExpiringPermissionAlertProps {
    permissions: ExpiringPermission[];
}

/**
 * Alert showing permissions that are expiring soon
 */
export function ExpiringPermissionAlert({ permissions }: ExpiringPermissionAlertProps) {
    if (permissions.length === 0) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-2 text-sm bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-yellow-800 dark:text-yellow-200">
                {permissions.length === 1 ? (
                    <>1 permissão expira em menos de 7 dias</>
                ) : (
                    <>{permissions.length} permissões expiram em menos de 7 dias</>
                )}
            </span>
        </div>
    );
}

export default TemporaryPermissionBadge;
