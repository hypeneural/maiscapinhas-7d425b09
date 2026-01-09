/**
 * PWA Install Prompt Component
 * 
 * Shows a button to install the app when available.
 */

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show prompt after 30 seconds if user hasn't dismissed it
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            if (!dismissed) {
                setTimeout(() => setShowPrompt(true), 30000);
            }
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsInstalled(true);
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    // Don't show if already installed or no prompt available
    if (isInstalled || !showPrompt || !deferredPrompt) {
        return null;
    }

    return (
        <div
            className={cn(
                'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80',
                'bg-card border border-border rounded-lg shadow-lg p-4',
                'animate-in slide-in-from-bottom-4 duration-300',
                'z-50'
            )}
        >
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
            >
                <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Download className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">Instalar Mais Capinhas</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Instale o app para acesso rápido e experiência offline.
                    </p>
                    <Button
                        size="sm"
                        onClick={handleInstall}
                        className="mt-3 w-full"
                    >
                        Instalar App
                    </Button>
                </div>
            </div>
        </div>
    );
};

/**
 * Hook to check if app is installed as PWA
 */
export function useIsPWA(): boolean {
    const [isPWA, setIsPWA] = useState(false);

    useEffect(() => {
        setIsPWA(window.matchMedia('(display-mode: standalone)').matches);
    }, []);

    return isPWA;
}
