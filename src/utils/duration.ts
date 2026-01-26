/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 0) {
    return '0s';
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  return `${seconds}s`;
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDurationSeconds(seconds: number): string {
  return formatDuration(seconds * 1000);
}

/**
 * Format duration for pipe output (total seconds)
 */
export function formatDurationPipe(ms: number): string {
  return Math.floor(ms / 1000).toString();
}

/**
 * Parse duration string to milliseconds
 * Supports formats: "1h", "30m", "1h30m", "1:30", "90"
 */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim();

  // Try parsing as seconds only
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10) * 1000;
  }

  // Try parsing as HH:MM or H:MM
  const colonMatch = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    const hours = parseInt(colonMatch[1], 10);
    const minutes = parseInt(colonMatch[2], 10);
    return (hours * 60 + minutes) * 60 * 1000;
  }

  // Try parsing as "1h30m", "1h", "30m", "1d2h"
  let totalMs = 0;
  const dayMatch = trimmed.match(/(\d+)d/);
  const hourMatch = trimmed.match(/(\d+)h/);
  const minuteMatch = trimmed.match(/(\d+)m/);
  const secondMatch = trimmed.match(/(\d+)s/);

  if (dayMatch) {
    totalMs += parseInt(dayMatch[1], 10) * 24 * 60 * 60 * 1000;
  }
  if (hourMatch) {
    totalMs += parseInt(hourMatch[1], 10) * 60 * 60 * 1000;
  }
  if (minuteMatch) {
    totalMs += parseInt(minuteMatch[1], 10) * 60 * 1000;
  }
  if (secondMatch) {
    totalMs += parseInt(secondMatch[1], 10) * 1000;
  }

  return totalMs > 0 ? totalMs : null;
}

/**
 * Calculate duration between two dates
 */
export function calculateDuration(start: Date, end: Date = new Date()): number {
  return end.getTime() - start.getTime();
}
