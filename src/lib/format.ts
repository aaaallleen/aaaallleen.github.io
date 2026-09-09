/** "MAR 2026" — the pixel-font date stamp used across the site. UTC so date-only frontmatter never shifts a day. */
export function monthYear(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
}

/** Rough reading time in minutes from a markdown body. */
export function readingTime(body: string | undefined, fallback?: number): number {
  if (fallback) return fallback;
  const words = (body ?? '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** "MAR 15, 2026" — full date for the Finder-style list's DATE ADDED column. */
export function fullDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
}
