export function formatUtcDateTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function createIdempotencyKey(day) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `claim-day${day || 'next'}-${crypto.randomUUID()}`;
  }
  return `claim-day${day || 'next'}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

