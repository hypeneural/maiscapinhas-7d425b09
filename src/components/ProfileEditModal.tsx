/**
 * Profile Edit Modal
 * 
 * Modal for editing user profile: email, whatsapp, and avatar.
 * Opens when clicking on user avatar in the sidebar footer.
 * Features professional avatar cropping like modern ERPs/CRMs.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Trash2, Loader2, User, Crop } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile, useUpdateAvatar, useRemoveAvatar } from '@/hooks/api/use-profile';
import { AvatarCropper } from '@/components/AvatarCropper';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProfileEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (larger for cropping, final is smaller)
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function validateAvatarFile(file: File): string | null {
    if (file.size > MAX_FILE_SIZE) {
        return 'A imagem deve ter no máximo 5MB';
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
        return 'Formato inválido. Use JPG, PNG ou WebP';
    }
    return null;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
    open,
    onOpenChange,
}) => {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [email, setEmail] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
    const [errors, setErrors] = useState<{ email?: string; whatsapp?: string }>({});

    // Cropper state
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');

    // Mutations
    const updateProfile = useUpdateProfile();
    const updateAvatar = useUpdateAvatar();
    const removeAvatar = useRemoveAvatar();

    const isLoading = updateProfile.isPending || updateAvatar.isPending || removeAvatar.isPending;

    // Initialize form when modal opens
    useEffect(() => {
        if (open && user) {
            setEmail(user.email || '');
            setWhatsapp(user.whatsapp || '');
            setAvatarPreview(user.avatar_url || null);
            setCroppedBlob(null);
            setErrors({});
            setSelectedImageSrc('');
        }
    }, [open, user]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const error = validateAvatarFile(file);
        if (error) {
            toast.error(error);
            return;
        }

        // Open cropper with the selected image
        const imageUrl = URL.createObjectURL(file);
        setSelectedImageSrc(imageUrl);
        setCropperOpen(true);

        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCropComplete = (blob: Blob) => {
        setCroppedBlob(blob);
        setAvatarPreview(URL.createObjectURL(blob));
        setCropperOpen(false);

        // Cleanup
        if (selectedImageSrc) {
            URL.revokeObjectURL(selectedImageSrc);
            setSelectedImageSrc('');
        }
    };

    const handleRemoveAvatar = async () => {
        if (!user?.id) return;

        try {
            await removeAvatar.mutateAsync(user.id);
            setAvatarPreview(null);
            setCroppedBlob(null);
        } catch {
            // Error handled by hook
        }
    };

    const validateForm = (): boolean => {
        const newErrors: { email?: string; whatsapp?: string } = {};

        if (!email) {
            newErrors.email = 'Email é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Email inválido';
        }

        if (whatsapp && whatsapp.length > 20) {
            newErrors.whatsapp = 'WhatsApp deve ter no máximo 20 caracteres';
        }

        if (whatsapp && !/^[0-9]*$/.test(whatsapp)) {
            newErrors.whatsapp = 'WhatsApp deve conter apenas números';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !user?.id) return;

        try {
            // Update profile if changed
            const profileChanged = email !== user.email || whatsapp !== (user.whatsapp || '');
            if (profileChanged) {
                await updateProfile.mutateAsync({ email, whatsapp: whatsapp || undefined });
            }

            // Update avatar if new cropped image
            if (croppedBlob) {
                await updateAvatar.mutateAsync({ userId: user.id, file: croppedBlob });
            }

            onOpenChange(false);
        } catch {
            // Errors handled by hooks
        }
    };

    const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Editar Perfil</DialogTitle>
                        <DialogDescription>
                            Atualize suas informações de contato e foto de perfil.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <Avatar
                                    className={cn(
                                        "h-24 w-24 cursor-pointer transition-all duration-200",
                                        "ring-2 ring-offset-2 ring-offset-background",
                                        "ring-primary/20 group-hover:ring-primary/50"
                                    )}
                                    onClick={handleAvatarClick}
                                >
                                    {avatarPreview ? (
                                        <AvatarImage src={avatarPreview} alt={user?.name || 'Avatar'} />
                                    ) : null}
                                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                                        {userInitial}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Camera overlay */}
                                <div
                                    className={cn(
                                        "absolute inset-0 rounded-full bg-black/50 flex items-center justify-center",
                                        "opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    )}
                                    onClick={handleAvatarClick}
                                >
                                    <div className="flex flex-col items-center">
                                        <Camera className="h-5 w-5 text-white" />
                                        <span className="text-[10px] text-white mt-1">Alterar</span>
                                    </div>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                {/* Cropped indicator */}
                                {croppedBlob && (
                                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1">
                                        <Crop className="h-3 w-3" />
                                    </div>
                                )}
                            </div>

                            {/* Remove avatar button */}
                            {(avatarPreview || user?.avatar_url) && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemoveAvatar}
                                    disabled={isLoading}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remover foto
                                </Button>
                            )}

                            <p className="text-xs text-muted-foreground text-center">
                                Clique na foto para alterar. Você poderá recortar e ajustar.
                            </p>
                        </div>

                        {/* Name (read-only) */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Nome</Label>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 text-foreground">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{user?.name || 'Usuário'}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Para alterar o nome, contate um administrador.
                            </p>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                                }}
                                placeholder="seu@email.com"
                                className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
                            />
                            {errors.email && (
                                <p className="text-xs text-destructive">{errors.email}</p>
                            )}
                        </div>

                        {/* WhatsApp */}
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp">WhatsApp</Label>
                            <Input
                                id="whatsapp"
                                type="tel"
                                value={whatsapp}
                                onChange={(e) => {
                                    // Only allow numbers
                                    const value = e.target.value.replace(/\D/g, '');
                                    setWhatsapp(value);
                                    if (errors.whatsapp) setErrors((prev) => ({ ...prev, whatsapp: undefined }));
                                }}
                                placeholder="47999999999"
                                maxLength={20}
                                className={cn(errors.whatsapp && "border-destructive focus-visible:ring-destructive")}
                            />
                            {errors.whatsapp && (
                                <p className="text-xs text-destructive">{errors.whatsapp}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Apenas números, com DDD.
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
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    'Salvar'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Avatar Cropper Modal */}
            <AvatarCropper
                open={cropperOpen}
                onOpenChange={setCropperOpen}
                imageSrc={selectedImageSrc}
                onCropComplete={handleCropComplete}
                isLoading={false}
            />
        </>
    );
};

export default ProfileEditModal;
