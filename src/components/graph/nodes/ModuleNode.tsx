/**
 * Module Node Component
 * 
 * Custom React Flow node for displaying modules.
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Package, Check, X } from 'lucide-react';
import type { GraphNodeData } from '@/types/graph.types';

interface ModuleNodeProps {
    data: GraphNodeData;
    selected?: boolean;
}

export const ModuleNode = memo(({ data, selected }: ModuleNodeProps) => {
    const isActive = data.is_active ?? true;

    return (
        <div
            className={`
        bg-orange-50 dark:bg-orange-950/30 
        border-2 ${isActive ? 'border-orange-500' : 'border-gray-400'} 
        rounded-lg p-3 min-w-[160px]
        shadow-sm hover:shadow-md transition-shadow
        ${selected ? 'ring-2 ring-orange-400 ring-offset-2' : ''}
        ${!isActive ? 'opacity-60' : ''}
      `}
        >
            <Handle type="target" position={Position.Top} className="!bg-orange-500" />

            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-orange-500/20">
                    <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="font-semibold text-orange-900 dark:text-orange-100 text-sm flex-1">
                    {data.label}
                </span>
                {isActive ? (
                    <Check className="w-4 h-4 text-green-500" />
                ) : (
                    <X className="w-4 h-4 text-gray-400" />
                )}
            </div>

            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                {data.status_count !== undefined && (
                    <div className="flex justify-between">
                        <span>Status</span>
                        <span className="font-medium">{data.status_count}</span>
                    </div>
                )}
                {data.permission_count !== undefined && (
                    <div className="flex justify-between">
                        <span>Permissões</span>
                        <span className="font-medium">{data.permission_count}</span>
                    </div>
                )}
                {data.version && (
                    <div className="flex justify-between">
                        <span>Versão</span>
                        <span className="font-mono">{data.version}</span>
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-orange-500" />
        </div>
    );
});

ModuleNode.displayName = 'ModuleNode';
