/**
 * Chunked Upload Utility
 * 
 * Fatiamento e envio de arquivos grandes (Vídeos de até 500MB+) em blocos de 2MB.
 * Bypassa limites de post_max_size do PHP e limites de 100MB do Cloudflare.
 */

import { api } from '@/lib/api/client';

export interface ChunkUploadProgress {
    percent: number;
    currentChunk: number;
    totalChunks: number;
    uploadedBytes: number;
    totalBytes: number;
    stage: 'preparing' | 'uploading' | 'processing' | 'completed' | 'error';
    message?: string;
}

export interface ChunkUploadResult {
    media_url: string;
    media_path: string;
    media_type: 'video' | 'image';
    thumbnail_url?: string | null;
    filename: string;
    size: number;
    mime_type: string;
}

const DEFAULT_CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB por pedaço

export async function uploadMediaChunked(
    file: File,
    onProgress?: (progress: ChunkUploadProgress) => void,
    chunkSize: number = DEFAULT_CHUNK_SIZE
): Promise<ChunkUploadResult> {
    const totalBytes = file.size;
    const totalChunks = Math.max(1, Math.ceil(totalBytes / chunkSize));
    const uploadId = `up_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    onProgress?.({
        percent: 0,
        currentChunk: 0,
        totalChunks,
        uploadedBytes: 0,
        totalBytes,
        stage: 'uploading',
        message: `Iniciando upload de ${totalChunks} partes...`,
    });

    let uploadedBytes = 0;
    let finalResult: ChunkUploadResult | null = null;

    for (let index = 0; index < totalChunks; index++) {
        const start = index * chunkSize;
        const end = Math.min(totalBytes, start + chunkSize);
        const chunkBlob = file.slice(start, end);
        const currentChunkSize = end - start;

        const formData = new FormData();
        formData.append('upload_id', uploadId);
        formData.append('chunk_index', String(index));
        formData.append('total_chunks', String(totalChunks));
        formData.append('filename', file.name);
        formData.append('file', chunkBlob, file.name);

        const isLastChunk = index === totalChunks - 1;
        if (isLastChunk) {
            onProgress?.({
                percent: Math.min(99, Math.round((uploadedBytes / totalBytes) * 100)),
                currentChunk: index + 1,
                totalChunks,
                uploadedBytes,
                totalBytes,
                stage: 'processing',
                message: 'Unificando e processando vídeo no servidor...',
            });
        }

        // Retry logic (até 3 tentativas por chunk)
        let attempts = 0;
        let success = false;
        let lastError: any = null;

        while (attempts < 3 && !success) {
            attempts++;
            try {
                const response = await api.post('/admin/tv/ads/upload-chunk', formData, {
                    timeout: 60000,
                });

                const data = response.data;
                if (!data || !data.success) {
                    throw new Error(data?.message || `Erro no envio da parte ${index + 1}`);
                }

                if (isLastChunk && data.completed) {
                    finalResult = {
                        media_url: data.media_url,
                        media_path: data.media_path,
                        media_type: data.media_type,
                        thumbnail_url: data.thumbnail_url,
                        filename: data.filename,
                        size: data.size,
                        mime_type: data.mime_type,
                    };
                }

                success = true;
            } catch (err: any) {
                lastError = err;
                if (attempts < 3) {
                    await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
                }
            }
        }

        if (!success) {
            const errMsg = lastError?.response?.data?.message || lastError?.message || 'Erro de conexão';
            onProgress?.({
                percent: Math.round((uploadedBytes / totalBytes) * 100),
                currentChunk: index + 1,
                totalChunks,
                uploadedBytes,
                totalBytes,
                stage: 'error',
                message: `Falha na parte ${index + 1}: ${errMsg}`,
            });
            throw new Error(`Falha no upload do vídeo na parte ${index + 1}: ${errMsg}`);
        }

        uploadedBytes += currentChunkSize;
        const currentPercent = Math.min(isLastChunk ? 99 : 98, Math.round((uploadedBytes / totalBytes) * 100));

        onProgress?.({
            percent: currentPercent,
            currentChunk: index + 1,
            totalChunks,
            uploadedBytes,
            totalBytes,
            stage: isLastChunk ? 'processing' : 'uploading',
            message: `Enviando parte ${index + 1} de ${totalChunks} (${(uploadedBytes / (1024 * 1024)).toFixed(1)} MB / ${(totalBytes / (1024 * 1024)).toFixed(1)} MB)...`,
        });
    }

    if (!finalResult) {
        throw new Error('Upload concluído, mas o servidor não retornou os metadados do arquivo.');
    }

    onProgress?.({
        percent: 100,
        currentChunk: totalChunks,
        totalChunks,
        uploadedBytes: totalBytes,
        totalBytes,
        stage: 'completed',
        message: 'Upload e processamento concluídos com sucesso!',
    });

    return finalResult;
}
