export interface StoreIdentifierSource {
    id: number;
    guid?: string | null;
    uuid?: string | null;
    store_uuid?: string | null;
    loja_uuid?: string | null;
}

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeUuid(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    if (trimmed === '' || !UUID_REGEX.test(trimmed)) {
        return null;
    }

    return trimmed.toLowerCase();
}

export function getStoreGuid(store: StoreIdentifierSource): string | null {
    return (
        normalizeUuid(store.guid)
        ?? normalizeUuid(store.uuid)
        ?? normalizeUuid(store.store_uuid)
        ?? normalizeUuid(store.loja_uuid)
    );
}

export function getStoreIdentifier(store: StoreIdentifierSource): string {
    return getStoreGuid(store) ?? String(store.id);
}

export function resolveStoreNumericId(
    storeId: number | string | null | undefined,
    stores?: StoreIdentifierSource[]
): number | undefined {
    if (storeId === null || storeId === undefined || storeId === '') {
        return undefined;
    }

    const raw = String(storeId).trim();
    if (raw === '') {
        return undefined;
    }

    if (/^\d+$/.test(raw)) {
        return Number(raw);
    }

    const normalizedRaw = normalizeUuid(raw) ?? raw.toLowerCase();
    const match = stores?.find((store) => {
        const guid = getStoreGuid(store);
        return guid !== null && guid === normalizedRaw;
    });

    return match?.id;
}

export function resolveStoreIdentifierForReports(
    storeId: number | string | null | undefined,
    stores?: StoreIdentifierSource[]
): string | number | undefined {
    if (storeId === null || storeId === undefined || storeId === '') {
        return undefined;
    }

    const raw = String(storeId).trim();
    if (raw === '') {
        return undefined;
    }

    const normalizedRawUuid = normalizeUuid(raw);
    if (normalizedRawUuid !== null) {
        return normalizedRawUuid;
    }

    if (!/^\d+$/.test(raw)) {
        return raw;
    }

    const numericId = Number(raw);
    const match = stores?.find((store) => store.id === numericId);
    const guid = match ? getStoreGuid(match) : null;

    if (guid !== null) {
        return guid;
    }

    return numericId;
}
