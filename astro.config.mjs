// @ts-check
/// <reference types="node" />
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import { satteriKatex } from './src/lib/satteri-katex.mjs';

// `site` and `base` are injected by the GitHub Pages workflow
// (.github/workflows/deploy.yml). Locally they fall back to a root deploy.
//   SITE_URL  -> canonical origin, e.g. https://allenlu.github.io or https://allenlu.dev
//   BASE_PATH -> "/" for a user site or custom domain, "/<repo>/" for a project site
const site = process.env.SITE_URL ?? 'https://allenlu.dev';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [mdx()],
  markdown: {
    // The design renders code as plain monochrome text on a bevelled panel,
    // so token colouring is switched off rather than themed.
    syntaxHighlight: false,
    // LaTeX: enable Sätteri's math parsing ($inline$, $$display$$) and render
    // the nodes with KaTeX at build time, so no math JavaScript ships to the
    // browser. The MDX integration inherits this processor.
    processor: satteri({
      features: { math: true },
      mdastPlugins: [satteriKatex()],
    }),
  },
});
