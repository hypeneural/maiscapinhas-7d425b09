import { z } from 'zod';

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email é obrigatório')
        .email('Email inválido'),
    password: z
        .string()
        .min(1, 'Senha é obrigatória'),
    device_name: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Forgot password form validation schema
 */
export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, 'Email é obrigatório')
        .email('Email inválido'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password form validation schema
 */
export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token é obrigatório'),
    email: z.string().email('Email inválido'),
    password: z
        .string()
        .min(8, 'Senha deve ter no mínimo 8 caracteres'),
    password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
    message: 'As senhas não conferem',
    path: ['password_confirmation'],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Change password form validation schema
 */
export const changePasswordSchema = z.object({
    current_password: z
        .string()
        .min(1, 'Senha atual é obrigatória'),
    password: z
        .string()
        .min(8, 'Nova senha deve ter no mínimo 8 caracteres'),
    password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
    message: 'As senhas não conferem',
    path: ['password_confirmation'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
