/**
 * TV Asset Cache Engine — Inspirado na arquitetura do EventoVivo
 * 
 * Fornece caching inteligente para vídeos e imagens na vitrine da TV usando a Cache Storage API.
 * - Pré-carrega mídias em background para eliminar travamentos e buffer.
 * - Serve mídias do cache local via Blobs para funcionamento 100% resiliente offline.
 * - Evita re-downloads de arquivos grandes (20MB+) a cada ciclo da playlist.
 */

const TV_ASSET_CACHE_NAME = 'maiscapinhas-tv-assets-v1';

// Mapeamento em memória de URLs para ObjectURLs cacheados locais
const memoryBlobUrls = new Map<string, string>();
const inflightRequests = new Map<string, Promise<string>>();

function supportsCacheApi(): boolean {
    return typeof window !== 'undefined' && 'caches' in window;
}

/**
 * Abre o container de cache da TV
 */
async function openTvCache(): Promise<Cache | null> {
    if (!supportsCacheApi()) return null;
    try {
        return await window.caches.open(TV_ASSET_CACHE_NAME);
    } catch {
        return null;
    }
}

/**
 * Pré-carrega e armazena uma mídia no Cache Storage
 */
export async function cacheTvAsset(url: string): Promise<string> {
    if (!url) return url;

    // 1. Se já temos o ObjectURL em memória, retorne imediatamente
    if (memoryBlobUrls.has(url)) {
        return memoryBlobUrls.get(url)!;
    }

    // 2. Se já há um download em andamento desta mídia, reutilize a Promise
    if (inflightRequests.has(url)) {
        return inflightRequests.get(url)!;
    }

    const task = (async () => {
        const cache = await openTvCache();
        
        try {
            // Verificar se já existe no Cache Storage
            if (cache) {
                const match = await cache.match(url);
                if (match) {
                    const blob = await match.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    memoryBlobUrls.set(url, blobUrl);
                    return blobUrl;
                }
            }

            // Buscar da rede
            const response = await fetch(url, {
                method: 'GET',
                cache: 'force-cache',
                credentials: 'omit',
            });

            if (!response.ok) {
                return url; // Fallback para URL direta se o fetch falhar
            }

            // Armazenar no Cache Storage
            if (cache) {
                try {
                    await cache.put(url, response.clone());
                } catch {
                    // Quota cheia ou erro silencioso de cache
                }
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            memoryBlobUrls.set(url, blobUrl);
            return blobUrl;
        } catch (err) {
            console.warn('[TvCacheEngine] Falha ao cachear mídia:', url, err);
            return url;
        } finally {
            inflightRequests.delete(url);
        }
    })();

    inflightRequests.set(url, task);
    return task;
}

/**
 * Pré-carrega uma lista de URLs (ex: toda a playlist da TV) em segundo plano
 */
export async function preloadPlaylistAssets(urls: string[]): Promise<void> {
    const validUrls = urls.filter(Boolean);
    for (const url of validUrls) {
        // Disparar pre-cache sem bloquear
        cacheTvAsset(url).catch(() => {});
    }
}

/**
 * Obtém a URL otimizada (local blob se disponível ou URL remota original)
 */
export function getOptimizedMediaUrl(url: string | null | undefined): string {
    if (!url) return '';
    return memoryBlobUrls.get(url) || url;
}

/**
 * Limpa todo o cache da TV (em caso de reset forçado)
 */
export async function clearTvCache(): Promise<void> {
    memoryBlobUrls.forEach((blobUrl) => {
        URL.revokeObjectURL(blobUrl);
    });
    memoryBlobUrls.clear();
    inflightRequests.clear();

    if (supportsCacheApi()) {
        try {
            await window.caches.delete(TV_ASSET_CACHE_NAME);
        } catch {}
    }
}
