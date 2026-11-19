const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo';

const DATE_KEY_PATTERN = /^(\d{4}-\d{2}-\d{2})/;
const HAS_TIMEZONE_PATTERN = /(Z|[+-]\d{2}:\d{2})$/i;

const trimExtraFractionDigits = (value: string): string => {
  return value.replace(/(\.\d{3})\d+(?=(Z|[+-]\d{2}:\d{2})$)/i, '$1');
};

export const extractDateKey = (value: unknown): string | null => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const match = raw.match(DATE_KEY_PATTERN);
  return match?.[1] ?? null;
};

export const parseDateKeyToLocalNoon = (value: unknown): Date | null => {
  const dateKey = extractDateKey(value);
  if (!dateKey) return null;
  const parsed = new Date(`${dateKey}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getSaoPauloDateKey = (referenceDate: Date = new Date()): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(referenceDate);
};

export const parseApiDateTimeToDate = (value: unknown): Date | null => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  const dateKey = raw.match(/^(\d{4}-\d{2}-\d{2})$/)?.[1];
  if (dateKey) {
    return parseDateKeyToLocalNoon(dateKey);
  }

  let normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  normalized = trimExtraFractionDigits(normalized);

  if (!HAS_TIMEZONE_PATTERN.test(normalized)) {
    normalized = `${normalized}Z`;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDateKeyPtBr = (value: unknown, fallback = 'Data invalida'): string => {
  const parsed = parseDateKeyToLocalNoon(value);
  if (!parsed) return fallback;
  return parsed.toLocaleDateString('pt-BR', { timeZone: SAO_PAULO_TIMEZONE });
};

export const formatDateTimeSaoPaulo = (value: unknown, fallback = '-'): string => {
  const parsed = parseApiDateTimeToDate(value);
  if (!parsed) return fallback;
  return parsed.toLocaleString('pt-BR', {
    timeZone: SAO_PAULO_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTimeSaoPaulo = (value: unknown, fallback: string | null = null): string | null => {
  const parsed = parseApiDateTimeToDate(value);
  if (!parsed) return fallback;
  return parsed.toLocaleTimeString('pt-BR', {
    timeZone: SAO_PAULO_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
};

export { SAO_PAULO_TIMEZONE };
