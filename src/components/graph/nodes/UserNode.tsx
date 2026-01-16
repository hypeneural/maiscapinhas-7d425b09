/**
 * User Node Component
 * 
 * Custom React Flow node for displaying users.
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { User, Crown } from 'lucide-react';
import type { GraphNodeData } from '@/types/graph.types';

interface UserNodeProps {
    data: GraphNodeData;
    selected?: boolean;
}

export const UserNode = memo(({ data, selected }: UserNodeProps) => {
    const isSuperAdmin = data.is_super_admin ?? false;

    return (
        <div
            className={`
        bg-yellow-50 dark:bg-yellow-950/30 
        border-2 ${isSuperAdmin ? 'border-amber-500' : 'border-yellow-500'} 
        rounded-lg p-3 min-w-[160px]
        shadow-sm hover:shadow-md transition-shadow
        ${selected ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}
      `}
        >
            <Handle type="target" position={Position.Top} className="!bg-yellow-500" />

            <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-md ${isSuperAdmin ? 'bg-amber-500/20' : 'bg-yellow-500/20'}`}>
                    {isSuperAdmin ? (
                        <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    ) : (
                        <User className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <span className="font-semibold text-yellow-900 dark:text-yellow-100 text-sm block truncate">
                        {data.label}
                    </span>
                    {data.email && (
                        <span className="text-[10px] text-gray-500 truncate block">
                            {data.email}
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                {data.roles && data.roles.length > 0 && (
                    <div className="flex justify-between">
                        <span>Roles</span>
                        <span className="font-medium">{data.roles.join(', ')}</span>
                    </div>
                )}
                {data.stores_count !== undefined && (
                    <div className="flex justify-between">
                        <span>Lojas</span>
                        <span className="font-medium">{data.stores_count}</span>
                    </div>
                )}
                {data.role_in_store && (
                    <div className="flex justify-between">
                        <span>Cargo</span>
                        <span className="font-medium capitalize">{data.role_in_store}</span>
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-yellow-500" />
        </div>
    );
});

UserNode.displayName = 'UserNode';
