import type { Post } from './posts';
import { site } from '../site.config';

/** URL-safe form of a tag: "GPU optimizing" -> "gpu-optimizing". Tags that differ only in case or spacing share a page. */
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface TagInfo {
  /** Display name, as first written in a post. */
  name: string;
  slug: string;
  count: number;
}

/** Every tag used across the given posts, most-used first, then alphabetical. */
export function collectTags(posts: Post[]): TagInfo[] {
  const byslug = new Map<string, TagInfo>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      const slug = tagSlug(tag);
      if (!slug) continue;
      const info = byslug.get(slug);
      if (info) info.count += 1;
      else byslug.set(slug, { name: tag, slug, count: 1 });
    }
  }
  return [...byslug.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function postsWithTag(posts: Post[], slug: string): Post[] {
  return posts.filter((p) => p.data.tags.some((t) => tagSlug(t) === slug));
}

/** The seven macOS Finder tag colours. */
export const TAG_PALETTE = {
  red: '#FF5B57',
  orange: '#FF9F0A',
  yellow: '#FFD60A',
  green: '#30D158',
  blue: '#0A84FF',
  purple: '#BF5AF2',
  gray: '#8E8E93',
} as const;
export type TagColorName = keyof typeof TAG_PALETTE;

const PALETTE_ORDER: TagColorName[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray'];

/**
 * Colour for a tag: an explicit choice from site.config `tagColors` if present,
 * otherwise a stable pick from the palette based on the tag's slug, so a tag
 * keeps its colour across builds and pages.
 */
export function tagColor(tag: string): string {
  const slug = tagSlug(tag);
  const overrides = site.tagColors as Record<string, TagColorName>;
  const chosen = overrides[tag] ?? overrides[slug] ?? Object.entries(overrides).find(([k]) => tagSlug(k) === slug)?.[1];
  if (chosen && chosen in TAG_PALETTE) return TAG_PALETTE[chosen];
  let h = 5381;
  for (const ch of slug) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  return TAG_PALETTE[PALETTE_ORDER[h % PALETTE_ORDER.length]];
}
