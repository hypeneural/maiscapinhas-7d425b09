/**
 * AnnouncementReadModal
 * 
 * Modal for reading regular announcements (recados).
 * Marks as seen when user explicitly acknowledges reading.
 * Allows dismissing if require_ack is false.
 */

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    MessageSquare,
    Calendar,
    Loader2,
    X,
    Check,
    ExternalLink,
} from 'lucide-react';
import { useMarkSeen, useDismiss, useAcknowledge } from '@/hooks/api/use-announcements';
import { useToast } from '@/hooks/use-toast';
import { AnnouncementSeverityBadge } from './AnnouncementStatusBadge';
import { cn } from '@/lib/utils';
import type { AnnouncementSummary } from '@/types/announcements.types';

interface AnnouncementReadModalProps {
    announcement: AnnouncementSummary | null;
    open: boolean;
    onClose: () => void;
    storeId?: number;
}

export const AnnouncementReadModal: React.FC<AnnouncementReadModalProps> = ({
    announcement,
    open,
    onClose,
    storeId,
}) => {
    const { toast } = useToast();
    const markSeenMutation = useMarkSeen();
    const dismissMutation = useDismiss();
    const acknowledgeMutation = useAcknowledge();
    const [isClosing, setIsClosing] = useState(false);

    // Handle close - mark as seen if not already
    const handleClose = async () => {
        if (!announcement) {
            onClose();
            return;
        }

        // If already seen, just close
        if (announcement.receipt?.seen_at) {
            onClose();
            return;
        }

        // Mark as seen on close
        setIsClosing(true);
        try {
            await markSeenMutation.mutateAsync({ id: announcement.id, storeId });
        } catch (error) {
            // Ignore error, still close
        }
        setIsClosing(false);
        onClose();
    };

    // Handle dismiss
    const handleDismiss = async () => {
        if (!announcement) return;

        try {
            await dismissMutation.mutateAsync({ id: announcement.id, storeId });
            toast({
                title: 'Comunicado dispensado',
                description: 'O comunicado não aparecerá mais para você.',
            });
            onClose();
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível dispensar o comunicado.',
                variant: 'destructive',
            });
        }
    };

    // Handle acknowledge (for require_ack announcements)
    const handleAcknowledge = async () => {
        if (!announcement) return;

        try {
            await acknowledgeMutation.mutateAsync({ id: announcement.id, storeId });
            toast({
                title: 'Confirmação registrada',
                description: 'O comunicado foi marcado como recebido.',
            });
            onClose();
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível confirmar o recebimento.',
                variant: 'destructive',
            });
        }
    };

    if (!announcement) return null;

    const canDismiss = !announcement.require_ack;
    const requiresAck = announcement.require_ack;
    const alreadyAcknowledged = !!announcement.receipt?.acknowledged_at;

    const publishedDate = announcement.starts_at
        ? new Date(announcement.starts_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        })
        : null;

    // Severity-based styling
    const severityStyles = {
        info: 'bg-blue-50 dark:bg-blue-950/20',
        warning: 'bg-amber-50 dark:bg-amber-950/20',
        danger: 'bg-red-50 dark:bg-red-950/20',
    };

    const headerBg = severityStyles[announcement.severity.value] || '';

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    // Don't allow closing if require_ack and not yet acknowledged
                    if (requiresAck && !alreadyAcknowledged) {
                        return;
                    }
                    handleClose();
                }
            }}
        >
            <DialogContent
                className="sm:max-w-lg p-0 overflow-hidden"
                onPointerDownOutside={(e) => {
                    if (requiresAck && !alreadyAcknowledged) {
                        e.preventDefault();
                    }
                }}
                onEscapeKeyDown={(e) => {
                    if (requiresAck && !alreadyAcknowledged) {
                        e.preventDefault();
                    }
                }}
                hideCloseButton={requiresAck && !alreadyAcknowledged}
            >
                {/* Header */}
                <DialogHeader className={cn('p-6 pb-4', headerBg)}>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center shadow-sm">
                            <MessageSquare className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-lg leading-tight">
                                {announcement.title}
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <AnnouncementSeverityBadge severity={announcement.severity.value} />
                                <span className="text-xs text-muted-foreground">
                                    {announcement.type.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {publishedDate && (
                        <DialogDescription className="flex items-center gap-2 text-sm mt-3">
                            <Calendar className="w-4 h-4" />
                            Publicado em {publishedDate}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {/* Content */}
                <ScrollArea className="max-h-[50vh]">
                    <div className="p-6 pt-2 space-y-4">
                        {announcement.image_url && (
                            <img
                                src={announcement.image_url}
                                alt={announcement.image_alt || announcement.title}
                                className="w-full rounded-lg"
                            />
                        )}

                        <div
                            className="prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{
                                __html: announcement.message || announcement.excerpt
                            }}
                        />

                        {announcement.cta_url && announcement.cta_label && (
                            <a
                                href={announcement.cta_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                            >
                                {announcement.cta_label}
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <DialogFooter className="p-6 pt-4 border-t bg-muted/30">
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:justify-end">
                        {canDismiss && !alreadyAcknowledged && (
                            <Button
                                variant="outline"
                                onClick={handleDismiss}
                                disabled={dismissMutation.isPending}
                                className="sm:order-1"
                            >
                                {dismissMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <X className="w-4 h-4 mr-2" />
                                )}
                                Dispensar
                            </Button>
                        )}

                        {requiresAck && !alreadyAcknowledged ? (
                            <Button
                                onClick={handleAcknowledge}
                                disabled={acknowledgeMutation.isPending}
                                className="sm:order-2"
                            >
                                {acknowledgeMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4 mr-2" />
                                )}
                                Confirmar Recebimento
                            </Button>
                        ) : (
                            <Button
                                onClick={handleClose}
                                disabled={isClosing}
                                className="sm:order-2"
                            >
                                {isClosing ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : null}
                                Fechar
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
