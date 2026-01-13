/**
 * AnnouncementBanner
 * 
 * Alert banner displayed at the top of the dashboard when there are
 * critical announcements pending acknowledgment.
 */

import React from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnnouncementBannerProps {
    count: number;
    onClick: () => void;
    className?: string;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
    count,
    onClick,
    className,
}) => {
    if (count === 0) return null;

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white p-4 shadow-lg animate-pulse-slow',
                className
            )}
        >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="2" fill="currentColor" />
                    </pattern>
                    <rect fill="url(#pattern)" width="100%" height="100%" />
                </svg>
            </div>

            <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-bounce-slow">
                        <Bell className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-semibold">
                            {count === 1
                                ? 'Você tem 1 aviso importante'
                                : `Você tem ${count} avisos importantes`}
                        </p>
                        <p className="text-sm text-white/80">
                            Clique para visualizar e confirmar
                        </p>
                    </div>
                </div>

                <Button
                    variant="secondary"
                    className="bg-white text-red-600 hover:bg-white/90 font-semibold"
                    onClick={onClick}
                >
                    Ver
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
        </div>
    );
};
