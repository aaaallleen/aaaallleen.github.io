import type { Post } from './posts';
import type { FinderRow } from './finder';
import { url } from './url';

/** Posts as Finder rows: name, date added, tags. */
export function postRows(posts: Post[]): FinderRow[] {
  return posts.map((p) => ({
    href: url(`/writing/${p.id}/`),
    name: p.data.title,
    tooltip: p.data.dek,
    icon: 'doc',
    date: p.data.date,
    tags: p.data.tags,
  }));
}
