/**
 * Unauthorized Page
 * 
 * Displayed when user tries to access a page they don't have permission for.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Unauthorized: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center max-w-md mx-auto px-4">
                <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                        <ShieldX className="h-8 w-8 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Acesso Negado
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Você não tem permissão para acessar esta página.
                        Entre em contato com o administrador se acredita que isso é um erro.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Button>
                    <Button asChild className="gap-2">
                        <Link to="/">
                            <Home className="h-4 w-4" />
                            Ir para Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
