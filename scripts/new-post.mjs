#!/usr/bin/env node
/**
 * Create a new blog post from src/content/writing/_template.mdx
 *
 *   npm run new-post -- "Post title"
 *   npm run new-post -- "Post title" --tags "poker, personal thoughts"
 *   npm run new-post -- "Post title" --md        # plain Markdown, no <Figure> component
 *
 * The new post starts as draft: true so it shows in `npm run dev` but not on the live site.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const words = [];
let tags = ['GPU optimizing'];
let ext = 'mdx';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--tags') tags = (args[++i] ?? '').split(',').map((t) => t.trim()).filter(Boolean);
  else if (args[i] === '--md') ext = 'md';
  else words.push(args[i]);
}
const title = words.join(' ').trim();
if (!title) {
  console.error('Usage: npm run new-post -- "Post title" [--tags "a, b"] [--md]');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const dir = resolve('src/content/writing');
const dest = resolve(dir, `${slug}.${ext}`);
if (existsSync(dest)) {
  console.error(`Already exists: ${dest}`);
  process.exit(1);
}

let body = readFileSync(resolve(dir, '_template.mdx'), 'utf8');
const now = new Date();
const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-'); // local date, not UTC
body = body
  .replace(/^title: .*$/m, `title: "${title.replace(/"/g, '\\"')}"`)
  .replace(/^date: .*$/m, `date: ${today}`)
  .replace(/^tags: .*$/m, `tags: ${JSON.stringify(tags)}`)
  // Drop the "how to use this template" banner from the new post.
  .replace(/^# ─── Post template[\s\S]*?\n\n/m, '');

if (ext === 'md') {
  body = body
    .replace(/^import Figure.*\n\n?/m, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}\n\n?/g, '') // MDX comments are not valid Markdown
    .replace(/<Figure[\s\S]*?\/>\n\n?/g, '');
}

writeFileSync(dest, body);
console.log(`Created src/content/writing/${slug}.${ext}`);
console.log(`→ /writing/${slug}/   (draft: true — set to false when ready to publish)`);
