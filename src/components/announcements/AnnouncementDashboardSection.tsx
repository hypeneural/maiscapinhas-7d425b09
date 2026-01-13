/**
 * AnnouncementDashboardSection
 * 
 * Combines all announcement components for easy integration into dashboards.
 * Handles the critical modal display logic, banner, and carousel.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useActiveAnnouncements } from '@/hooks/api/use-announcements';
import { AnnouncementBanner } from './AnnouncementBanner';
import { AnnouncementCarousel } from './AnnouncementCarousel';
import { CriticalAnnouncementModal } from './CriticalAnnouncementModal';
import { AnnouncementReadModal } from './AnnouncementReadModal';
import { Skeleton } from '@/components/ui/skeleton';
import type { AnnouncementSummary } from '@/types/announcements.types';

interface AnnouncementDashboardSectionProps {
    storeId?: number;
    className?: string;
}

export const AnnouncementDashboardSection: React.FC<AnnouncementDashboardSectionProps> = ({
    storeId,
    className,
}) => {
    const { data, isLoading } = useActiveAnnouncements({ store_id: storeId });

    // Track if we've already auto-opened critical modals on initial load
    const hasAutoOpenedRef = useRef(false);

    // Modal states
    const [criticalModalOpen, setCriticalModalOpen] = useState(false);
    const [currentCriticalIndex, setCurrentCriticalIndex] = useState(0);
    const [readModalOpen, setReadModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementSummary | null>(null);

    // Critical announcements
    const criticalAnnouncements = data?.critical || [];
    const currentCritical = criticalAnnouncements[currentCriticalIndex] || null;

    // Auto-open critical modal ONLY ONCE on initial data load
    useEffect(() => {
        if (
            criticalAnnouncements.length > 0 &&
            !hasAutoOpenedRef.current &&
            !isLoading
        ) {
            hasAutoOpenedRef.current = true;
            setCurrentCriticalIndex(0);
            setCriticalModalOpen(true);
        }
    }, [criticalAnnouncements.length, isLoading]);

    // Handle critical modal close - show next or close
    const handleCriticalClose = () => {
        if (currentCriticalIndex < criticalAnnouncements.length - 1) {
            // Show next critical
            setCurrentCriticalIndex((prev) => prev + 1);
        } else {
            // All done
            setCriticalModalOpen(false);
            setCurrentCriticalIndex(0);
        }
    };

    // Handle banner click - open first critical (user-initiated)
    const handleBannerClick = () => {
        setCurrentCriticalIndex(0);
        setCriticalModalOpen(true);
    };

    // Handle carousel read click
    const handleReadClick = (announcement: AnnouncementSummary) => {
        setSelectedAnnouncement(announcement);
        setReadModalOpen(true);
    };

    // Loading skeleton
    if (isLoading) {
        return (
            <div className={className}>
                <Skeleton className="h-20 rounded-xl mb-4" />
                <Skeleton className="h-28 rounded-xl" />
            </div>
        );
    }

    const banners = data?.banners || [];
    const hasCritical = criticalAnnouncements.length > 0;
    const hasBanners = banners.length > 0;

    // Don't render anything if no announcements
    if (!hasCritical && !hasBanners) {
        return null;
    }

    return (
        <div className={className}>
            {/* Critical banner */}
            {hasCritical && (
                <AnnouncementBanner
                    count={criticalAnnouncements.length}
                    onClick={handleBannerClick}
                    className="mb-4"
                />
            )}

            {/* Banner carousel */}
            {hasBanners && (
                <AnnouncementCarousel
                    announcements={banners}
                    onReadClick={handleReadClick}
                />
            )}

            {/* Critical modal */}
            <CriticalAnnouncementModal
                announcement={currentCritical}
                open={criticalModalOpen}
                onClose={handleCriticalClose}
                storeId={storeId}
            />

            {/* Read modal */}
            <AnnouncementReadModal
                announcement={selectedAnnouncement}
                open={readModalOpen}
                onClose={() => {
                    setReadModalOpen(false);
                    setSelectedAnnouncement(null);
                }}
                storeId={storeId}
            />
        </div>
    );
};
