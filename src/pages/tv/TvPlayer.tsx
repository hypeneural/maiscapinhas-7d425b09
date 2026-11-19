import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTvPlaylist, tvAdsKeys } from '@/hooks/api/use-tv-ads';
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

const TV_DEVICE_ID_KEY = 'mc_tv_device_id';
const TV_APP_VERSION = '2026.11.19-health';

function getOrCreateTvDeviceId(): string {
    try {
        const existing = localStorage.getItem(TV_DEVICE_ID_KEY);
        if (existing) return existing;
        const randomPart =
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                ? crypto.randomUUID().slice(0, 12)
                : Math.random().toString(36).slice(2, 14);
        const created = `tvbox-${randomPart}`;
        localStorage.setItem(TV_DEVICE_ID_KEY, created);
        return created;
    } catch {
        return 'tvbox-ephemeral';
    }
}

function detectLaunchMode(): string {
    try {
        if (window.self !== window.top) return 'iframe';
        if (/;\s*wv\)/i.test(navigator.userAgent)) return 'android_webview';
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
            return 'pwa_standalone';
        }
        if (document.fullscreenElement) return 'fullscreen';
    } catch {
        // Fallback
    }
    return 'browser_tab';
}

export function TvPlayer() {
    const { slug } = useParams<{ slug: string }>();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const screenSlug = slug || 'tv-default';
    const isPreview = searchParams.get('preview') === '1';

    // 1. Carregar playlist (fallback 120s; atualizações em tempo real vêm via playlist_version no ping de 30s)
    const { data: playlistData, isLoading, isError } = useTvPlaylist(screenSlug);

    const rawPlaylist = playlistData?.data?.playlist;
    const playlistJson = JSON.stringify(rawPlaylist || []);
    const playlistVersion = playlistData?.data?.playlist_version || null;

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

    const deviceIdRef = useRef<string>(getOrCreateTvDeviceId());
    const uptimeSecondsRef = useRef<number>(0);

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

    // Refs para evitar recriação do setInterval de heartbeat a cada segundo!
    const currentItemRef = useRef(currentItem);
    currentItemRef.current = currentItem;
    const isBlackoutRef = useRef(isBlackout);
    isBlackoutRef.current = isBlackout;
    const isOfflineRef = useRef(isOffline);
    isOfflineRef.current = isOffline;
    const isPausedRef = useRef(isPaused);
    isPausedRef.current = isPaused;
    const isLoadingRef = useRef(isLoading);
    isLoadingRef.current = isLoading;
    const isErrorRef = useRef(isError);
    isErrorRef.current = isError;
    const playlistVersionRef = useRef<string | null>(playlistVersion);
    playlistVersionRef.current = playlistVersion;
    const hasPlaylistRef = useRef<boolean>(Boolean(playlistData?.data?.playlist));
    hasPlaylistRef.current = Boolean(playlistData?.data?.playlist);

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

    // 4. Contador de Uptime em Ref (sem re-render a cada segundo!)
    useEffect(() => {
        const uptimeInterval = setInterval(() => {
            uptimeSecondsRef.current += 1;
        }, 1000);
        return () => clearInterval(uptimeInterval);
    }, []);

    // 5. Envio de Ping com Telemetria Rica (fixo a cada 30s — ignora modo ?preview=1)
    const sendHeartbeat = useCallback(() => {
        if (isPreview) return;

        const item = currentItemRef.current;
        const blackout = isBlackoutRef.current;
        const offline = isOfflineRef.current;
        const paused = isPausedRef.current;
        const listLen = playlistRef.current.length;

        const playerState = blackout
            ? 'standby'
            : isErrorRef.current
                ? 'error'
                : isLoadingRef.current
                    ? 'loading'
                    : paused
                        ? 'paused'
                        : listLen === 0
                            ? 'empty_playlist'
                            : 'playing';

        const screenOrientation = window.screen?.orientation;

        tvService.ping(screenSlug, {
            width: window.innerWidth,
            height: window.innerHeight,
            screen_width: window.screen?.width,
            screen_height: window.screen?.height,
            dpr: window.devicePixelRatio || 1,
            orientation_angle: typeof screenOrientation?.angle === 'number' ? screenOrientation.angle : undefined,
            orientation_type: screenOrientation?.type || undefined,
            launch_mode: detectLaunchMode(),
            launch_path: window.location.pathname,
            referrer: document.referrer || null,
            device_id: deviceIdRef.current,
            player_state: playerState,
            visibility_state: document.visibilityState,
            network_online: navigator.onLine,
            app_version: TV_APP_VERSION,
            playlist_version: playlistVersionRef.current,
            playlist_count: listLen,
            current_ad_id: blackout ? undefined : item?.id,
            current_ad_title: blackout ? '[TV Desligada / Standby]' : item?.title,
            fps: blackout ? 0 : 60,
            uptime_seconds: uptimeSecondsRef.current,
            offline_cached: offline || !hasPlaylistRef.current,
        }).then((res) => {
            if (!res) return;

            if (typeof res.is_blackout === 'boolean' && res.is_blackout !== isBlackoutRef.current) {
                setIsBlackout(res.is_blackout);
            }

            // Sincronização inteligente: recarrega a playlist apenas se a versão mudou no backend
            if (res.playlist_version && playlistVersionRef.current && res.playlist_version !== playlistVersionRef.current) {
                queryClient.invalidateQueries({ queryKey: tvAdsKeys.playlist(screenSlug) });
            }
        }).catch(() => {});
    }, [isPreview, queryClient, screenSlug]);

    // Intervalo fixo de 30s (independente de uptimeSeconds ou troca de slide!)
    useEffect(() => {
        if (isPreview) return;

        sendHeartbeat();
        const pingInterval = setInterval(sendHeartbeat, 30000);
        return () => clearInterval(pingInterval);
    }, [isPreview, sendHeartbeat]);

    // Ping imediato apenas ao mudar blackout ou recuperar rede (pula o mount inicial)
    const didMountStatePingRef = useRef(false);
    useEffect(() => {
        if (!didMountStatePingRef.current) {
            didMountStatePingRef.current = true;
            return;
        }
        if (isPreview) return;
        sendHeartbeat();
    }, [isBlackout, isOffline, isPreview, sendHeartbeat]);

    // 5b. Desconexão graciosa imediata ao fechar navegador/WebView (pagehide / beforeunload)
    useEffect(() => {
        if (isPreview) return;

        let beaconSent = false;
        const handleUnload = () => {
            if (beaconSent) return;
            beaconSent = true;
            tvService.sendDisconnectBeacon(screenSlug, {
                device_id: deviceIdRef.current,
                reason: 'pagehide',
                uptime_seconds: uptimeSecondsRef.current,
            });
        };

        window.addEventListener('pagehide', handleUnload);
        window.addEventListener('beforeunload', handleUnload);
        return () => {
            window.removeEventListener('pagehide', handleUnload);
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [isPreview, screenSlug]);

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

        if (currentAd && !isPreview) {
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
    }, [isPaused, isBlackout, isPreview, screenSlug]);

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

        if (!isPreview) {
            tvService.logError(screenSlug, {
                message: `Erro ao reproduzir vídeo (Código ${err?.code || 'desconhecido'}): ${currentItem?.url}`,
                url: currentItem?.url,
                type: 'video',
            }).catch(() => {});
        }
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
