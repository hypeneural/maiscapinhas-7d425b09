/**
 * Permission Node Component
 * 
 * Custom React Flow node for displaying permissions and screens.
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Key, Monitor, Check, X, Clock } from 'lucide-react';
import type { GraphNodeData } from '@/types/graph.types';

interface PermissionNodeProps {
    data: GraphNodeData;
    selected?: boolean;
}

export const PermissionNode = memo(({ data, selected }: PermissionNodeProps) => {
    const isScreen = data.type === 'screen';
    const isGranted = data.granted ?? true;
    const isOverride = data.is_override ?? false;
    const isTemporary = data.is_temporary ?? false;

    const Icon = isScreen ? Monitor : Key;

    const bgColor = isScreen
        ? 'bg-purple-50 dark:bg-purple-950/30'
        : 'bg-gray-50 dark:bg-gray-900/30';
    const borderColor = isScreen
        ? 'border-purple-500'
        : isGranted
            ? 'border-gray-400'
            : 'border-red-400';
    const iconBg = isScreen ? 'bg-purple-500/20' : 'bg-gray-500/20';
    const iconColor = isScreen
        ? 'text-purple-600 dark:text-purple-400'
        : 'text-gray-600 dark:text-gray-400';

    return (
        <div
            className={`
        ${bgColor} 
        border ${borderColor} 
        rounded-lg p-2 min-w-[140px]
        shadow-sm hover:shadow-md transition-shadow
        ${selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
        ${isOverride ? 'ring-1 ring-amber-400' : ''}
      `}
        >
            <Handle type="target" position={Position.Top} className="!bg-gray-400" />

            <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${iconBg}`}>
                    <Icon className={`w-3 h-3 ${iconColor}`} />
                </div>
                <span className="font-medium text-gray-800 dark:text-gray-200 text-xs flex-1 truncate">
                    {data.label}
                </span>
                <div className="flex items-center gap-0.5">
                    {isTemporary && (
                        <Clock className="w-3 h-3 text-amber-500" />
                    )}
                    {isGranted ? (
                        <Check className="w-3 h-3 text-green-500" />
                    ) : (
                        <X className="w-3 h-3 text-red-500" />
                    )}
                </div>
            </div>

            {(isOverride || data.reason) && (
                <div className="mt-1 text-[10px] text-gray-500">
                    {isOverride && <span className="text-amber-600">Override</span>}
                    {data.reason && <span className="ml-1">{data.reason}</span>}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
        </div>
    );
});

PermissionNode.displayName = 'PermissionNode';
