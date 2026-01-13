/**
 * CriticalAnnouncementModal
 * 
 * Modal for displaying advertências that require acknowledgment (ACK).
 * Blocks interaction until user confirms with "RECEBIDO" button.
 * Does NOT close on outside click or escape when require_ack is true.
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
import { AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { useAcknowledge } from '@/hooks/api/use-announcements';
import { useToast } from '@/hooks/use-toast';
import type { AnnouncementSummary } from '@/types/announcements.types';

interface CriticalAnnouncementModalProps {
    announcement: AnnouncementSummary | null;
    open: boolean;
    onClose: () => void;
    storeId?: number;
}

export const CriticalAnnouncementModal: React.FC<CriticalAnnouncementModalProps> = ({
    announcement,
    open,
    onClose,
    storeId,
}) => {
    const { toast } = useToast();
    const acknowledgeMutation = useAcknowledge();
    const [isAcknowledging, setIsAcknowledging] = useState(false);

    const handleAcknowledge = async () => {
        if (!announcement || isAcknowledging) return;

        setIsAcknowledging(true);
        try {
            await acknowledgeMutation.mutateAsync({ id: announcement.id, storeId });
            toast({
                title: 'Confirmação registrada',
                description: 'O comunicado foi marcado como recebido.',
            });
            // Small delay so user sees the success state
            setTimeout(() => {
                setIsAcknowledging(false);
                onClose();
            }, 500);
        } catch (error) {
            setIsAcknowledging(false);
            toast({
                title: 'Erro',
                description: 'Não foi possível confirmar o recebimento.',
                variant: 'destructive',
            });
        }
    };

    if (!announcement) return null;

    // Critical announcements with require_ack CANNOT be closed
    const canClose = !announcement.require_ack;

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                // Only allow closing if canClose is true
                if (!isOpen && canClose) {
                    onClose();
                }
                // If require_ack is true, ignore the close request
            }}
        >
            <DialogContent
                className="sm:max-w-lg border-2 border-red-500 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/30 shadow-2xl"
                // Block ALL outside interactions for require_ack modals
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => {
                    if (!canClose) e.preventDefault();
                }}
                onInteractOutside={(e) => e.preventDefault()}
                // Hide the X close button for require_ack modals
                hideCloseButton={!canClose}
            >
                <DialogHeader className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center animate-pulse">
                            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl text-red-900 dark:text-red-100 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                ATENÇÃO
                            </DialogTitle>
                            <DialogDescription className="text-red-700 dark:text-red-300 mt-1">
                                Você tem uma mensagem importante que requer confirmação.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="border-t border-b border-red-200 dark:border-red-800 py-5 my-3 space-y-4">
                    <h3 className="font-bold text-lg text-red-900 dark:text-red-100">
                        {announcement.title}
                    </h3>

                    <div
                        className="prose prose-sm dark:prose-invert max-w-none text-red-800 dark:text-red-200 leading-relaxed"
                        dangerouslySetInnerHTML={{
                            __html: announcement.message || announcement.excerpt
                        }}
                    />

                    {announcement.require_ack && (
                        <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>Este comunicado requer sua confirmação de leitura. Você não poderá fechar este aviso sem confirmar.</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-center pt-2">
                    <Button
                        size="lg"
                        className="bg-red-600 hover:bg-red-700 text-white px-12 py-7 text-lg font-bold shadow-lg transition-all hover:scale-105 active:scale-100"
                        onClick={handleAcknowledge}
                        disabled={isAcknowledging}
                    >
                        {isAcknowledging ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Confirmando...
                            </>
                        ) : acknowledgeMutation.isSuccess ? (
                            <>
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Confirmado!
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5 mr-2" />
                                CONFIRMAR RECEBIMENTO
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
