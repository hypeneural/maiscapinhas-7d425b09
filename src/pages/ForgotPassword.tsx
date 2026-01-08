/**
 * Forgot Password Page
 * 
 * Password recovery page with email validation.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForgotPassword } from '@/hooks/api/use-auth';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/schemas/auth.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const forgotMutation = useForgotPassword();
    const [mounted, setMounted] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    });

    const email = watch('email');

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            await forgotMutation.mutateAsync(data.email);
            setEmailSent(true);
        } catch {
            // Error handled by mutation
        }
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

                            {emailSent ? (
                                /* Success State */
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
                                /* Form State */
                                <>
                                    <div className="text-center mb-6">
                                        <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                                            <Sparkles className="w-5 h-5 text-purple-400" />
                                            Recuperar Senha
                                        </h1>
                                        <p className="text-white/60 text-sm">
                                            Digite seu email para receber as instruções
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                                                    disabled={forgotMutation.isPending}
                                                    className={cn(
                                                        "relative bg-white/5 border-white/10 text-white placeholder:text-white/30",
                                                        "focus:bg-white/10 focus:border-purple-500/50",
                                                        "transition-all duration-300 h-12 rounded-xl",
                                                        email && "border-purple-500/30"
                                                    )}
                                                    {...register('email')}
                                                />
                                            </div>
                                            {errors.email && (
                                                <p className="text-sm text-pink-400">{errors.email.message}</p>
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
                                            disabled={forgotMutation.isPending}
                                        >
                                            {forgotMutation.isPending ? (
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

                                    <div className="mt-6 text-center">
                                        <button
                                            type="button"
                                            className="text-sm text-white/40 hover:text-white/80 transition-colors flex items-center gap-2 mx-auto"
                                            onClick={() => navigate('/login')}
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Voltar ao Login
                                        </button>
                                    </div>
                                </>
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
