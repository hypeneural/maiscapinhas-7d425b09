import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type {
    TvDesignTemplate,
    TvOverlayPosition,
    TvOverlayStyle,
} from '@/types/tv.types';

// Injetor de Google Fonts para garantir que todas as tipografias selecionadas estejam disponíveis
const GOOGLE_FONTS_HREF =
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700;900&family=Montserrat:wght@400;600;700;900&family=Oswald:wght@500;700&family=Poppins:wght@400;600;700;900&family=Roboto:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap';

function ensureGoogleFontsLoaded() {
    if (typeof document === 'undefined') return;
    const existing = document.getElementById('maiscapinhas-tv-fonts');
    if (!existing) {
        const link = document.createElement('link');
        link.id = 'maiscapinhas-tv-fonts';
        link.rel = 'stylesheet';
        link.href = GOOGLE_FONTS_HREF;
        document.head.appendChild(link);
    }
}

// Utilitário para mapear as posições de 4 cantos com TV-Safe margin
export function getPositionClasses(position: TvOverlayPosition): string {
    switch (position) {
        case 'top-left':
            return 'top-[max(20px,2.5vw)] left-[max(20px,2.5vw)]';
        case 'top-right':
            return 'top-[max(20px,2.5vw)] right-[max(20px,2.5vw)]';
        case 'bottom-left':
            return 'bottom-[max(20px,2.5vw)] left-[max(20px,2.5vw)]';
        case 'bottom-right':
            return 'bottom-[max(20px,2.5vw)] right-[max(20px,2.5vw)]';
        default:
            return 'top-[max(20px,2.5vw)] right-[max(20px,2.5vw)]';
    }
}

// Utilitário de estilo visual (Glass, Solid, Minimal, Neon)
export function getStyleClasses(style: TvOverlayStyle): string {
    switch (style) {
        case 'glass':
            return 'bg-black/45 backdrop-blur-xl border border-white/15 shadow-2xl text-white';
        case 'solid':
            return 'bg-zinc-950/95 border border-zinc-800 shadow-2xl text-white';
        case 'neon':
            return 'bg-black/60 backdrop-blur-md border border-primary/50 shadow-[0_0_25px_rgba(99,102,241,0.4)] text-white';
        case 'minimal':
            return 'bg-transparent text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]';
        default:
            return 'bg-black/45 backdrop-blur-xl border border-white/15 text-white';
    }
}

// ============================================
// 1. WIDGET: RELÓGIO & HORA CERTA
// ============================================
export function TvClockWidget({
    config,
}: {
    config?: TvDesignTemplate['clock'];
}) {
    const [timeStr, setTimeStr] = useState('');
    const [dateStr, setDateStr] = useState('');

    const enabled = config?.enabled ?? true;
    const position = config?.position ?? 'top-right';
    const format = config?.format ?? '24h';
    const showSeconds = config?.show_seconds ?? false;
    const showDate = config?.show_date ?? false;
    const style = config?.style ?? 'glass';
    const size = config?.size ?? 'md';
    const textColor = config?.color || '#ffffff';

    useEffect(() => {
        ensureGoogleFontsLoaded();
        const update = () => {
            const now = new Date();

            let time = '';
            if (format === '12h') {
                time = now.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: showSeconds ? '2-digit' : undefined,
                    hour12: true,
                });
            } else if (format === '24h_seconds' || showSeconds) {
                time = now.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                });
            } else {
                time = now.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });
            }

            setTimeStr(time);

            if (showDate || format === 'full_date_time') {
                const dateFormatted = now.toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                });
                setDateStr(dateFormatted.replace('.', ''));
            }
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [format, showSeconds, showDate]);

    if (!enabled) return null;

    const sizeClass =
        size === 'lg'
            ? 'text-2xl sm:text-3xl px-5 py-2.5 rounded-2xl'
            : size === 'sm'
            ? 'text-xs sm:text-sm px-3 py-1.5 rounded-lg'
            : 'text-base sm:text-lg px-4 py-2 rounded-xl';

    return (
        <div
            className={`pointer-events-none absolute z-30 flex flex-col items-end ${getPositionClasses(
                position
            )}`}
        >
            <div
                className={`flex items-center gap-2 font-mono font-bold tracking-wider ${sizeClass} ${getStyleClasses(
                    style
                )}`}
                style={{ color: textColor }}
            >
                {dateStr && (
                    <span className="text-xs font-sans font-medium text-white/75 capitalize mr-1">
                        {dateStr} •
                    </span>
                )}
                <span>{timeStr}</span>
            </div>
        </div>
    );
}

// ============================================
// 2. WIDGET: BADGE / NOME DA LOJA
// ============================================
export function TvStoreBadgeWidget({
    config,
    fallbackStoreName,
}: {
    config?: TvDesignTemplate['store_badge'];
    fallbackStoreName: string;
}) {
    const enabled = config?.enabled ?? true;
    const position = config?.position ?? 'top-left';
    const storeName = config?.custom_name || fallbackStoreName || 'Mais Capinhas';
    const tagline = config?.tagline;
    const style = config?.style ?? 'glass';
    const accentColor = config?.accent_color || '#10b981';
    const pulseDot = config?.pulse_dot ?? true;

    if (!enabled) return null;

    return (
        <div
            className={`pointer-events-none absolute z-30 ${getPositionClasses(
                position
            )}`}
        >
            <div
                className={`px-4 py-2 rounded-xl flex items-center gap-3 ${getStyleClasses(
                    style
                )}`}
            >
                {pulseDot && (
                    <span
                        className="h-2.5 w-2.5 rounded-full animate-pulse shrink-0"
                        style={{ backgroundColor: accentColor }}
                    />
                )}
                <div>
                    <h3 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight">
                        {storeName}
                    </h3>
                    {tagline && (
                        <p className="text-[11px] text-white/70 font-medium tracking-wide leading-none mt-0.5">
                            {tagline}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================
// 3. WIDGET: LETREIRO / TICKER PROMOCIONAL
// ============================================
export function TvTickerBannerWidget({
    config,
}: {
    config?: TvDesignTemplate['ticker_banner'];
}) {
    useEffect(() => {
        ensureGoogleFontsLoaded();
    }, []);

    const enabled = config?.enabled ?? false;
    const text = config?.text || '';
    const tagPrefix = config?.tag_prefix || '';
    const fontFamily = config?.font_family || 'Inter';
    const fontSize = config?.font_size ?? 16;
    const fontWeight =
        config?.font_weight === 'black'
            ? '900'
            : config?.font_weight === 'bold'
            ? '700'
            : config?.font_weight === 'semibold'
            ? '600'
            : '400';
    const speed = config?.speed ?? 'normal';
    const bgColor = config?.bg_color || '#000000';
    const bgOpacity = config?.bg_opacity ?? 0.85;
    const textColor = config?.text_color || '#ffffff';
    const paddingY = config?.padding_y ?? 'md';

    if (!enabled || !text.trim()) return null;

    const durationSeconds = speed === 'slow' ? 42 : speed === 'fast' ? 18 : 28;

    const paddingClass =
        paddingY === 'lg'
            ? 'py-4 px-6'
            : paddingY === 'sm'
            ? 'py-1.5 px-4'
            : 'py-2.5 px-5';

    return (
        <div
            className={`pointer-events-none absolute bottom-0 left-0 right-0 z-40 overflow-hidden backdrop-blur-md border-t border-white/10 ${paddingClass}`}
            style={{
                backgroundColor: bgColor,
                opacity: bgOpacity,
                color: textColor,
                fontFamily: `${fontFamily}, sans-serif`,
                fontSize: `${fontSize}px`,
                fontWeight,
            }}
        >
            <div
                className="whitespace-nowrap flex items-center tracking-wide"
                style={{
                    animation: `marquee ${durationSeconds}s linear infinite`,
                }}
            >
                {[1, 2, 3].map((idx) => (
                    <div key={idx} className="inline-flex items-center mr-16 shrink-0 gap-3">
                        {tagPrefix && (
                            <span
                                className="px-2 py-0.5 rounded text-[0.8em] font-black uppercase tracking-wider bg-white/20 text-white shadow-sm border border-white/20"
                            >
                                {tagPrefix}
                            </span>
                        )}
                        <span>{text}</span>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
            `}</style>
        </div>
    );
}

// ============================================
// 4. WIDGET: QR CODE DINÂMICO & COLORIDO
// ============================================
export function TvQrCodeWidget({
    config,
    fallbackStoreSlug,
}: {
    config?: TvDesignTemplate['qr_code'];
    fallbackStoreSlug: string;
}) {
    const enabled = config?.enabled ?? false;
    const position = config?.position ?? 'bottom-right';
    const title = config?.title || 'Acesse pelo Celular';
    const titleColor = config?.title_color || '#ffffff';
    const fgColor = config?.fg_color || '#000000';
    const bgColor = config?.bg_color || '#ffffff';
    const style = config?.style ?? 'glass';
    const size = config?.size ?? 'md';

    const targetUrl =
        config?.custom_url ||
        `https://erp.maiscapinhas.com.br/tv/${fallbackStoreSlug}`;

    if (!enabled) return null;

    const qrPixelSize = size === 'lg' ? 115 : size === 'sm' ? 72 : 90;

    return (
        <div
            className={`pointer-events-none absolute z-30 ${getPositionClasses(
                position
            )}`}
        >
            <div
                className={`p-3 rounded-2xl flex flex-col items-center gap-2 ${getStyleClasses(
                    style
                )}`}
            >
                <div
                    className="p-2 rounded-xl shadow-md flex items-center justify-center transition-transform"
                    style={{ backgroundColor: bgColor }}
                >
                    <QRCodeSVG
                        value={targetUrl}
                        size={qrPixelSize}
                        fgColor={fgColor}
                        bgColor={bgColor}
                        level="M"
                        includeMargin={false}
                    />
                </div>
                {title && (
                    <p
                        className="text-[11px] font-semibold tracking-wide text-center max-w-[130px] leading-tight"
                        style={{ color: titleColor }}
                    >
                        {title}
                    </p>
                )}
            </div>
        </div>
    );
}

// ============================================
// 5. WIDGET: LOGO DA MARCA
// ============================================
export function TvBrandingLogoWidget({
    config,
}: {
    config?: TvDesignTemplate['branding_logo'];
}) {
    const enabled = config?.enabled ?? false;
    const position = config?.position ?? 'bottom-left';
    const logoUrl = config?.logo_url;
    const heightPx = config?.height_px ?? 48;
    const opacity = config?.opacity ?? 0.9;

    if (!enabled || !logoUrl) return null;

    return (
        <div
            className={`pointer-events-none absolute z-30 ${getPositionClasses(
                position
            )}`}
        >
            <img
                src={logoUrl}
                alt="Logo"
                style={{ height: `${heightPx}px`, opacity }}
                className="max-w-[220px] object-contain drop-shadow-xl"
            />
        </div>
    );
}
