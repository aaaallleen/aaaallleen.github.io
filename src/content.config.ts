import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Blog posts live in src/content/writing/ as .md or .mdx files.
 * The file name becomes the URL slug: my-post.md -> /writing/my-post/
 * Files starting with "_" (the template) are never published.
 */
const writing = defineCollection({
  loader: glob({ pattern: ['**/*.{md,mdx}', '!**/_*'], base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    /** One-line teaser shown under the title in lists. */
    dek: z.string(),
    /** Free-form tags, e.g. ["GPU optimizing", "poker"]. Each gets a page at /writing/tag/<slug>/. */
    tags: z.array(z.string().min(1)).default([]),
    /** Override the computed reading time (minutes). */
    minutes: z.number().int().positive().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { writing };
