/** Shared types and helpers for Finder-style folder windows. */

export type ColumnKey = 'name' | 'date' | 'tags' | 'kind';
export type Dir = 'asc' | 'desc';

export interface FinderRow {
  /** Where double-clicking (or Enter / a tap) goes. */
  href: string;
  name: string;
  /** Tooltip on the name. */
  tooltip?: string;
  icon: 'doc' | 'folder' | 'app' | 'pdf';
  date?: Date;
  tags?: string[];
  /** Human-readable kind, e.g. "Folder · 7 items". */
  kind?: string;
  /** Sort key for the kind column when it should differ from the label. */
  kindSort?: string;
}

export const DEFAULT_DIR: Record<ColumnKey, Dir> = { name: 'asc', date: 'desc', tags: 'asc', kind: 'asc' };

/** Grid track per column; the list reads these into its grid-template-columns. */
export const COLUMN_TRACK: Record<ColumnKey, string> = {
  name: 'minmax(0, 1fr)',
  date: 'minmax(0, 132px)',
  tags: 'minmax(0, 220px)',
  kind: 'minmax(0, 190px)',
};

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/** The value a row sorts by in a column — lowercased text, ISO date, or tags in author order. */
export function sortKey(row: FinderRow, col: ColumnKey): string {
  switch (col) {
    case 'name': return row.name.toLowerCase();
    case 'date': return row.date ? row.date.toISOString().slice(0, 10) : '';
    case 'tags': return row.tags?.length ? row.tags.map((t) => t.toLowerCase()).join(' · ') : '￿';
    case 'kind': return (row.kindSort ?? row.kind ?? '').toLowerCase();
  }
}

/** Server-side ordering; the client script applies the same rules when the user re-sorts. */
export function sortRows(rows: FinderRow[], col: ColumnKey, dir: Dir): FinderRow[] {
  return [...rows].sort((a, b) => {
    let r = collator.compare(sortKey(a, col), sortKey(b, col));
    if (dir === 'desc') r = -r;
    if (r === 0 && col !== 'date') r = -collator.compare(sortKey(a, 'date'), sortKey(b, 'date')); // ties: newest first
    return r;
  });
}

const dirText = (col: ColumnKey, dir: Dir) =>
  col === 'date' ? (dir === 'asc' ? 'oldest first' : 'newest first') : dir === 'asc' ? 'A to Z' : 'Z to A';

/** "7 items · sorted by Date Added, newest first" — the folder window's status bar. */
export function sortStatus(count: number, col: ColumnKey, dir: Dir, label: string): string {
  const pretty = label.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return `${count} ${count === 1 ? 'item' : 'items'} · sorted by ${pretty}, ${dirText(col, dir)}`;
}
