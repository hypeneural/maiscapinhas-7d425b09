/**
 * AnnouncementCarousel
 * 
 * Rotating banner carousel for displaying active announcements on the dashboard.
 * Shows count indicator and supports HTML content rendering.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    ChevronLeft,
    ChevronRight,
    Bell,
    Info,
    AlertTriangle,
    ExternalLink,
    MessageSquare,
} from 'lucide-react';
import type { AnnouncementSummary } from '@/types/announcements.types';

interface AnnouncementCarouselProps {
    announcements: AnnouncementSummary[];
    onReadClick: (announcement: AnnouncementSummary) => void;
    className?: string;
    autoRotateInterval?: number; // in ms, default 5000
}

const SEVERITY_ICONS = {
    info: Info,
    warning: Bell,
    danger: AlertTriangle,
};

const SEVERITY_STYLES = {
    info: {
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900',
        icon: 'bg-blue-500 text-white',
        border: 'border-blue-200 dark:border-blue-800',
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    warning: {
        bg: 'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950 dark:to-amber-900',
        icon: 'bg-amber-500 text-white',
        border: 'border-amber-200 dark:border-amber-800',
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    danger: {
        bg: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900',
        icon: 'bg-red-500 text-white',
        border: 'border-red-200 dark:border-red-800',
        badge: 'bg-red-100 text-red-700 border-red-200',
    },
};

// Helper to strip HTML tags for plain text preview
function stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

export const AnnouncementCarousel: React.FC<AnnouncementCarouselProps> = ({
    announcements,
    onReadClick,
    className,
    autoRotateInterval = 5000,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, [announcements.length]);

    const goToPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
    }, [announcements.length]);

    // Auto-rotate effect
    useEffect(() => {
        if (announcements.length <= 1 || isPaused) return;

        const interval = setInterval(goToNext, autoRotateInterval);
        return () => clearInterval(interval);
    }, [announcements.length, isPaused, autoRotateInterval, goToNext]);

    // Reset index when announcements change
    useEffect(() => {
        setCurrentIndex(0);
    }, [announcements.length]);

    if (announcements.length === 0) return null;

    const currentAnnouncement = announcements[currentIndex];
    const Icon = SEVERITY_ICONS[currentAnnouncement.severity.value];
    const styles = SEVERITY_STYLES[currentAnnouncement.severity.value];

    // Get plain text excerpt for preview
    const plainExcerpt = useMemo(() => {
        const text = currentAnnouncement.excerpt || stripHtml(currentAnnouncement.message || '');
        return text.length > 120 ? text.slice(0, 120) + '...' : text;
    }, [currentAnnouncement.excerpt, currentAnnouncement.message]);

    return (
        <div
            className={cn('relative', className)}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Count indicator header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-sm">Comunicados</h3>
                    <Badge variant="secondary" className="text-xs">
                        {announcements.length} {announcements.length === 1 ? 'ativo' : 'ativos'}
                    </Badge>
                </div>

                {/* Mini navigation */}
                {announcements.length > 1 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>{currentIndex + 1} / {announcements.length}</span>
                    </div>
                )}
            </div>

            <Card className={cn('overflow-hidden border-2 transition-all duration-500', styles.border)}>
                <CardContent className={cn('p-0', styles.bg)}>
                    <div className="flex items-stretch min-h-[100px]">
                        {/* Icon section */}
                        <div className={cn('w-20 flex items-center justify-center shrink-0', styles.icon)}>
                            <Icon className="w-8 h-8" />
                        </div>

                        {/* Content section */}
                        <div className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            {currentAnnouncement.type.label}
                                        </span>
                                        {currentAnnouncement.is_pinned && (
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                Fixado
                                            </span>
                                        )}
                                        {currentAnnouncement.require_ack && (
                                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                                Requer confirmação
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="font-semibold text-lg truncate mb-1">
                                        {currentAnnouncement.title}
                                    </h3>

                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {plainExcerpt}
                                    </p>
                                </div>

                                <Button
                                    size="sm"
                                    onClick={() => onReadClick(currentAnnouncement)}
                                    className="shrink-0"
                                >
                                    {currentAnnouncement.cta_label || 'Ler mais'}
                                    <ExternalLink className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Navigation arrows */}
            {announcements.length > 1 && (
                <>
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-2 top-1/2 mt-3 -translate-y-1/2 h-8 w-8 rounded-full bg-background/90 shadow-lg"
                        onClick={goToPrev}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-1/2 mt-3 -translate-y-1/2 h-8 w-8 rounded-full bg-background/90 shadow-lg"
                        onClick={goToNext}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </>
            )}

            {/* Dot indicators with progress */}
            {announcements.length > 1 && (
                <div className="flex justify-center items-center gap-2 mt-3">
                    {announcements.map((announcement, index) => (
                        <button
                            key={announcement.id}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                'h-2 rounded-full transition-all duration-300',
                                index === currentIndex
                                    ? 'w-6 bg-primary'
                                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                            )}
                            aria-label={`Ir para comunicado ${index + 1}: ${announcement.title}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
