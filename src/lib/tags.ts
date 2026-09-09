import type { Post } from './posts';

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
