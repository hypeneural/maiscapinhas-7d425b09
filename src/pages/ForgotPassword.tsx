/**
 * Forgot Password Page
 * 
 * Multi-step password recovery with Email and WhatsApp options.
 * 
 * Flow:
 * 1. Choose method (Email or WhatsApp)
 * 2A. Email: Enter email → Success message
 * 2B. WhatsApp: Enter email/phone → Request code
 * 3B. WhatsApp: Enter code + new password → Reset password
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    useForgotPassword,
    useForgotPasswordWhatsApp,
    useResetPasswordWithCode
} from '@/hooks/api/use-auth';
import {
    forgotPasswordSchema,
    forgotPasswordWhatsAppSchema,
    resetPasswordWithCodeSchema,
    type ForgotPasswordFormData,
    type ForgotPasswordWhatsAppFormData,
    type ResetPasswordWithCodeFormData,
} from '@/schemas/auth.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
    Loader2,
    Mail,
    ArrowLeft,
    CheckCircle,
    Sparkles,
    MessageCircle,
    Eye,
    EyeOff,
    RefreshCw,
    Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RecoveryMethod = 'choose' | 'email' | 'whatsapp';
type WhatsAppStep = 'request' | 'verify';

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();

    // Mutations
    const forgotEmailMutation = useForgotPassword();
    const forgotWhatsAppMutation = useForgotPasswordWhatsApp();
    const resetWithCodeMutation = useResetPasswordWithCode();

    // UI State
    const [mounted, setMounted] = useState(false);
    const [method, setMethod] = useState<RecoveryMethod>('choose');
    const [whatsappStep, setWhatsappStep] = useState<WhatsAppStep>('request');
    const [emailSent, setEmailSent] = useState(false);
    const [phoneMasked, setPhoneMasked] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userWhatsapp, setUserWhatsapp] = useState('');

    // Timer state
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Countdown timer for code expiration
    useEffect(() => {
        if (!expiresAt) return;

        const interval = setInterval(() => {
            const now = new Date();
            const diff = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
            setTimeLeft(diff);

            if (diff <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;

        const interval = setInterval(() => {
            setResendCooldown(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [resendCooldown]);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Email form
    const emailForm = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    });

    // WhatsApp request form
    const whatsappRequestForm = useForm<ForgotPasswordWhatsAppFormData>({
        resolver: zodResolver(forgotPasswordWhatsAppSchema),
        defaultValues: { email: '', whatsapp: '' },
    });

    // Reset password with code form
    const resetCodeForm = useForm<ResetPasswordWithCodeFormData>({
        resolver: zodResolver(resetPasswordWithCodeSchema),
        defaultValues: {
            code: '',
            email: '',
            password: '',
            password_confirmation: ''
        },
    });

    // Handlers
    const handleEmailSubmit = async (data: ForgotPasswordFormData) => {
        try {
            await forgotEmailMutation.mutateAsync(data.email);
            setEmailSent(true);
        } catch {
            // Error handled by mutation
        }
    };

    const handleWhatsAppRequest = async (data: ForgotPasswordWhatsAppFormData) => {
        try {
            const emailValue = data.email && data.email.trim() !== '' ? data.email.trim() : undefined;
            const whatsappValue = data.whatsapp && data.whatsapp.trim() !== '' ? data.whatsapp.trim() : undefined;

            const result = await forgotWhatsAppMutation.mutateAsync({
                email: emailValue,
                whatsapp: whatsappValue,
            });

            // Store data for next step - preserve both identifiers
            setPhoneMasked(result.phone_masked);
            setUserEmail(emailValue || '');
            setUserWhatsapp(whatsappValue || '');

            // Set expiration timer
            const expires = new Date();
            expires.setMinutes(expires.getMinutes() + result.expires_in_minutes);
            setExpiresAt(expires);
            setTimeLeft(result.expires_in_minutes * 60);

            // Update form for next step - email is required for reset
            // If user used whatsapp, we need to get email from the backend response or ask for it
            // For now, if they provided email, use it; otherwise they'll need to enter it
            if (emailValue) {
                resetCodeForm.setValue('email', emailValue);
            }

            // Move to verify step
            setWhatsappStep('verify');
            setResendCooldown(60);
        } catch {
            // Error handled by mutation
        }
    };

    const handleResetWithCode = async (data: ResetPasswordWithCodeFormData) => {
        try {
            await resetWithCodeMutation.mutateAsync(data);
            // Navigation happens in the hook
        } catch {
            // Error handled by mutation
        }
    };

    const handleResendCode = useCallback(async () => {
        if (resendCooldown > 0) return;

        try {
            // Use whichever identifier we have
            const result = await forgotWhatsAppMutation.mutateAsync({
                email: userEmail || undefined,
                whatsapp: userWhatsapp || undefined,
            });

            // Reset timer
            const expires = new Date();
            expires.setMinutes(expires.getMinutes() + result.expires_in_minutes);
            setExpiresAt(expires);
            setTimeLeft(result.expires_in_minutes * 60);
            setResendCooldown(60);

            // Clear code input
            resetCodeForm.setValue('code', '');
        } catch {
            // Error handled by mutation
        }
    }, [forgotWhatsAppMutation, userEmail, userWhatsapp, resendCooldown, resetCodeForm]);

    const handleBack = () => {
        if (method === 'choose') {
            navigate('/login');
        } else if (whatsappStep === 'verify') {
            setWhatsappStep('request');
        } else {
            setMethod('choose');
            setEmailSent(false);
        }
    };

    // Render method choice screen
    const renderMethodChoice = () => (
        <div className="space-y-4">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Recuperar Senha
                </h1>
                <p className="text-white/60 text-sm">
                    Escolha como deseja receber as instruções
                </p>
            </div>

            {/* Email Option */}
            <button
                type="button"
                onClick={() => setMethod('email')}
                className={cn(
                    "w-full p-4 rounded-xl border transition-all duration-300",
                    "bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50",
                    "flex items-center gap-4 text-left group"
                )}
            >
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                    <Mail className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-white font-medium">Receber por Email</h3>
                    <p className="text-white/50 text-sm">Link de recuperação enviado por email</p>
                </div>
            </button>

            {/* WhatsApp Option */}
            <button
                type="button"
                onClick={() => setMethod('whatsapp')}
                className={cn(
                    "w-full p-4 rounded-xl border transition-all duration-300",
                    "bg-white/5 border-white/10 hover:bg-white/10 hover:border-green-500/50",
                    "flex items-center gap-4 text-left group"
                )}
            >
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                    <MessageCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-white font-medium">Receber por WhatsApp</h3>
                    <p className="text-white/50 text-sm">Código de 6 dígitos enviado via WhatsApp</p>
                </div>
            </button>
        </div>
    );

    // Render email form
    const renderEmailForm = () => (
        <>
            {emailSent ? (
                <div className="text-center animate-fade-in">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Email Enviado!</h2>
                    <p className="text-white/60 mb-6">
                        Verifique sua caixa de entrada para redefinir sua senha.
                    </p>
                    <Button
                        onClick={() => navigate('/login')}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar ao Login
                    </Button>
                </div>
            ) : (
                <>
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                            <Mail className="w-5 h-5 text-purple-400" />
                            Recuperar por Email
                        </h1>
                        <p className="text-white/60 text-sm">
                            Digite seu email para receber as instruções
                        </p>
                    </div>

                    <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-white/80 text-sm">
                                Email
                            </Label>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    autoComplete="email"
                                    disabled={forgotEmailMutation.isPending}
                                    className={cn(
                                        "relative bg-white/5 border-white/10 text-white placeholder:text-white/30",
                                        "focus:bg-white/10 focus:border-purple-500/50",
                                        "transition-all duration-300 h-12 rounded-xl"
                                    )}
                                    {...emailForm.register('email')}
                                />
                            </div>
                            {emailForm.formState.errors.email && (
                                <p className="text-sm text-pink-400">{emailForm.formState.errors.email.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className={cn(
                                "w-full h-12 rounded-xl font-semibold",
                                "bg-gradient-to-r from-purple-600 to-pink-600",
                                "hover:from-purple-500 hover:to-pink-500",
                                "shadow-lg shadow-purple-500/25",
                                "transition-all duration-300"
                            )}
                            disabled={forgotEmailMutation.isPending}
                        >
                            {forgotEmailMutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Enviando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Mail className="w-5 h-5" />
                                    Enviar Email
                                </span>
                            )}
                        </Button>
                    </form>
                </>
            )}
        </>
    );

    // Render WhatsApp request form
    const renderWhatsAppRequest = () => (
        <>
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    Recuperar via WhatsApp
                </h1>
                <p className="text-white/60 text-sm">
                    Enviaremos um código de 6 dígitos para o WhatsApp cadastrado
                </p>
            </div>

            <form onSubmit={whatsappRequestForm.handleSubmit(handleWhatsAppRequest)} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="whatsapp-email" className="text-white/80 text-sm">
                        Email
                    </Label>
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                        <Input
                            id="whatsapp-email"
                            type="email"
                            placeholder="seu@email.com"
                            autoComplete="email"
                            disabled={forgotWhatsAppMutation.isPending}
                            className={cn(
                                "relative bg-white/5 border-white/10 text-white placeholder:text-white/30",
                                "focus:bg-white/10 focus:border-green-500/50",
                                "transition-all duration-300 h-12 rounded-xl"
                            )}
                            {...whatsappRequestForm.register('email')}
                        />
                    </div>
                    {whatsappRequestForm.formState.errors.email && (
                        <p className="text-sm text-pink-400">{whatsappRequestForm.formState.errors.email.message}</p>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-white/40 text-xs">ou</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="whatsapp-phone" className="text-white/80 text-sm">
                        Número do WhatsApp
                    </Label>
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                        <Input
                            id="whatsapp-phone"
                            type="tel"
                            placeholder="48999841150"
                            inputMode="numeric"
                            disabled={forgotWhatsAppMutation.isPending}
                            className={cn(
                                "relative bg-white/5 border-white/10 text-white placeholder:text-white/30",
                                "focus:bg-white/10 focus:border-green-500/50",
                                "transition-all duration-300 h-12 rounded-xl"
                            )}
                            {...whatsappRequestForm.register('whatsapp')}
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className={cn(
                        "w-full h-12 rounded-xl font-semibold",
                        "bg-gradient-to-r from-green-600 to-emerald-600",
                        "hover:from-green-500 hover:to-emerald-500",
                        "shadow-lg shadow-green-500/25",
                        "transition-all duration-300"
                    )}
                    disabled={forgotWhatsAppMutation.isPending}
                >
                    {forgotWhatsAppMutation.isPending ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Enviando...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            Enviar Código
                        </span>
                    )}
                </Button>
            </form>
        </>
    );

    // Render WhatsApp verify form (code + new password)
    const renderWhatsAppVerify = () => (
        <>
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    Digite o Código
                </h1>
                <p className="text-white/60 text-sm">
                    Enviamos um código para <span className="text-green-400 font-medium">{phoneMasked}</span>
                </p>
            </div>

            <form onSubmit={resetCodeForm.handleSubmit(handleResetWithCode)} className="space-y-5">
                {/* OTP Input */}
                <div className="space-y-2">
                    <Label className="text-white/80 text-sm">Código de Verificação</Label>
                    <div className="flex justify-center">
                        <InputOTP
                            maxLength={6}
                            value={resetCodeForm.watch('code')}
                            onChange={(value) => resetCodeForm.setValue('code', value)}
                            disabled={resetWithCodeMutation.isPending}
                        >
                            <InputOTPGroup className="gap-2">
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                    <InputOTPSlot
                                        key={index}
                                        index={index}
                                        className={cn(
                                            "w-11 h-12 text-lg font-bold border-white/20 bg-white/5 text-white",
                                            "first:rounded-l-xl last:rounded-r-xl",
                                            "focus:border-green-500 focus:ring-green-500"
                                        )}
                                    />
                                ))}
                            </InputOTPGroup>
                        </InputOTP>
                    </div>
                    {resetCodeForm.formState.errors.code && (
                        <p className="text-sm text-pink-400 text-center">{resetCodeForm.formState.errors.code.message}</p>
                    )}
                </div>

                {/* Timer */}
                {timeLeft > 0 && (
                    <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>Código expira em <span className="text-white font-mono">{formatTime(timeLeft)}</span></span>
                    </div>
                )}

                {/* Email field - visible if user entered via WhatsApp number */}
                {!userEmail && (
                    <div className="space-y-2">
                        <Label htmlFor="reset-email" className="text-white/80 text-sm">
                            Email da conta
                        </Label>
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                            <Input
                                id="reset-email"
                                type="email"
                                placeholder="seu@email.com"
                                autoComplete="email"
                                disabled={resetWithCodeMutation.isPending}
                                className={cn(
                                    "relative bg-white/5 border-white/10 text-white placeholder:text-white/30",
                                    "focus:bg-white/10 focus:border-green-500/50",
                                    "transition-all duration-300 h-12 rounded-xl"
                                )}
                                {...resetCodeForm.register('email')}
                            />
                        </div>
                        {resetCodeForm.formState.errors.email && (
                            <p className="text-sm text-pink-400">{resetCodeForm.formState.errors.email.message}</p>
                        )}
                    </div>
                )}

                {/* Hidden email field - when user entered via email */}
                {userEmail && (
                    <input type="hidden" {...resetCodeForm.register('email')} />
                )}

                {/* New Password */}
                <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-white/80 text-sm">
                        Nova Senha
                    </Label>
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                        <Input
                            id="new-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mínimo 8 caracteres"
                            autoComplete="new-password"
                            disabled={resetWithCodeMutation.isPending}
                            className={cn(
                                "relative bg-white/5 border-white/10 text-white placeholder:text-white/30",
                                "focus:bg-white/10 focus:border-green-500/50",
                                "transition-all duration-300 h-12 rounded-xl pr-12"
                            )}
                            {...resetCodeForm.register('password')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {resetCodeForm.formState.errors.password && (
                        <p className="text-sm text-pink-400">{resetCodeForm.formState.errors.password.message}</p>
                    )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-white/80 text-sm">
                        Confirmar Nova Senha
                    </Label>
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                        <Input
                            id="confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Repita a senha"
                            autoComplete="new-password"
                            disabled={resetWithCodeMutation.isPending}
                            className={cn(
                                "relative bg-white/5 border-white/10 text-white placeholder:text-white/30",
                                "focus:bg-white/10 focus:border-green-500/50",
                                "transition-all duration-300 h-12 rounded-xl pr-12"
                            )}
                            {...resetCodeForm.register('password_confirmation')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {resetCodeForm.formState.errors.password_confirmation && (
                        <p className="text-sm text-pink-400">{resetCodeForm.formState.errors.password_confirmation.message}</p>
                    )}
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className={cn(
                        "w-full h-12 rounded-xl font-semibold",
                        "bg-gradient-to-r from-green-600 to-emerald-600",
                        "hover:from-green-500 hover:to-emerald-500",
                        "shadow-lg shadow-green-500/25",
                        "transition-all duration-300"
                    )}
                    disabled={resetWithCodeMutation.isPending}
                >
                    {resetWithCodeMutation.isPending ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Redefinindo...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Redefinir Senha
                        </span>
                    )}
                </Button>

                {/* Resend Code */}
                <div className="text-center">
                    <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendCooldown > 0 || forgotWhatsAppMutation.isPending}
                        className={cn(
                            "text-sm transition-colors flex items-center gap-2 mx-auto",
                            resendCooldown > 0
                                ? "text-white/30 cursor-not-allowed"
                                : "text-white/60 hover:text-green-400"
                        )}
                    >
                        <RefreshCw className={cn(
                            "w-4 h-4",
                            forgotWhatsAppMutation.isPending && "animate-spin"
                        )} />
                        {resendCooldown > 0
                            ? `Reenviar em ${resendCooldown}s`
                            : 'Reenviar código'
                        }
                    </button>
                </div>
            </form>
        </>
    );

    // Render appropriate content based on state
    const renderContent = () => {
        if (method === 'choose') {
            return renderMethodChoice();
        }

        if (method === 'email') {
            return renderEmailForm();
        }

        if (method === 'whatsapp') {
            return whatsappStep === 'request'
                ? renderWhatsAppRequest()
                : renderWhatsAppVerify();
        }

        return null;
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/30 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute top-1/2 -right-40 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-blue-500/25 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${5 + Math.random() * 10}s`,
                        }}
                    />
                ))}
            </div>

            {/* Main Content */}
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div
                    className={cn(
                        "w-full max-w-md transition-all duration-1000 ease-out",
                        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    )}
                >
                    {/* Glass Card */}
                    <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
                        <div className="relative">
                            {/* Logo */}
                            <div className="flex justify-center mb-6">
                                <img
                                    src="/logo.png"
                                    alt="MaisCapinhas"
                                    className="w-20 h-20 object-contain drop-shadow-2xl"
                                />
                            </div>

                            {/* Dynamic Content */}
                            {renderContent()}

                            {/* Back Button */}
                            {!(method === 'email' && emailSent) && (
                                <div className="mt-6 text-center">
                                    <button
                                        type="button"
                                        className="text-sm text-white/40 hover:text-white/80 transition-colors flex items-center gap-2 mx-auto"
                                        onClick={handleBack}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        {method === 'choose' ? 'Voltar ao Login' : 'Voltar'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.2; }
                    50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
                }
                .animate-float {
                    animation: float 8s ease-in-out infinite;
                }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default ForgotPassword;
