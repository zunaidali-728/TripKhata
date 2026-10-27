// ============================================================
// TRIPKHATA — UTILITY FUNCTIONS
// ============================================================

/** Generate a UUID v4 */
export function generateId(): string {
  return crypto.randomUUID();
}

/** Get today's date as ISO string YYYY-MM-DD */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/** Get current ISO timestamp */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Derive initials from a name (max 2 chars) */
export function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Format a date string for display */
export function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

/** Format a date as relative time (e.g. "2 days ago") */
export function formatRelativeTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(isoDate);
  } catch {
    return isoDate;
  }
}

/** Category display labels */
export const CATEGORY_LABELS: Record<string, string> = {
  accommodation: 'Accommodation',
  food: 'Food & Drinks',
  transportation: 'Transportation',
  fuel: 'Fuel',
  sightseeing: 'Sightseeing',
  shopping: 'Shopping',
  activities: 'Activities',
  miscellaneous: 'Miscellaneous',
};

/** Category emoji icons */
export const CATEGORY_ICONS: Record<string, string> = {
  accommodation: '🏨',
  food: '🍽️',
  transportation: '🚗',
  fuel: '⛽',
  sightseeing: '🏔️',
  shopping: '🛍️',
  activities: '🎯',
  miscellaneous: '📦',
};

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Truncate a string to maxLength with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/** Check if IndexedDB is available */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}
