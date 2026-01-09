/**
 * Login Page
 * 
 * Beautiful animated authentication page with logo.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLogin } from '@/hooks/api/use-auth';
import { loginSchema, type LoginFormData } from '@/schemas/auth.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const loginMutation = useLogin();
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
    const [previousImage, setPreviousImage] = useState<string>('/assets/10.webp');
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Avatar image mapping
    const AVATAR_IMAGES = {
        default: '/assets/avatars/10.webp',
        email: '/assets/avatars/1.webp',
        password: '/assets/avatars/2.webp',
        error: '/assets/avatars/4.webp',
        submitting: '/assets/avatars/6.webp',
        peek: '/assets/avatars/11.webp',
    } as const;

    // Animation delays
    useEffect(() => {
        setMounted(true);
    }, []);

    // Get redirect path from location state or default to dashboard
    const from = (location.state as { from?: string })?.from || '/';

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const email = watch('email');
    const password = watch('password');

    // Logic to determine which image to show
    const getAvatarImage = (): string => {
        // 1. Submitting
        if (loginMutation.isPending || isSubmitting) return AVATAR_IMAGES.submitting;

        // 2. Error State (if any field has error)
        if (errors.email || errors.password) return AVATAR_IMAGES.error;

        // 3. Show Password (Peeking)
        if (showPassword && password) return AVATAR_IMAGES.peek;

        // 4. Focus Password (Hiding/Secret)
        if (focusedField === 'password') return AVATAR_IMAGES.password;

        // 5. Focus Email (Writing)
        if (focusedField === 'email') return AVATAR_IMAGES.email;

        // 6. Default
        return AVATAR_IMAGES.default;
    };

    const currentImage = getAvatarImage();

    // Handle smooth image transitions
    useEffect(() => {
        if (previousImage !== currentImage) {
            setIsTransitioning(true);
            const timer = setTimeout(() => {
                setPreviousImage(currentImage);
                setIsTransitioning(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [currentImage, previousImage]);

    const onSubmit = async (data: LoginFormData) => {
        try {
            await loginMutation.mutateAsync({
                email: data.email,
                password: data.password,
            });
            navigate(from, { replace: true });
        } catch {
            // Error is handled by the mutation hook
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Gradient Orbs */}
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/30 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute top-1/2 -right-40 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-blue-500/25 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Floating Particles */}
                {[...Array(20)].map((_, i) => (
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

                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                    }}
                />
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
                    <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl pt-0 px-8 pb-8 shadow-2xl overflow-hidden">
                        {/* Glow effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-purple-500/50 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity" />

                        <div className="relative">
                            {/* Dynamic Avatar - Full Width */}
                            <div
                                className={cn(
                                    "relative w-full mb-6 transition-all duration-700",
                                    mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
                                )}
                            >
                                <div
                                    className={cn(
                                        "relative w-full",
                                        isTransitioning && "animate-avatar-bounce"
                                    )}
                                >
                                    {/* Soft radial glow - ultra light and smoky */}
                                    <div
                                        className={cn(
                                            "absolute inset-0 transition-all duration-700",
                                            "rounded-full blur-3xl scale-150 -translate-y-4"
                                        )}
                                        style={{
                                            background: (errors.email || errors.password)
                                                ? "radial-gradient(ellipse at center, rgba(254,205,211,0.8) 0%, rgba(254,205,211,0) 70%)"
                                                : loginMutation.isPending
                                                    ? "radial-gradient(ellipse at center, rgba(254,243,199,0.8) 0%, rgba(254,243,199,0) 70%)"
                                                    : showPassword && password
                                                        ? "radial-gradient(ellipse at center, rgba(224,242,254,0.8) 0%, rgba(224,242,254,0) 70%)"
                                                        : focusedField === 'email'
                                                            ? "radial-gradient(ellipse at center, rgba(209,250,229,0.8) 0%, rgba(209,250,229,0) 70%)"
                                                            : focusedField === 'password'
                                                                ? "radial-gradient(ellipse at center, rgba(254,243,199,0.8) 0%, rgba(254,243,199,0) 70%)"
                                                                : "radial-gradient(ellipse at center, rgba(243,232,255,0.6) 0%, rgba(243,232,255,0) 70%)"
                                        }}
                                    />

                                    {/* Avatar container - full width, auto height for rectangles */}
                                    <div className="relative w-full">
                                        {/* Previous image (fading out) */}
                                        <img
                                            src={previousImage}
                                            alt=""
                                            className={cn(
                                                "absolute inset-0 w-full h-full object-contain transition-all duration-300 ease-out",
                                                isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
                                            )}
                                        />
                                        {/* Current image (fading in) */}
                                        <img
                                            src={currentImage}
                                            alt="MaisCapinhas Avatar"
                                            className={cn(
                                                "relative w-full h-auto object-contain transition-all duration-300 ease-out",
                                                isTransitioning ? "opacity-100 scale-100 animate-avatar-bounce" : "opacity-100 scale-100",
                                                "group-hover:scale-[1.02]",
                                                (errors.email || errors.password) && "animate-wobble"
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>


                            {/* Form */}
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                {/* Email Field */}
                                <div
                                    className={cn(
                                        "space-y-2 transition-all duration-700 delay-400",
                                        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                    )}
                                >
                                    <Label htmlFor="email" className="text-white/80 text-sm font-medium">
                                        Email
                                    </Label>
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="seu@email.com"
                                            autoComplete="email"
                                            disabled={loginMutation.isPending}
                                            className={cn(
                                                "relative bg-white/5 border-white/10 text-white placeholder:text-white/30",
                                                "focus:bg-white/10 focus:border-purple-500/50 focus:ring-purple-500/20",
                                                "transition-all duration-300 h-12 rounded-xl",
                                                email && "border-purple-500/30"
                                            )}
                                            {...register('email')}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-sm text-pink-400 animate-shake">{errors.email.message}</p>
                                    )}
                                </div>

                                {/* Password Field */}
                                <div
                                    className={cn(
                                        "space-y-2 transition-all duration-700 delay-500",
                                        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                    )}
                                >
                                    <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                                        Senha
                                    </Label>
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity" />
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            disabled={loginMutation.isPending}
                                            className={cn(
                                                "relative bg-white/5 border-white/10 text-white placeholder:text-white/30",
                                                "focus:bg-white/10 focus:border-purple-500/50 focus:ring-purple-500/20",
                                                "transition-all duration-300 h-12 rounded-xl pr-12",
                                                password && "border-purple-500/30"
                                            )}
                                            {...register('password')}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-sm text-pink-400 animate-shake">{errors.password.message}</p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div
                                    className={cn(
                                        "pt-2 transition-all duration-700 delay-600",
                                        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                    )}
                                >
                                    <Button
                                        type="submit"
                                        className={cn(
                                            "w-full h-12 rounded-xl font-semibold text-base",
                                            "bg-gradient-to-r from-purple-600 to-pink-600",
                                            "hover:from-purple-500 hover:to-pink-500",
                                            "shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40",
                                            "transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]",
                                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                        )}
                                        disabled={loginMutation.isPending || isSubmitting}
                                    >
                                        {loginMutation.isPending ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Entrando...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <LogIn className="w-5 h-5" />
                                                Entrar
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </form>

                            {/* Footer Link */}
                            <div
                                className={cn(
                                    "mt-6 text-center transition-all duration-700 delay-700",
                                    mounted ? "opacity-100" : "opacity-0"
                                )}
                            >
                                <button
                                    type="button"
                                    className="text-sm text-white/40 hover:text-white/80 transition-colors"
                                    onClick={() => navigate('/forgot-password')}
                                >
                                    Esqueceu sua senha?
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Text */}
                    <p
                        className={cn(
                            "text-center text-white/30 text-xs mt-6 transition-all duration-700 delay-1000",
                            mounted ? "opacity-100" : "opacity-0"
                        )}
                    >
                        © 2026 MaisCapinhas. Todos os direitos reservados.
                    </p>
                </div>
            </div>

            {/* Custom Styles */}
            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes avatar-bounce {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(0.95); }
          50% { transform: scale(1.05); }
          75% { transform: scale(0.98); }
        }
        .animate-avatar-bounce {
          animation: avatar-bounce 0.4s ease-out;
        }
        @keyframes gentle-wobble {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-2deg); }
          75% { transform: rotate(2deg); }
        }
        .animate-wobble {
          animation: gentle-wobble 2s ease-in-out infinite;
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; filter: blur(16px); }
          50% { opacity: 0.7; filter: blur(20px); }
        }
        .animate-glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};

export default Login;
