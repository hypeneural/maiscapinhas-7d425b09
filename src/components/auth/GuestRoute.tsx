/**
 * Guest Route Component
 * 
 * Wraps routes that should only be accessible to non-authenticated users.
 * Redirects to dashboard if user is already logged in.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface GuestRouteProps {
    children: React.ReactNode;
    redirectTo?: string;
}

export const GuestRoute: React.FC<GuestRouteProps> = ({
    children,
    redirectTo = '/',
}) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                    <p className="text-white/60">Carregando...</p>
                </div>
            </div>
        );
    }

    // Redirect to dashboard (or previous location) if authenticated
    if (isAuthenticated) {
        const from = (location.state as { from?: string })?.from || redirectTo;
        return <Navigate to={from} replace />;
    }

    return <>{children}</>;
};

export default GuestRoute;
