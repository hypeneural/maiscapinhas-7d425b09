/**
 * ImagePreviewModal Component
 * 
 * Modal to preview capa images with basic details and action buttons.
 * Shows QR code and upload option when no photo exists.
 */

import React, { useState, useRef } from 'react';
import {
    X,
    User,
    Smartphone,
    Calendar,
    DollarSign,
    ExternalLink,
    QrCode,
    Upload,
    Copy,
    Check,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getStatusColorClasses } from '@/lib/constants/status.constants';
import { format, parseISO } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { useUploadCapaPhoto, useGenerateUploadToken } from '@/hooks/api/use-capas';
import type { CapaPersonalizada } from '@/types/capas.types';

export interface ImagePreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    capa: CapaPersonalizada | null;
    onViewDetails?: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
    open,
    onOpenChange,
    capa,
    onViewDetails,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [linkCopied, setLinkCopied] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadToken, setUploadToken] = useState<string | null>(null);
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);

    const uploadMutation = useUploadCapaPhoto();
    const generateTokenMutation = useGenerateUploadToken();

    // Generate token when modal opens for capa without photo
    React.useEffect(() => {
        if (open && capa && !capa.photo_url && !uploadToken && !isGeneratingToken) {
            setIsGeneratingToken(true);
            generateTokenMutation.mutateAsync(capa.id)
                .then((tokenData) => {
                    setUploadToken(tokenData.token);
                })
                .catch(() => {
                    // Silent fail
                })
                .finally(() => {
                    setIsGeneratingToken(false);
                });
        }

        // Reset token when modal closes
        if (!open) {
            setUploadToken(null);
        }
    }, [open, capa, uploadToken, isGeneratingToken]);

    if (!capa) return null;

    const formatCurrency = (value: number | null) => {
        if (value === null) return '-';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const getUploadLink = () => {
        const baseUrl = window.location.origin;
        if (uploadToken) {
            return `${baseUrl}/upload/${capa.id}?token=${uploadToken}`;
        }
        return `${baseUrl}/upload/${capa.id}`;
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(getUploadLink());
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch {
            // Fallback
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !capa.id) return;

        try {
            await uploadMutation.mutateAsync({ id: capa.id, file: selectedFile });
            setSelectedFile(null);
            setPreviewUrl(null);
            onOpenChange(false);
        } catch {
            // Error handled by mutation
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
                {/* Image/QR Section */}
                <div className="relative bg-muted">
                    {capa.photo_url ? (
                        /* Has photo - show image */
                        <img
                            src={capa.photo_url}
                            alt={capa.selected_product}
                            className="w-full h-64 sm:h-80 object-contain bg-black/5"
                        />
                    ) : (
                        /* No photo - show QR code + upload options */
                        <div className="w-full min-h-[280px] p-6 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-primary/5 to-background">
                            <div className="text-center space-y-2">
                                <QrCode className="h-8 w-8 mx-auto text-primary" />
                                <h3 className="font-semibold">Foto Pendente</h3>
                                <p className="text-sm text-muted-foreground">
                                    Escaneie para enviar a foto
                                </p>
                            </div>

                            {/* QR Code */}
                            <div className="p-4 bg-white rounded-lg shadow-sm">
                                <QRCodeSVG
                                    value={getUploadLink()}
                                    size={140}
                                    level="H"
                                    includeMargin
                                />
                            </div>

                            {/* Link with copy */}
                            <div className="w-full max-w-xs space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        value={getUploadLink()}
                                        readOnly
                                        className="flex-1 text-xs bg-white"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopyLink}
                                        className="gap-1"
                                    >
                                        {linkCopied ? (
                                            <Check className="h-3 w-3 text-emerald-600" />
                                        ) : (
                                            <Copy className="h-3 w-3" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* OR divider */}
                            <div className="relative w-full max-w-xs">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        ou
                                    </span>
                                </div>
                            </div>

                            {/* Upload button */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {previewUrl ? (
                                <div className="space-y-2 w-full max-w-xs">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-24 object-contain rounded border bg-white"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => {
                                                setSelectedFile(null);
                                                setPreviewUrl(null);
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="flex-1 gap-1"
                                            onClick={handleUpload}
                                            disabled={uploadMutation.isPending}
                                        >
                                            {uploadMutation.isPending ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Upload className="h-3 w-3" />
                                            )}
                                            Enviar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="gap-2"
                                >
                                    <Upload className="h-4 w-4" />
                                    Fazer upload agora
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Status badge overlay */}
                    <div className="absolute top-3 left-3">
                        <Badge
                            variant="secondary"
                            className={cn(
                                'border shadow-sm',
                                getStatusColorClasses(capa.status_color)
                            )}
                        >
                            {capa.status_label}
                        </Badge>
                    </div>

                    {/* Close button */}
                    <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-md"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Details Section */}
                <div className="p-4 space-y-4">
                    <DialogHeader className="p-0">
                        <DialogTitle className="text-lg font-semibold">
                            {capa.selected_product}
                        </DialogTitle>
                        {capa.product_reference && (
                            <p className="text-sm text-muted-foreground">
                                Ref: {capa.product_reference}
                            </p>
                        )}
                    </DialogHeader>

                    {/* Quick info grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {/* Customer */}
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{capa.customer?.name || '-'}</span>
                        </div>

                        {/* Device */}
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Smartphone className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                                {capa.customer_device?.display_name || 'Sem aparelho'}
                            </span>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>{format(parseISO(capa.created_at), 'dd/MM/yyyy')}</span>
                        </div>

                        {/* Payment */}
                        <div className="flex items-center gap-2">
                            <DollarSign
                                className={cn(
                                    'h-4 w-4 flex-shrink-0',
                                    capa.payed ? 'text-emerald-600' : 'text-amber-500'
                                )}
                            />
                            <span className={capa.payed ? 'text-emerald-600' : 'text-amber-500'}>
                                {capa.payed ? 'Pago' : 'Pendente'}
                            </span>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between py-3 border-t">
                        <span className="text-muted-foreground">Total</span>
                        <div className="text-right">
                            <span className="text-lg font-bold">
                                {formatCurrency(capa.total)}
                            </span>
                            <p className="text-xs text-muted-foreground">
                                {capa.qty}x {formatCurrency(capa.price)}
                            </p>
                        </div>
                    </div>

                    {/* Action button */}
                    <Button
                        className="w-full gap-2"
                        onClick={() => {
                            onOpenChange(false);
                            onViewDetails?.();
                        }}
                    >
                        <ExternalLink className="h-4 w-4" />
                        Ver Detalhes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ImagePreviewModal;
