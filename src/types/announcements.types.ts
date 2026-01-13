/**
 * Announcements Types
 * 
 * TypeScript interfaces for the Internal Communication System (Comunicados).
 * Aligned with backend API specification.
 */

// ============================================================
// Enums
// ============================================================

export type AnnouncementType = 'recado' | 'advertencia';
export type AnnouncementSeverity = 'info' | 'warning' | 'danger';
export type AnnouncementScope = 'global' | 'store' | 'user' | 'role';
export type AnnouncementStatus = 'draft' | 'scheduled' | 'active' | 'expired' | 'archived';
export type AnnouncementDisplayMode = 'banner' | 'modal' | 'both';
export type AnnouncementTargetType = 'store' | 'user' | 'role';

// ============================================================
// Enums with labels (from API response)
// ============================================================

export interface EnumValue<T = string> {
    value: T;
    label: string;
    color?: string;
}

// ============================================================
// Target & Receipt
// ============================================================

export interface AnnouncementTarget {
    target_type: AnnouncementTargetType;
    target_id: string;
}

export interface AnnouncementReceipt {
    seen_at: string | null;
    acknowledged_at: string | null;
    dismissed_at: string | null;
    last_shown_at: string | null;
    show_count: number;
}

// ============================================================
// Announcement Summary (list/carousel)
// ============================================================

export interface AnnouncementSummary {
    id: number;
    title: string;
    excerpt: string;
    message?: string; // Full message (optional in summary)
    type: EnumValue<AnnouncementType>;
    severity: EnumValue<AnnouncementSeverity>;
    display_mode: EnumValue<AnnouncementDisplayMode>;
    require_ack: boolean;
    icon: string | null;
    image_url: string | null;
    image_alt: string | null;
    cta_label: string | null;
    cta_url: string | null;
    starts_at: string | null;
    expires_at: string | null;
    is_pinned: boolean;
    is_critical: boolean;
    receipt: AnnouncementReceipt | null;
}

// ============================================================
// Announcement Detail (full)
// ============================================================

export interface AnnouncementDetail extends AnnouncementSummary {
    message: string;
    scope: EnumValue<AnnouncementScope>;
    status: EnumValue<AnnouncementStatus>;
    repeat_every_minutes: number | null;
    priority: number;
    pinned_until: string | null;
    meta_json: Record<string, unknown> | null;
    targets: AnnouncementTarget[];
    published_at: string | null;
    published_by: { id: number; name: string } | null;
    archived_at: string | null;
    archived_by: { id: number; name: string } | null;
    created_by: { id: number; name: string };
    created_at: string;
    updated_at: string;
}

// ============================================================
// API Responses
// ============================================================

export interface ActiveAnnouncementsResponse {
    critical: AnnouncementSummary[];
    banners: AnnouncementSummary[];
}

export interface AnnouncementActionResponse {
    message: string;
    seen_at?: string;
    acknowledged_at?: string;
    dismissed_at?: string;
}

export interface PublishAnnouncementResponse {
    message: string;
    status: AnnouncementStatus;
    published_at: string;
}

export interface ArchiveAnnouncementResponse {
    message: string;
    archived_at: string;
}

export interface RepublishAnnouncementResponse {
    message: string;
    status: AnnouncementStatus;
    published_at: string;
}

export interface DuplicateAnnouncementResponse {
    message: string;
    announcement: AnnouncementDetail;
}

// Stats response from GET /announcements/{id}/stats
export interface AnnouncementStats {
    total_recipients: number;
    delivered_count: number;
    seen_count: number;
    acknowledged_count: number;
    dismissed_count: number;
    pending_count: number;
    seen_percentage: number;
    ack_percentage: number;
    require_ack: boolean;
}

// Receipt item from GET /announcements/{id}/receipts
export interface AnnouncementReceiptItem {
    user: {
        id: number;
        name: string;
        email: string;
        avatar_url: string | null;
    };
    store: {
        id: number;
        name: string;
    } | null;
    delivered_at: string | null;
    seen_at: string | null;
    acknowledged_at: string | null;
    dismissed_at: string | null;
    last_shown_at: string | null;
    show_count: number;
}

// Filters for receipts endpoint
export interface AnnouncementReceiptsFilters {
    status?: 'seen' | 'unseen' | 'acknowledged' | 'pending' | 'dismissed';
    store_id?: number;
    per_page?: number;
    page?: number;
}

// ============================================================
// Request Payloads
// ============================================================

export interface CreateAnnouncementPayload {
    title: string;
    message: string;
    excerpt?: string;
    type: AnnouncementType;
    severity: AnnouncementSeverity;
    display_mode?: AnnouncementDisplayMode;
    icon?: string;
    image_url?: string;
    image_alt?: string;
    cta_label?: string;
    cta_url?: string;
    scope: AnnouncementScope;
    require_ack?: boolean;
    starts_at?: string; // ISO 8601
    expires_at?: string; // ISO 8601
    repeat_every_minutes?: number;
    priority?: number;
    pinned_until?: string;
    targets?: AnnouncementTarget[];
}

export interface UpdateAnnouncementPayload extends Partial<CreateAnnouncementPayload> { }

// ============================================================
// Filters
// ============================================================

export interface AnnouncementFilters {
    status?: AnnouncementStatus | 'all';
    only_unacknowledged?: boolean;
    only_unseen?: boolean;
    severity?: AnnouncementSeverity;
    type?: AnnouncementType;
    scope?: AnnouncementScope;
    store_id?: number;
    created_by?: number;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
    sort?: 'starts_at_desc' | 'starts_at_asc' | 'created_at_desc' | 'created_at_asc' | 'severity_desc' | 'priority_desc';
}

export interface ActiveAnnouncementsParams {
    store_id?: number;
}

// ============================================================
// Utility Types
// ============================================================

/** Check if announcement requires acknowledgment */
export const requiresAck = (announcement: AnnouncementSummary): boolean => {
    return announcement.require_ack && !announcement.receipt?.acknowledged_at;
};

/** Check if announcement was seen */
export const wasSeen = (announcement: AnnouncementSummary): boolean => {
    return !!announcement.receipt?.seen_at;
};

/** Check if announcement was acknowledged */
export const wasAcknowledged = (announcement: AnnouncementSummary): boolean => {
    return !!announcement.receipt?.acknowledged_at;
};

/** Get receipt status label */
export const getReceiptStatus = (announcement: AnnouncementSummary): 'pending' | 'seen' | 'acknowledged' => {
    if (announcement.receipt?.acknowledged_at) return 'acknowledged';
    if (announcement.receipt?.seen_at) return 'seen';
    return 'pending';
};
