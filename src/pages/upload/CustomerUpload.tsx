/**
 * Customer Upload Page
 * 
 * Mobile-first public page for customers to upload photos via QR code link.
 * No authentication required - uses upload token for security.
 */

import React, { useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
    Camera,
    Upload,
    Image,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Smartphone,
    X,
    Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { capasService } from '@/services/capas.service';

// ============================================================
// Types
// ============================================================

type UploadState = 'idle' | 'uploading' | 'success' | 'error' | 'expired' | 'no-token';

// ============================================================
// Component
// ============================================================

const CustomerUpload: React.FC = () => {
    const { capaId } = useParams<{ capaId: string }>();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const [uploadState, setUploadState] = useState<UploadState>(
        token ? 'idle' : 'no-token'
    );
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setErrorMessage('Por favor, selecione uma imagem válida.');
                return;
            }
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setErrorMessage('A imagem deve ter no máximo 10MB.');
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setErrorMessage(null);
        }
    }, []);

    const handleRemoveFile = useCallback(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    }, []);

    const handleUpload = async () => {
        if (!selectedFile || !capaId || !token) return;

        setUploadState('uploading');
        setErrorMessage(null);

        try {
            // Use public upload endpoint with token
            await capasService.uploadPublic(parseInt(capaId), selectedFile, token);
            setUploadState('success');
        } catch (error) {
            console.error('Upload error:', error);

            const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';

            // Check for specific errors
            if (errorMsg.includes('expirado') || errorMsg.includes('inválido')) {
                setUploadState('expired');
                setErrorMessage('O link expirou. Solicite um novo QR code.');
            } else if (errorMsg.includes('já possui')) {
                setUploadState('error');
                setErrorMessage('Esta capa já tem uma foto.');
            } else {
                setUploadState('error');
                setErrorMessage(errorMsg);
            }
        }
    };

    // Success state
    if (uploadState === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
                <Card className="w-full max-w-sm text-center animate-fade-in">
                    <CardContent className="pt-8 pb-8 space-y-4">
                        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-emerald-600">
                            Foto Enviada!
                        </h2>
                        <p className="text-muted-foreground">
                            Sua foto foi enviada com sucesso.
                            <br />
                            Obrigado!
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Expired token state
    if (uploadState === 'expired') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background flex items-center justify-center p-4">
                <Card className="w-full max-w-sm text-center">
                    <CardContent className="pt-8 pb-8 space-y-4">
                        <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
                            <Clock className="h-10 w-10 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-amber-600">
                            Link Expirado
                        </h2>
                        <p className="text-muted-foreground">
                            Este link de envio expirou.
                            <br />
                            Solicite um novo QR code na loja.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // No token state
    if (uploadState === 'no-token') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-red-50 to-background flex items-center justify-center p-4">
                <Card className="w-full max-w-sm text-center">
                    <CardContent className="pt-8 pb-8 space-y-4">
                        <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle className="h-10 w-10 text-red-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-red-600">
                            Link Inválido
                        </h2>
                        <p className="text-muted-foreground">
                            Este link não possui um token de acesso.
                            <br />
                            Escaneie o QR code novamente.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background p-4">
            <div className="max-w-sm mx-auto space-y-6 pt-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <Smartphone className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">Envie sua Foto</h1>
                    <p className="text-muted-foreground text-sm">
                        Pedido #{capaId}
                    </p>
                </div>

                {/* Hidden file inputs */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Error message */}
                {errorMessage && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                )}

                {/* Preview or upload options */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Image className="h-5 w-5 text-primary" />
                            Sua Foto
                        </CardTitle>
                        <CardDescription>
                            Tire uma foto ou selecione da galeria
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {previewUrl ? (
                            /* Preview */
                            <div className="relative">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-full h-64 object-contain rounded-lg border bg-muted"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={handleRemoveFile}
                                    disabled={uploadState === 'uploading'}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            /* Upload options */
                            <div className="grid gap-3">
                                <Button
                                    size="lg"
                                    className="h-16 gap-3 text-base"
                                    onClick={() => cameraInputRef.current?.click()}
                                >
                                    <Camera className="h-6 w-6" />
                                    Tirar Foto
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-16 gap-3 text-base"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-6 w-6" />
                                    Escolher da Galeria
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Submit button */}
                {previewUrl && (
                    <Button
                        size="lg"
                        className="w-full h-14 text-lg gap-2"
                        onClick={handleUpload}
                        disabled={uploadState === 'uploading'}
                    >
                        {uploadState === 'uploading' ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Upload className="h-5 w-5" />
                                Enviar Foto
                            </>
                        )}
                    </Button>
                )}

                {/* Footer */}
                <p className="text-xs text-center text-muted-foreground">
                    Ao enviar, você confirma que tem os direitos sobre esta imagem.
                </p>
            </div>
        </div>
    );
};

export default CustomerUpload;
