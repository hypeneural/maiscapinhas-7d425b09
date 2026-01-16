/**
 * Role Node Component
 * 
 * Custom React Flow node for displaying roles.
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Shield } from 'lucide-react';
import type { GraphNodeData } from '@/types/graph.types';

interface RoleNodeProps {
    data: GraphNodeData;
    selected?: boolean;
}

export const RoleNode = memo(({ data, selected }: RoleNodeProps) => {
    return (
        <div
            className={`
        bg-blue-50 dark:bg-blue-950/30 
        border-2 border-blue-500 
        rounded-lg p-3 min-w-[160px]
        shadow-sm hover:shadow-md transition-shadow
        ${selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
      `}
        >
            <Handle type="target" position={Position.Top} className="!bg-blue-500" />

            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-blue-500/20">
                    <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                    {data.label}
                </span>
            </div>

            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                {data.level !== undefined && (
                    <div className="flex justify-between">
                        <span>Nível</span>
                        <span className="font-medium">{data.level}</span>
                    </div>
                )}
                {data.permissions_count !== undefined && (
                    <div className="flex justify-between">
                        <span>Permissões</span>
                        <span className="font-medium">{data.permissions_count}</span>
                    </div>
                )}
                {data.users_count !== undefined && (
                    <div className="flex justify-between">
                        <span>Usuários</span>
                        <span className="font-medium">{data.users_count}</span>
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
        </div>
    );
});

RoleNode.displayName = 'RoleNode';
