# allenlu.dev — personal site

A static personal site built with [Astro](https://astro.build) and deployed to GitHub Pages.
The visual design is a retro desktop window (menu bar, title bar, sidebar, status bar) with a
day / night theme. It was mocked up in Claude Design; the original handoff bundle lives in
[`project/`](project/) for reference and is not part of the build.

## Run it locally

Requires Node 22.12 or newer (`.nvmrc` pins 24 — `nvm use` picks it up).

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run preview    # serve dist/ locally
```

## Where things live

Rule of thumb: a fact about you is in `src/site.config.ts` or `src/data/`; a sentence on one
specific page is in that page under `src/pages/`; a colour or spacing is in `global.css`; how
something behaves is in `desktop.ts`.

### Your content (start here)

| You want to change…                                   | Edit                                        |
| ----------------------------------------------------- | ------------------------------------------- |
| Name, email, location, taglines, hero headline, links | `src/site.config.ts`                        |
| Hero layout (`a` or `b`) and default theme            | `src/site.config.ts`                        |
| Portrait / hero-band image paths                      | `src/site.config.ts` (`hero.portrait.src`)  |
| Work and education timeline                           | `src/data/experience.ts`                    |
| Project cards (tag, title, description, image, link)  | `src/data/projects.ts`                      |
| Skill chips                                           | `src/data/skills.ts`                        |
| The "GET INFO" panel on the home page                 | `src/data/facts.ts`                         |
| Sidebar labels, groups, and window titles             | `src/data/nav.ts`                           |
| Blog posts                                            | `src/content/writing/*.md` or `*.mdx`       |

### Files you drop in

| File                                          | Purpose                                             |
| --------------------------------------------- | --------------------------------------------------- |
| `public/images/…`                             | Portrait, hero band, project tiles, post figures    |
| `public/assets/allen-lu-cv-2026.pdf`          | The CV shown on `/cv/` and behind "Download CV"     |
| `public/CNAME`                                | Optional custom domain for GitHub Pages (see below) |

### Copy that lives in the page templates

Some prose is hard-coded where it appears. Edit the page directly:

| Page              | File                            | What is there                                  |
| ----------------- | ------------------------------- | ---------------------------------------------- |
| Home              | `src/pages/index.astro`         | Section headings (ABOUT ME, RECENT WRITING, …) |
| Experience        | `src/pages/experience.astro`    | Intro sentence, legend labels                  |
| Projects          | `src/pages/projects.astro`      | Intro sentence                                 |
| Writing           | `src/pages/writing/index.astro` | Intro sentence, table headers                  |
| Post              | `src/pages/writing/[slug].astro`| Post layout and article typography             |
| Contact           | `src/pages/contact.astro`       | Intro sentence                                 |
| CV                | `src/pages/cv.astro`            | Viewer header and fallback text                |

### Look and feel

| You want to change…                                  | Edit                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| Colours for both themes, fonts, button styles        | `src/styles/global.css` (tokens at the top)                |
| Window frame: title bar, traffic lights, sidebar grid | `src/layouts/Desktop.astro`                                |
| Menu bar and its dropdowns                           | `src/components/MenuBar.astro`                             |
| Sidebar, toolbar                                     | `src/components/Sidebar.astro`, `Toolbar.astro`            |
| The two hero variants                                | `src/components/HeroA.astro`, `HeroB.astro`                |
| Dock, desktop icons, About dialog                    | `src/components/Dock.astro`, `DesktopIcons.astro`, `AboutDialog.astro` |
| Image placeholder and framed figure                  | `src/components/ImageSlot.astro`, `Figure.astro`           |
| Interactive behaviour (menus, close/minimize/zoom, theme, clock) | `src/scripts/desktop.ts`                       |
| Build settings, site URL, base path, Markdown/math   | `astro.config.mjs`, `src/lib/satteri-katex.mjs`            |

### Writing a post

Every post follows `src/content/writing/_template.mdx`. The quickest way to start one:

```sh
npm run new-post -- "45,000 kernel launches and one global flag"
npm run new-post -- "Post title" --topic Compilation   # set the TOPIC column
npm run new-post -- "Post title" --md                  # plain Markdown, no <Figure>
```

That copies the template to `src/content/writing/<slug>.mdx` with the title, today's date, and
topic filled in. The file name is the URL (`/writing/<slug>/`). New posts start as `draft: true`,
which means they show up in `npm run dev` but not on the live site; set it to `false` to publish.

The frontmatter:

```md
---
title: "Post title"
date: 2026-04-01
dek: "One-line teaser shown in lists."
topic: Profiling
minutes: 7        # optional, otherwise estimated from word count
draft: false
---
```

Conventions the template bakes in, so posts look like the rest of the site:

- The first paragraph renders in darker ink than the rest. Make it the hook.
- `##` headings render as small pixel-font labels, so keep them short and UPPERCASE.
- Code blocks are plain monospace on a bevelled panel (no syntax colours): use them for traces
  and terminal output rather than long listings.
- `>` blockquotes render as bold pull quotes.
- Math is LaTeX between dollar signs: `$…$` inline, `$$…$$` on its own lines for display. It is
  rendered at build time by KaTeX, so nothing math-related runs in the browser. Display math
  sits on the same bevelled panel as code blocks. A formula with a typo renders in red rather
  than failing the build.
- Images go in `public/images/posts/<slug>/` and are placed with the `Figure` component, which
  draws the bevelled frame and caption. Leave `src` off to keep the dashed placeholder while drafting.

Use `.mdx` when a post needs `Figure`; plain `.md` works for everything else:

```mdx
import Figure from '../../components/Figure.astro';

<Figure src="images/posts/my-post/trace.png" alt="Nsight timeline" caption="fig-1-nsight-timeline.png" aspect="16/9" />
```

### Images

Drop files in `public/images/` and reference them by path relative to `public/`, e.g.
`portrait: { src: 'images/portrait.jpg', ... }` in `src/site.config.ts`. Any slot without a
`src` renders the dashed "Drop an image" placeholder from the mockup.

### Hero layout

The mockup had two heroes. `heroLayout: 'a'` (portrait + big name) is the default;
set `'b'` in `src/site.config.ts` for the wide image band + headline variant.

### Desktop interactions

The window chrome is functional, not decorative. All of it lives in `src/scripts/desktop.ts`.

- **Red / yellow / green** close, minimize, and zoom the window. Minimize drops the window into a
  dock at the bottom (click the tile to restore); close hides it entirely. Either way the desktop
  behind it shows two icons in the centre of the screen: the site, which restores the window if it
  was minimized or relaunches it on Home if it was closed, and the CV, which opens the CV page.
  Zoom fills the viewport width.
- **File / View / Help** are real dropdown menus (mouse, touch, and keyboard: arrows, Escape).
  Help → About opens a small "About This Mac"-style panel showing the stack and build date.
- Window state resets on every navigation on purpose, so nobody lands on an empty desktop.
  Only the theme and zoom preferences persist, in `localStorage`.

## Deploying to GitHub Pages

1. Push this repo to GitHub with `main` as the default branch.
2. In the repo go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml`, which builds and publishes `dist/`.

The workflow works out the correct URLs on its own:

- Repo named `<user>.github.io` → served at `https://<user>.github.io/`
- Any other repo name → served at `https://<user>.github.io/<repo>/` (Astro `base` is set automatically)
- A `public/CNAME` file containing your domain → served at `https://<domain>/`

For a custom domain, add the file `public/CNAME` containing e.g. `allenlu.dev` and point the
domain's DNS at GitHub Pages. Every internal link goes through `src/lib/url.ts`, so the site
works under any of the three layouts without code changes.

## Stack

- Astro 7 (static output; the only client JavaScript is the small desktop shell script: theme, clock, menus, window state)
- `@astrojs/mdx` for posts that embed components
- KaTeX for LaTeX, rendered at build time by a small Sätteri plugin (`src/lib/satteri-katex.mjs`)
- Content collections with a typed schema for posts
- Google Fonts (Silkscreen) for the pixel-font chrome; Verdana for body text
