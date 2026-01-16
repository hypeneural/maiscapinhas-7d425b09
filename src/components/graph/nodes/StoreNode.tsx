/**
 * Store Node Component
 * 
 * Custom React Flow node for displaying stores.
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Store, Users, Package } from 'lucide-react';
import type { GraphNodeData } from '@/types/graph.types';

interface StoreNodeProps {
    data: GraphNodeData;
    selected?: boolean;
}

export const StoreNode = memo(({ data, selected }: StoreNodeProps) => {
    return (
        <div
            className={`
        bg-green-50 dark:bg-green-950/30 
        border-2 border-green-500 
        rounded-lg p-3 min-w-[160px]
        shadow-sm hover:shadow-md transition-shadow
        ${selected ? 'ring-2 ring-green-400 ring-offset-2' : ''}
      `}
        >
            <Handle type="target" position={Position.Top} className="!bg-green-500" />

            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-green-500/20">
                    <Store className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <span className="font-semibold text-green-900 dark:text-green-100 text-sm block truncate">
                        {data.label}
                    </span>
                    {data.city && (
                        <span className="text-[10px] text-gray-500 truncate block">
                            {data.city}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                {data.users_count !== undefined && (
                    <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{data.users_count}</span>
                    </div>
                )}
                {data.modules_count !== undefined && (
                    <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>{data.modules_count}</span>
                    </div>
                )}
            </div>

            {data.role_in_store && (
                <div className="mt-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-700 dark:text-green-300 capitalize">
                        {data.role_in_store}
                    </span>
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="!bg-green-500" />
        </div>
    );
});

StoreNode.displayName = 'StoreNode';
