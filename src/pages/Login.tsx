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
import { Loader2, LogIn, Eye, EyeOff, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const loginMutation = useLogin();
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);

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

    const onSubmit = async (data: LoginFormData) => {
        try {
            await loginMutation.mutateAsync(data);
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
                    <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
                        {/* Glow effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-purple-500/50 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity" />

                        <div className="relative">
                            {/* Logo */}
                            <div
                                className={cn(
                                    "flex justify-center mb-8 transition-all duration-700 delay-200",
                                    mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
                                )}
                            >
                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" />
                                    <img
                                        src="/logo.png"
                                        alt="MaisCapinhas"
                                        className="relative w-32 h-32 object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>
                            </div>

                            {/* Title */}
                            <div
                                className={cn(
                                    "text-center mb-8 transition-all duration-700 delay-300",
                                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                )}
                            >
                                <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center justify-center gap-2">
                                    <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                                    MaisCapinhas ERP
                                    <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                                </h1>
                                <p className="text-white/60">Faça login para continuar</p>
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
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
        </div>
    );
};

export default Login;
