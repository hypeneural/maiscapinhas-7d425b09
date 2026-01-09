/**
 * ImageUpload Component
 * 
 * A reusable image upload component with drag & drop, preview, and validation.
 * Supports both circular (avatar) and rectangular (photo) variants.
 */

import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

export interface ImageUploadProps {
    /** Current image URL */
    value?: string | null;
    /** Callback when file is selected */
    onChange: (file: File) => void;
    /** Callback to remove image */
    onRemove?: () => void;
    /** Accepted file types */
    accept?: string;
    /** Maximum file size in bytes */
    maxSize?: number;
    /** Minimum dimensions */
    minDimension?: { width: number; height: number };
    /** Display variant */
    variant?: 'circle' | 'rectangle';
    /** Size of the component */
    size?: 'sm' | 'md' | 'lg';
    /** Loading state */
    loading?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Custom placeholder text */
    placeholder?: string;
    /** Custom class name */
    className?: string;
}

// ============================================================
// Component
// ============================================================

const sizeClasses = {
    sm: { container: 'w-20 h-20', icon: 'h-6 w-6' },
    md: { container: 'w-32 h-32', icon: 'h-8 w-8' },
    lg: { container: 'w-48 h-48', icon: 'h-10 w-10' },
};

const rectangleSizeClasses = {
    sm: { container: 'w-32 h-24', icon: 'h-6 w-6' },
    md: { container: 'w-48 h-36', icon: 'h-8 w-8' },
    lg: { container: 'w-64 h-48', icon: 'h-10 w-10' },
};

export function ImageUpload({
    value,
    onChange,
    onRemove,
    accept = 'image/jpeg,image/png,image/webp',
    maxSize = 2 * 1024 * 1024, // 2MB default
    minDimension,
    variant = 'circle',
    size = 'md',
    loading = false,
    disabled = false,
    placeholder = 'Clique ou arraste',
    className,
}: ImageUploadProps) {
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const sizes = variant === 'circle' ? sizeClasses[size] : rectangleSizeClasses[size];

    // Validate file
    const validateFile = useCallback(async (file: File): Promise<boolean> => {
        setError(null);

        // Check type
        const allowedTypes = accept.split(',').map(t => t.trim());
        if (!allowedTypes.includes(file.type)) {
            setError('Formato de arquivo inválido');
            return false;
        }

        // Check size
        if (file.size > maxSize) {
            const maxMB = (maxSize / (1024 * 1024)).toFixed(1);
            setError(`Arquivo muito grande. Máximo: ${maxMB}MB`);
            return false;
        }

        // Check dimensions
        if (minDimension) {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = URL.createObjectURL(file);
                img.onload = () => {
                    URL.revokeObjectURL(img.src);
                    if (img.width < minDimension.width || img.height < minDimension.height) {
                        setError(`Dimensão mínima: ${minDimension.width}x${minDimension.height}px`);
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                };
                img.onerror = () => {
                    setError('Erro ao carregar imagem');
                    resolve(false);
                };
            });
        }

        return true;
    }, [accept, maxSize, minDimension]);

    // Handle file selection
    const handleFile = useCallback(async (file: File) => {
        const isValid = await validateFile(file);
        if (isValid) {
            // Create preview
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
            onChange(file);
        }
    }, [validateFile, onChange]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    // Handle drag events
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (disabled) return;

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    // Handle remove
    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        setError(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
        onRemove?.();
    };

    // Current display image
    const displayImage = preview || value;

    return (
        <div className={cn('flex flex-col items-center gap-2', className)}>
            {/* Upload Area */}
            <div
                className={cn(
                    'relative overflow-hidden border-2 border-dashed transition-all cursor-pointer',
                    'hover:border-primary/50 hover:bg-accent/50',
                    'flex items-center justify-center',
                    sizes.container,
                    variant === 'circle' ? 'rounded-full' : 'rounded-lg',
                    isDragging && 'border-primary bg-accent',
                    disabled && 'opacity-50 cursor-not-allowed',
                    error && 'border-destructive'
                )}
                onClick={() => !disabled && inputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={disabled}
                />

                {loading ? (
                    <Loader2 className={cn(sizes.icon, 'animate-spin text-muted-foreground')} />
                ) : displayImage ? (
                    <>
                        <img
                            src={displayImage}
                            alt="Preview"
                            className={cn(
                                'w-full h-full object-cover',
                                variant === 'circle' && 'rounded-full'
                            )}
                        />
                        {/* Overlay with remove button */}
                        <div
                            className={cn(
                                'absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity',
                                'flex items-center justify-center',
                                variant === 'circle' && 'rounded-full'
                            )}
                        >
                            {onRemove && (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={handleRemove}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground p-2">
                        {variant === 'circle' ? (
                            <Camera className={sizes.icon} />
                        ) : (
                            <ImageIcon className={sizes.icon} />
                        )}
                        {size !== 'sm' && (
                            <span className="text-xs text-center">{placeholder}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && (
                <p className="text-xs text-destructive text-center">{error}</p>
            )}

            {/* Helper text */}
            {!error && minDimension && !displayImage && (
                <p className="text-xs text-muted-foreground text-center">
                    Mínimo: {minDimension.width}x{minDimension.height}px
                </p>
            )}
        </div>
    );
}

export default ImageUpload;
