/**
 * Profile Hooks
 * 
 * React Query hooks for user profile operations.
 * Handles profile update (email, whatsapp) and avatar upload/removal.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getToken } from '@/lib/api';
import { authKeys } from './use-auth';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/api';
import type { ApiResponse } from '@/types/api';

/**
 * Update profile request data
 */
interface UpdateProfileData {
    email?: string;
    whatsapp?: string;
}

/**
 * Avatar update response
 */
interface AvatarResponse {
    data: {
        user_id: number;
        avatar_url: string | null;
    };
    meta: {
        request_id: string;
        timestamp: string;
    };
}

/**
 * Hook to update user profile (email and whatsapp)
 * Uses PUT /api/v1/me with JSON body
 */
export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateProfileData) => {
            const response = await api.put<ApiResponse<unknown>>('/me', data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: authKeys.user() });
            toast.success('Perfil atualizado com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to update user avatar
 * Uses POST /api/v1/users/{id}/avatar with multipart/form-data
 * 
 * IMPORTANT: 
 * - Use POST method (backend accepts POST for file uploads)
 * - Field name must be "avatar"
 * - Do NOT set Content-Type manually (browser sets multipart boundary)
 */
export function useUpdateAvatar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, file }: { userId: number; file: File | Blob }) => {
            const formData = new FormData();
            
            // If it's a Blob (from canvas crop), convert to File
            if (file instanceof Blob && !(file instanceof File)) {
                formData.append('avatar', file, 'avatar.jpg');
            } else {
                formData.append('avatar', file);
            }

            // Use POST method directly (backend accepts POST for uploads)
            const response = await api.post<AvatarResponse>(
                `/users/${userId}/avatar`,
                formData
                // Do NOT set Content-Type - browser handles multipart boundary
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: authKeys.user() });
            toast.success('Foto atualizada com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to remove user avatar
 * Uses POST /api/v1/users/{id}/avatar with remove=true
 */
export function useRemoveAvatar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: number) => {
            const formData = new FormData();
            formData.append('remove', 'true');

            const response = await api.post<AvatarResponse>(
                `/users/${userId}/avatar`,
                formData
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: authKeys.user() });
            toast.success('Foto removida com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

