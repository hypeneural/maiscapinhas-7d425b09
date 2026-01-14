/**
 * WhatsApp Connect Modal
 * 
 * Modal component for connecting WhatsApp via QR Code.
 * Shows QR code, pairing code, countdown timer, and polls for connection status.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, RefreshCw, Loader2, Check, Clock, Smartphone, Copy, CheckCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useConnectInstance, useCheckInstanceState, whatsAppInstancesKeys } from '@/hooks/api/use-whatsapp-instances';
import { useQueryClient } from '@tanstack/react-query';
import type { WhatsAppInstanceResponse } from '@/types/whatsapp-instances.types';

// ============================================================
// Types
// ============================================================

interface WhatsAppConnectModalProps {
    instance: WhatsAppInstanceResponse;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// ============================================================
// QR Code Generator
// ============================================================

/**
 * Simple QR Code canvas renderer using a CDN library
 * We'll use inline canvas drawing for simplicity
 */
async function renderQRCode(canvas: HTMLCanvasElement, text: string): Promise<void> {
    // Dynamically import qrcode library
    const QRCode = await import('qrcode');
    await QRCode.toCanvas(canvas, text, {
        width: 280,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#ffffff',
        },
    });
}

// ============================================================
// Main Component
// ============================================================

export const WhatsAppConnectModal: React.FC<WhatsAppConnectModalProps> = ({
    instance,
    open,
    onOpenChange,
}) => {
    const queryClient = useQueryClient();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // State
    const [countdown, setCountdown] = useState<number>(0);
    const [copied, setCopied] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Queries
    const connectQuery = useConnectInstance(instance.id);
    const stateQuery = useCheckInstanceState(instance.id);

    // Extract QR data
    const qrData = connectQuery.data;
    const pairingCode = qrData?.pairingCode || '';
    const expiresIn = qrData?.expires_in || 60;

    // Fetch QR code when modal opens
    const fetchQRCode = useCallback(async () => {
        setIsConnected(false);
        await connectQuery.refetch();
    }, [connectQuery]);

    // Initial fetch
    useEffect(() => {
        if (open) {
            fetchQRCode();
        }
    }, [open, fetchQRCode]);

    // Render QR code to canvas
    useEffect(() => {
        if (qrData?.code && canvasRef.current) {
            renderQRCode(canvasRef.current, qrData.code).catch(console.error);
            setCountdown(expiresIn);
        }
    }, [qrData?.code, expiresIn]);

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0 || isConnected) return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown, isConnected]);

    // Poll for connection status every 3 seconds
    useEffect(() => {
        if (!open || isConnected || !qrData) return;

        const pollInterval = setInterval(async () => {
            const result = await stateQuery.refetch();
            if (result.data?.status === 'connected') {
                setIsConnected(true);
                toast.success('WhatsApp conectado com sucesso!');
                queryClient.invalidateQueries({ queryKey: whatsAppInstancesKeys.lists() });
                queryClient.invalidateQueries({ queryKey: whatsAppInstancesKeys.detail(instance.id) });
                clearInterval(pollInterval);
            }
        }, 3000);

        return () => clearInterval(pollInterval);
    }, [open, isConnected, qrData, stateQuery, queryClient, instance.id]);

    // Copy pairing code
    const handleCopyPairingCode = () => {
        if (pairingCode) {
            navigator.clipboard.writeText(pairingCode);
            setCopied(true);
            toast.success('Código copiado!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Format pairing code for display (with spaces)
    const formattedPairingCode = pairingCode
        ? pairingCode.match(/.{1,4}/g)?.join(' ') || pairingCode
        : '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-green-600" />
                        Conectar WhatsApp
                    </DialogTitle>
                    <DialogDescription>
                        Escaneie o QR Code com o WhatsApp no seu celular ou use o código de pareamento.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Success State */}
                    {isConnected ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-green-600">
                                    WhatsApp Conectado!
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    A instância "{instance.name}" está pronta para enviar mensagens.
                                </p>
                            </div>
                            <Button onClick={() => onOpenChange(false)}>
                                Fechar
                            </Button>
                        </div>
                    ) : connectQuery.isFetching ? (
                        /* Loading State */
                        <div className="flex flex-col items-center gap-4 py-8">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">
                                Gerando QR Code...
                            </p>
                        </div>
                    ) : connectQuery.isError ? (
                        /* Error State */
                        <div className="flex flex-col items-center gap-4 py-8">
                            <div className="text-center">
                                <p className="text-destructive font-medium">
                                    Erro ao gerar QR Code
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Verifique se a API Key está configurada corretamente.
                                </p>
                            </div>
                            <Button onClick={fetchQRCode} variant="outline">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Tentar novamente
                            </Button>
                        </div>
                    ) : qrData ? (
                        /* QR Code Display */
                        <>
                            {/* QR Code */}
                            <div className="flex justify-center">
                                <div className="relative p-4 bg-white rounded-xl shadow-lg border">
                                    <canvas
                                        ref={canvasRef}
                                        className={cn(
                                            "rounded-lg",
                                            countdown <= 0 && "opacity-30"
                                        )}
                                    />
                                    {countdown <= 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Button onClick={fetchQRCode} size="sm">
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                Gerar novo
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Countdown */}
                            {countdown > 0 && (
                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                        Expira em <strong>{countdown}</strong> segundos
                                    </span>
                                </div>
                            )}

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        ou use o código
                                    </span>
                                </div>
                            </div>

                            {/* Pairing Code */}
                            {pairingCode && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-center gap-2">
                                        <code className="text-2xl font-mono font-bold tracking-widest bg-muted px-4 py-2 rounded-lg">
                                            {formattedPairingCode}
                                        </code>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handleCopyPairingCode}
                                            className="shrink-0"
                                        >
                                            {copied ? (
                                                <Check className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                                        <Smartphone className="h-3.5 w-3.5" />
                                        WhatsApp → Aparelhos conectados → Conectar aparelho
                                    </p>
                                </div>
                            )}

                            {/* Refresh Button */}
                            <div className="flex justify-center">
                                <Button
                                    variant="outline"
                                    onClick={fetchQRCode}
                                    disabled={connectQuery.isFetching}
                                >
                                    <RefreshCw className={cn(
                                        "h-4 w-4 mr-2",
                                        connectQuery.isFetching && "animate-spin"
                                    )} />
                                    Gerar novo QR Code
                                </Button>
                            </div>
                        </>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default WhatsAppConnectModal;
