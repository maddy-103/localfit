/** Formatting helpers. Money is always integer paise; output uses en-IN. */

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrWithPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const number = new Intl.NumberFormat('en-IN');

export function formatPaise(paise: number, showPaise = false): string {
  const rupees = paise / 100;
  return showPaise && !Number.isInteger(rupees) ? inrWithPaise.format(rupees) : inr.format(rupees);
}

export function formatCount(value: number): string {
  return number.format(value);
}

export function percentOff(pricePaise: number, mrpPaise: number): number {
  if (mrpPaise <= 0 || pricePaise >= mrpPaise) return 0;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}

export function formatEta(minMinutes: number, maxMinutes: number): string {
  return `${minMinutes}–${maxMinutes} min`;
}

export function formatDistance(km: number): string {
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

const timeFormat = new Intl.DateTimeFormat('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

const dateTimeFormat = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

export function formatTime(timestamp: number | string): string {
  return timeFormat.format(new Date(timestamp));
}

export function formatDateTime(timestamp: number | string): string {
  return dateTimeFormat.format(new Date(timestamp));
}

/** mm:ss for trial and waiting timers. */
export function formatRemaining(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatRelative(timestamp: string | number, atMs: number): string {
  const deltaSeconds = Math.round((new Date(timestamp).getTime() - atMs) / 1000);
  const abs = Math.abs(deltaSeconds);
  if (abs < 60) return deltaSeconds <= 0 ? 'just now' : `in ${abs}s`;
  if (abs < 3600) {
    const minutes = Math.round(abs / 60);
    return deltaSeconds < 0 ? `${minutes} min ago` : `in ${minutes} min`;
  }
  const hours = Math.round(abs / 3600);
  return deltaSeconds < 0 ? `${hours} h ago` : `in ${hours} h`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
