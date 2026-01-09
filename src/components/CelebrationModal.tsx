/**
 * Celebration Modal Component
 * 
 * Shows a celebration modal with confetti for birthdays and work anniversaries.
 * Only shows once per day per celebration type.
 */

import React, { useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Cake, PartyPopper, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

export type CelebrationType = 'birthday' | 'work_anniversary';

interface CelebrationModalProps {
    type: CelebrationType;
    userName: string;
    yearsAtCompany?: number;
    onClose: () => void;
}

// ============================================================
// Celebration Storage
// ============================================================

const STORAGE_PREFIX = 'celebration-shown-';

function getTodayKey(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export function hasShownToday(type: CelebrationType): boolean {
    const key = `${STORAGE_PREFIX}${type}-${getTodayKey()}`;
    return localStorage.getItem(key) === 'true';
}

export function markAsShown(type: CelebrationType): void {
    const key = `${STORAGE_PREFIX}${type}-${getTodayKey()}`;
    localStorage.setItem(key, 'true');
}

// ============================================================
// Date Check Utilities
// ============================================================

export function isBirthday(birthDate: string | null | undefined): boolean {
    if (!birthDate) return false;

    try {
        const today = new Date();
        const birth = new Date(birthDate);

        return today.getMonth() === birth.getMonth()
            && today.getDate() === birth.getDate();
    } catch {
        return false;
    }
}

export function isWorkAnniversary(hireDate: string | null | undefined): { isAnniversary: boolean; years: number } {
    if (!hireDate) return { isAnniversary: false, years: 0 };

    try {
        const today = new Date();
        const hire = new Date(hireDate);
        const years = today.getFullYear() - hire.getFullYear();

        // Must be at least 1 year and same month/day
        const isAnniversary = years > 0
            && today.getMonth() === hire.getMonth()
            && today.getDate() === hire.getDate();

        return { isAnniversary, years };
    } catch {
        return { isAnniversary: false, years: 0 };
    }
}

// ============================================================
// Confetti Functions
// ============================================================

function fireBirthdayConfetti() {
    const duration = 4000;
    const end = Date.now() + duration;

    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];

    (function frame() {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors,
        });
        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors,
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();

    // Big burst in the middle
    setTimeout(() => {
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors,
        });
    }, 500);
}

function fireAnniversaryConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#7c3aed', '#a855f7', '#fbbf24', '#10b981', '#3b82f6'];

    (function frame() {
        confetti({
            particleCount: 2,
            angle: 60,
            spread: 45,
            origin: { x: 0, y: 0.5 },
            colors,
            shapes: ['star'],
        });
        confetti({
            particleCount: 2,
            angle: 120,
            spread: 45,
            origin: { x: 1, y: 0.5 },
            colors,
            shapes: ['star'],
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();

    // Stars burst
    setTimeout(() => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.5 },
            colors,
            shapes: ['star'],
            scalar: 1.2,
        });
    }, 300);
}

// ============================================================
// Modal Component
// ============================================================

function CelebrationModal({ type, userName, yearsAtCompany = 1, onClose }: CelebrationModalProps) {
    const [isOpen, setIsOpen] = useState(true);
    const firstName = userName.split(' ')[0];

    useEffect(() => {
        // Fire confetti when modal opens
        if (type === 'birthday') {
            fireBirthdayConfetti();
        } else {
            fireAnniversaryConfetti();
        }

        // Mark as shown
        markAsShown(type);
    }, [type]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setTimeout(onClose, 200);
    }, [onClose]);

    const isBirthdayType = type === 'birthday';

    return (
        <Dialog open={isOpen} onOpenChange={() => handleClose()}>
            <DialogContent
                className={cn(
                    'max-w-md text-center border-2 overflow-hidden',
                    isBirthdayType
                        ? 'border-pink-500/50 bg-gradient-to-b from-pink-500/10 to-background'
                        : 'border-primary/50 bg-gradient-to-b from-primary/10 to-background'
                )}
            >
                {/* Decorative background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className={cn(
                        'absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-30',
                        isBirthdayType ? 'bg-pink-500' : 'bg-primary'
                    )} />
                    <div className={cn(
                        'absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30',
                        isBirthdayType ? 'bg-yellow-500' : 'bg-amber-500'
                    )} />
                </div>

                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted z-10"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* Content */}
                <div className="relative py-6">
                    {/* Icon */}
                    <div className={cn(
                        'w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center',
                        'animate-bounce',
                        isBirthdayType
                            ? 'bg-gradient-to-br from-pink-500 to-orange-500'
                            : 'bg-gradient-to-br from-primary to-amber-500'
                    )}>
                        {isBirthdayType ? (
                            <Cake className="h-12 w-12 text-white" />
                        ) : (
                            <PartyPopper className="h-12 w-12 text-white" />
                        )}
                    </div>

                    {/* Title */}
                    <h2 className={cn(
                        'text-2xl font-bold mb-2',
                        isBirthdayType
                            ? 'bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent'
                            : 'bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent'
                    )}>
                        {isBirthdayType ? '🎂 Feliz Aniversário!' : '🎉 Parabéns!'}
                    </h2>

                    {/* Message */}
                    <p className="text-lg text-muted-foreground mb-2">
                        {isBirthdayType ? (
                            <>
                                <span className="font-semibold text-foreground">{firstName}</span>,
                                desejamos um dia incrível cheio de alegrias!
                            </>
                        ) : (
                            <>
                                <span className="font-semibold text-foreground">{firstName}</span>,
                                você completou{' '}
                                <span className={cn(
                                    'font-bold',
                                    'bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent'
                                )}>
                                    {yearsAtCompany} {yearsAtCompany === 1 ? 'ano' : 'anos'}
                                </span>{' '}
                                na Mais Capinhas!
                            </>
                        )}
                    </p>

                    {/* Sub message */}
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Sparkles className="h-4 w-4" />
                        {isBirthdayType
                            ? 'Que esse novo ciclo seja repleto de conquistas!'
                            : 'Obrigado por fazer parte dessa família!'
                        }
                        <Sparkles className="h-4 w-4" />
                    </p>

                    {/* Button */}
                    <Button
                        onClick={handleClose}
                        className={cn(
                            'mt-6',
                            isBirthdayType
                                ? 'bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600'
                                : 'bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-600'
                        )}
                    >
                        {isBirthdayType ? 'Obrigado! 🥳' : 'Vamos em frente! 🚀'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================
// Hook to check and show celebrations
// ============================================================

interface CelebrationData {
    showBirthday: boolean;
    showAnniversary: boolean;
    yearsAtCompany: number;
}

export function useCelebrationCheck(
    birthDate: string | null | undefined,
    hireDate: string | null | undefined
): CelebrationData {
    const [data, setData] = useState<CelebrationData>({
        showBirthday: false,
        showAnniversary: false,
        yearsAtCompany: 0,
    });

    useEffect(() => {
        // Check birthday
        const shouldShowBirthday = isBirthday(birthDate) && !hasShownToday('birthday');

        // Check work anniversary
        const anniversaryCheck = isWorkAnniversary(hireDate);
        const shouldShowAnniversary = anniversaryCheck.isAnniversary && !hasShownToday('work_anniversary');

        setData({
            showBirthday: shouldShowBirthday,
            showAnniversary: shouldShowAnniversary,
            yearsAtCompany: anniversaryCheck.years,
        });
    }, [birthDate, hireDate]);

    return data;
}

// ============================================================
// Celebration Provider Component
// ============================================================

interface CelebrationProviderProps {
    userName: string;
    birthDate?: string | null;
    hireDate?: string | null;
    children: React.ReactNode;
}

export function CelebrationProvider({
    userName,
    birthDate,
    hireDate,
    children
}: CelebrationProviderProps) {
    const [currentCelebration, setCurrentCelebration] = useState<CelebrationType | null>(null);
    const celebration = useCelebrationCheck(birthDate, hireDate);

    useEffect(() => {
        // Show birthday first, then anniversary
        if (celebration.showBirthday) {
            setCurrentCelebration('birthday');
        } else if (celebration.showAnniversary) {
            setCurrentCelebration('work_anniversary');
        }
    }, [celebration.showBirthday, celebration.showAnniversary]);

    const handleClose = useCallback(() => {
        if (currentCelebration === 'birthday' && celebration.showAnniversary) {
            // If we just closed birthday and there's also an anniversary, show it
            setTimeout(() => setCurrentCelebration('work_anniversary'), 500);
        } else {
            setCurrentCelebration(null);
        }
    }, [currentCelebration, celebration.showAnniversary]);

    return (
        <>
            {children}
            {currentCelebration && (
                <CelebrationModal
                    type={currentCelebration}
                    userName={userName}
                    yearsAtCompany={celebration.yearsAtCompany}
                    onClose={handleClose}
                />
            )}
        </>
    );
}

export default CelebrationModal;
