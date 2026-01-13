/**
 * Device Select Component
 * 
 * Dropdown for selecting a device from a customer's linked devices.
 */

import React from 'react';
import { Smartphone, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCustomerDevices } from '@/hooks/api/use-customers';
import type { CustomerDevice } from '@/types/customers.types';

interface DeviceSelectProps {
    customerId: number | null;
    value: number | null;
    onChange: (deviceId: number | null, device?: CustomerDevice) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function DeviceSelect({
    customerId,
    value,
    onChange,
    placeholder = 'Selecionar aparelho...',
    disabled = false,
    className,
}: DeviceSelectProps) {
    // Fetch devices for the selected customer
    const { data: devices, isLoading } = useCustomerDevices(customerId || 0);

    const handleChange = (deviceIdStr: string) => {
        if (deviceIdStr === 'none') {
            onChange(null);
            return;
        }
        const deviceId = parseInt(deviceIdStr, 10);
        const device = devices?.find((d) => d.id === deviceId);
        onChange(deviceId, device);
    };

    // If no customer selected, show disabled state
    if (!customerId) {
        return (
            <Select disabled>
                <SelectTrigger className={cn('w-full', className)}>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Smartphone className="h-4 w-4" />
                        <span>Selecione um cliente primeiro</span>
                    </div>
                </SelectTrigger>
            </Select>
        );
    }

    // Show loading state
    if (isLoading) {
        return (
            <Select disabled>
                <SelectTrigger className={cn('w-full', className)}>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Carregando aparelhos...</span>
                    </div>
                </SelectTrigger>
            </Select>
        );
    }

    // Show message if no devices
    if (!devices || devices.length === 0) {
        return (
            <Select disabled>
                <SelectTrigger className={cn('w-full', className)}>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Smartphone className="h-4 w-4" />
                        <span>Cliente sem aparelhos cadastrados</span>
                    </div>
                </SelectTrigger>
            </Select>
        );
    }

    return (
        <Select
            value={value?.toString() || 'none'}
            onValueChange={handleChange}
            disabled={disabled}
        >
            <SelectTrigger className={cn('w-full', className)}>
                <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder={placeholder} />
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="none">
                    <span className="text-muted-foreground">Nenhum aparelho</span>
                </SelectItem>
                {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id.toString()}>
                        <div className="flex items-center gap-2">
                            <span>{device.display_name}</span>
                            {device.is_primary && (
                                <span className="text-xs text-primary font-medium">
                                    Principal
                                </span>
                            )}
                            {device.nickname && (
                                <span className="text-xs text-muted-foreground">
                                    ({device.nickname})
                                </span>
                            )}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export default DeviceSelect;
