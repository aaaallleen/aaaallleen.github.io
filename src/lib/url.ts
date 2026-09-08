/**
 * Prefix a site-relative path with Astro's `base` so links survive being
 * hosted at https://<user>.github.io/<repo>/ as well as at a domain root.
 */
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

export function url(path: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  return `${base}/${path.replace(/^\/+/, '')}`;
}
