/**
 * Avatar Cropper Component
 * 
 * Professional avatar cropping modal using react-image-crop.
 * Forces square aspect ratio (1:1) for consistent avatar display.
 * Like modern ERPs and CRMs (Salesforce, HubSpot, etc.)
 */

import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface AvatarCropperProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageSrc: string;
    onCropComplete: (croppedBlob: Blob) => void;
    isLoading?: boolean;
}

// Minimum size for the crop area
const MIN_DIMENSION = 200;

// Generate center crop with 1:1 aspect ratio
function centerAspectCrop(mediaWidth: number, mediaHeight: number): Crop {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 80, // Start with 80% of the smaller dimension
            },
            1, // 1:1 aspect ratio for square avatar
            mediaWidth,
            mediaHeight
        ),
        mediaWidth,
        mediaHeight
    );
}

export const AvatarCropper: React.FC<AvatarCropperProps> = ({
    open,
    onOpenChange,
    imageSrc,
    onCropComplete,
    isLoading = false,
}) => {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [scale, setScale] = useState(1);
    const imgRef = useRef<HTMLImageElement>(null);

    // Initialize crop when image loads
    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        const crop = centerAspectCrop(naturalWidth, naturalHeight);
        setCrop(crop);
    }, []);

    // Reset state when modal opens
    React.useEffect(() => {
        if (open) {
            setScale(1);
            setCrop(undefined);
            setCompletedCrop(undefined);
        }
    }, [open]);

    // Handle zoom with slider
    const handleZoomChange = (values: number[]) => {
        setScale(values[0]);
    };

    // Reset zoom to default
    const handleResetZoom = () => {
        setScale(1);
    };

    // Generate cropped image blob
    const handleCropConfirm = useCallback(async () => {
        if (!completedCrop || !imgRef.current) return;

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Calculate the scale between natural and displayed size
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Set canvas size to the cropped area (minimum 200x200)
        const outputSize = Math.max(MIN_DIMENSION, Math.min(completedCrop.width * scaleX, 800));
        canvas.width = outputSize;
        canvas.height = outputSize;

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw the cropped portion
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            outputSize,
            outputSize
        );

        // Convert to blob
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    onCropComplete(blob);
                }
            },
            'image/jpeg',
            0.92 // High quality JPEG
        );
    }, [completedCrop, onCropComplete]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">Ajustar Foto</DialogTitle>
                    <DialogDescription>
                        Arraste para posicionar e ajuste o zoom. A foto será recortada em formato quadrado.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Crop Area */}
                    <div className="relative flex items-center justify-center bg-muted/50 rounded-lg overflow-hidden min-h-[300px] max-h-[400px]">
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={1} // Force 1:1 aspect ratio
                            minWidth={MIN_DIMENSION / 4} // Minimum crop size relative to displayed image
                            circularCrop={false} // Square crop for cleaner files, displayed as circle in UI
                            className="max-h-[400px]"
                        >
                            <img
                                ref={imgRef}
                                src={imageSrc}
                                alt="Imagem para recorte"
                                onLoad={onImageLoad}
                                style={{
                                    transform: `scale(${scale})`,
                                    maxHeight: '400px',
                                    width: 'auto',
                                }}
                                className="transition-transform duration-100"
                            />
                        </ReactCrop>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-4 px-2">
                        <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Slider
                            value={[scale]}
                            onValueChange={handleZoomChange}
                            min={0.5}
                            max={2}
                            step={0.1}
                            className="flex-1"
                        />
                        <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleResetZoom}
                            className="shrink-0"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Preview hint */}
                    <p className="text-xs text-muted-foreground text-center">
                        A foto será exibida como círculo no sistema, mas salva como quadrado para maior qualidade.
                    </p>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleCropConfirm}
                        disabled={isLoading || !completedCrop}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            'Aplicar'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AvatarCropper;
