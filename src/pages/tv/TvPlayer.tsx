import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTvPlaylist } from '@/hooks/api/use-tv-ads';
import { tvService } from '@/services/tv.service';
import { preloadPlaylistAssets, getOptimizedMediaUrl, cacheTvAsset } from '@/services/tvCacheEngine';
import type { TvPlaylistItem, TvDesignTemplate } from '@/types/tv.types';
import {
    Tv,
    WifiOff,
    Pause,
    Moon,
} from 'lucide-react';
import {
    TvClockWidget,
    TvStoreBadgeWidget,
    TvTickerBannerWidget,
    TvQrCodeWidget,
    TvBrandingLogoWidget,
} from './widgets/TvOverlayWidgets';

export function TvPlayer() {
    const { slug } = useParams<{ slug: string }>();
    const screenSlug = slug || 'tv-default';

    // 1. Carregar playlist com polling inteligente
    const { data: playlistData, isLoading, isError } = useTvPlaylist(screenSlug);

    const rawPlaylist = playlistData?.data?.playlist;
    const playlistJson = JSON.stringify(rawPlaylist || []);

    // Memoização estável da playlist para evitar re-render no polling periódico
    const playlist: TvPlaylistItem[] = useMemo(() => {
        return rawPlaylist || [];
    }, [playlistJson]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isBlackout, setIsBlackout] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [cursorVisible, setCursorVisible] = useState(true);
    const [uptimeSeconds, setUptimeSeconds] = useState(0);

    const designTemplate: TvDesignTemplate | undefined = playlistData?.data?.design_template;
    const storeName = playlistData?.data?.screen?.store_name || 'Mais Capinhas';

    // Garantir índice válido em memória
    const safeIndex = playlist.length > 0 ? currentIndex % playlist.length : 0;
    const currentItem = playlist[safeIndex] || null;

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const slideStartedAtRef = useRef<number>(Date.now());
    const currentIndexRef = useRef(safeIndex);
    currentIndexRef.current = safeIndex;

    const playlistRef = useRef(playlist);
    playlistRef.current = playlist;

    // 2. Sincronizar estado de Standby / Blackout com o backend
    useEffect(() => {
        if (playlistData?.data?.screen?.is_blackout !== undefined) {
            setIsBlackout(playlistData.data.screen.is_blackout);
        }
    }, [playlistData?.data?.screen?.is_blackout]);

    // 3. Monitoramento de Rede
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // 4. Contador de Uptime
    useEffect(() => {
        const uptimeInterval = setInterval(() => {
            setUptimeSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(uptimeInterval);
    }, []);

    // 5. Envio de Ping com Telemetria (a cada 30 segundos)
    useEffect(() => {
        const sendPing = () => {
            tvService.ping(screenSlug, {
                width: window.innerWidth,
                height: window.innerHeight,
                current_ad_id: isBlackout ? undefined : currentItem?.id,
                current_ad_title: isBlackout ? '[TV Desligada / Standby]' : currentItem?.title,
                fps: isBlackout ? 0 : 60,
                uptime_seconds: uptimeSeconds,
                offline_cached: isOffline || !playlistData?.data?.playlist,
            }).catch(() => {});
        };

        sendPing();
        const pingInterval = setInterval(sendPing, 30000);
        return () => clearInterval(pingInterval);
    }, [screenSlug, currentItem?.id, currentItem?.title, uptimeSeconds, isOffline, isBlackout, playlistData]);

    // 6. Ocultar cursor do mouse após 3 segundos de inatividade
    useEffect(() => {
        let mouseTimer: ReturnType<typeof setTimeout>;

        const handleMouseMove = () => {
            setCursorVisible(true);
            clearTimeout(mouseTimer);
            mouseTimer = setTimeout(() => setCursorVisible(false), 3000);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(mouseTimer);
        };
    }, []);

    // 7. Avançar para o próximo slide com registro de impressão
    const advanceToNext = useCallback((completedNaturally = true) => {
        if (isPaused || isBlackout) return;
        if (timerRef.current) clearTimeout(timerRef.current);
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

        const currentList = playlistRef.current;
        const currentIdx = currentIndexRef.current;
        const currentAd = currentList[currentIdx];

        if (currentAd) {
            const durationPlayed = Math.round((Date.now() - slideStartedAtRef.current) / 1000);
            tvService.logImpression(screenSlug, {
                tv_ad_id: currentAd.id,
                duration_played_seconds: Math.max(1, durationPlayed),
                completed_naturally: completedNaturally,
                media_type: currentAd.type,
            }).catch(() => {});
        }

        setIsTransitioning(true);

        setTimeout(() => {
            setCurrentIndex((prevIndex) => {
                if (currentList.length <= 1) return 0;
                return (prevIndex + 1) % currentList.length;
            });
            slideStartedAtRef.current = Date.now();
            setIsTransitioning(false);
        }, 400);
    }, [isPaused, isBlackout, screenSlug]);

    // 8. Pre-cache Inteligente de Playlist e Preloader Antecipado
    useEffect(() => {
        if (playlist.length === 0 || isBlackout) return;

        // Disparar download em segundo plano de toda a playlist para o Cache Storage
        const urls = playlist.map(item => item.url).filter(Boolean);
        preloadPlaylistAssets(urls);

        // Pré-carregar os 2 próximos itens especificamente
        const nextIdx1 = (safeIndex + 1) % playlist.length;
        const nextIdx2 = (safeIndex + 2) % playlist.length;
        [playlist[nextIdx1], playlist[nextIdx2]].forEach(item => {
            if (item?.url) {
                cacheTvAsset(item.url).catch(() => {});
            }
        });
    }, [playlist, safeIndex, isBlackout]);

    // 9. Ciclo de exibição do slide ativo
    useEffect(() => {
        if (!currentItem || isPaused || isBlackout) return;

        slideStartedAtRef.current = Date.now();

        if (timerRef.current) clearTimeout(timerRef.current);
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

        if (currentItem.type === 'image') {
            const durationMs = Math.max(3, currentItem.duration || 10) * 1000;
            timerRef.current = setTimeout(() => {
                advanceToNext(true);
            }, durationMs);
        } else if (currentItem.type === 'video') {
            // Watchdog de segurança: avança apenas se o vídeo travar totalmente
            const maxDurationMs = Math.max(15, (currentItem.duration || 30) + 8) * 1000;
            safetyTimeoutRef.current = setTimeout(() => {
                console.warn('[TvPlayer] Watchdog de vídeo disparado (limite de tempo atingido). Avançando slide...');
                advanceToNext(false);
            }, maxDurationMs);

            // Iniciar reprodução segura
            if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.muted = true;
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch((err) => {
                        console.warn('[TvPlayer] Autoplay atrasado, tentando novamente:', err);
                        setTimeout(() => {
                            if (videoRef.current) {
                                videoRef.current.muted = true;
                                videoRef.current.play().catch(() => {});
                            }
                        }, 300);
                    });
                }
            }
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
        };
    }, [safeIndex, currentItem?.id, isPaused, isBlackout, advanceToNext]);

    // Handler para mensagens de controle remoto da janela (Simulator / PostMessage)
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            const cmd = e.data?.command;
            if (!cmd) return;

            if (cmd === 'reload') {
                window.location.reload();
            } else if (cmd === 'next') {
                advanceToNext(false);
            } else if (cmd === 'pause') {
                setIsPaused(true);
            } else if (cmd === 'play') {
                setIsPaused(false);
            } else if (cmd === 'turn_off') {
                setIsBlackout(true);
            } else if (cmd === 'turn_on') {
                setIsBlackout(false);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [advanceToNext]);

    const handleVideoEnded = () => {
        advanceToNext(true);
    };

    const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        const target = e.currentTarget;
        const err = target.error;
        console.error('[TvPlayer] Erro no vídeo:', err?.code, err?.message, currentItem?.url);

        tvService.logError(screenSlug, {
            message: `Erro ao reproduzir vídeo (Código ${err?.code || 'desconhecido'}): ${currentItem?.url}`,
            url: currentItem?.url,
            type: 'video',
        }).catch(() => {});
        advanceToNext(false);
    };

    // MODO BLACKOUT / STANDBY (TELA DESLIGADA)
    if (isBlackout) {
        return (
            <div className="relative w-screen h-screen bg-black overflow-hidden select-none flex flex-col items-center justify-center cursor-none">
                <div className="flex flex-col items-center gap-4 text-zinc-800 animate-pulse">
                    <Moon className="h-14 w-14 stroke-1" />
                    <div className="text-center space-y-1">
                        <p className="text-sm font-semibold tracking-wider uppercase">TV em Modo Standby</p>
                        <p className="text-xs text-zinc-800">Aguardando comando de inicialização pelo ERP</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`relative w-screen h-screen bg-black overflow-hidden select-none flex items-center justify-center ${
                !cursorVisible ? 'cursor-none' : ''
            }`}
        >
            {/* Estado de Carregamento Inicial */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center text-white/70 gap-4">
                    <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm tracking-widest font-mono uppercase">Iniciando Vitrine Digital...</p>
                </div>
            )}

            {/* Erro de Conexão */}
            {isError && (
                <div className="flex flex-col items-center justify-center text-red-400 gap-3 text-center p-8 bg-zinc-950 rounded-2xl border border-red-900/50">
                    <WifiOff className="h-12 w-12 text-red-500" />
                    <h2 className="text-xl font-bold">Falha de Comunicação com o Servidor</h2>
                    <p className="text-xs text-zinc-400 max-w-sm">
                        Não foi possível carregar a playlist. O sistema tentará reconectar automaticamente.
                    </p>
                </div>
            )}

            {!isLoading && playlist.length === 0 && (
                <div className="flex flex-col items-center justify-center text-white/50 gap-3 text-center p-8">
                    <Tv className="h-16 w-16 mb-2 stroke-1" />
                    <h2 className="text-2xl font-bold text-white/90">Nenhum anúncio programado</h2>
                    <p className="text-sm max-w-md">
                        Esta TV está conectada e pronta. Cadastre fotos ou vídeos no painel do ERP para iniciar a reprodução.
                    </p>
                </div>
            )}

            {/* Slide Surface com Transição Suave GPU */}
            {currentItem && (
                <div
                    key={`${currentItem.id}_${safeIndex}`}
                    className={`absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden transition-all duration-700 ease-in-out transform ${
                        isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                    }`}
                >
                    {/* Ambient Light Blur Background */}
                    {currentItem.type === 'image' && (
                        <div
                            className="absolute inset-0 w-full h-full bg-cover bg-center blur-3xl opacity-30 scale-125 pointer-events-none transition-all duration-1000"
                            style={{ backgroundImage: `url(${getOptimizedMediaUrl(currentItem.url)})` }}
                        />
                    )}

                    {/* Mídia Principal */}
                    {currentItem.type === 'video' ? (
                        <video
                            ref={videoRef}
                            key={currentItem.url}
                            src={getOptimizedMediaUrl(currentItem.url)}
                            autoPlay
                            muted
                            playsInline
                            preload="auto"
                            disablePictureInPicture
                            onEnded={handleVideoEnded}
                            onError={handleVideoError}
                            className="relative z-10 w-full h-full object-contain"
                        />
                    ) : (
                        <img
                            src={getOptimizedMediaUrl(currentItem.url)}
                            alt={currentItem.title}
                            className="relative z-10 w-full h-full object-contain"
                        />
                    )}
                </div>
            )}

            {/* Badges de Status (Pausa / Offline) */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 pointer-events-none">
                {isPaused && (
                    <div className="px-3.5 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 font-medium text-xs flex items-center gap-1.5 shadow-lg animate-pulse">
                        <Pause className="h-3.5 w-3.5 fill-current" />
                        Pausado
                    </div>
                )}

                {isOffline && (
                    <div className="px-3.5 py-1.5 rounded-full bg-zinc-800/80 backdrop-blur-md border border-zinc-700 text-zinc-300 font-medium text-xs flex items-center gap-1.5 shadow-lg">
                        <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                        Modo Offline
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* OVERLAYS DINÂMICOS CONFIGURÁVEIS (Hora, Loja, Logo, Ticker) */}
            {/* ========================================================= */}
            <TvClockWidget config={designTemplate?.clock} />
            <TvStoreBadgeWidget config={designTemplate?.store_badge} fallbackStoreName={storeName} />
            <TvQrCodeWidget config={designTemplate?.qr_code} fallbackStoreSlug={screenSlug} />
            <TvBrandingLogoWidget config={designTemplate?.branding_logo} />
            <TvTickerBannerWidget config={designTemplate?.ticker_banner} />
        </div>
    );
}

export default TvPlayer;
