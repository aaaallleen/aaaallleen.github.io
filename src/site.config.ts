/**
 * Everything a human is likely to edit lives here: identity, copy, links,
 * and the two "appearance" props the mockup exposed (theme + hero layout).
 * Structured content (experience, projects, skills) is in src/data/.
 */
export type Theme = 'light' | 'night';
export type HeroLayout = 'a' | 'b';

export const site = {
  name: 'Allen Lu',
  brand: 'aaaallleen.github.io',
  /** Label of the site's app icon on the desktop and in the Home folder. */
  appName: 'About me',
  /** Start a fresh visit on the bare desktop (double-click "About me" to open the site). Deep links still open their page. */
  startOnDesktop: true,
  year: 2026,
  email: 'chiaen119@gmail.com',
  location: 'San Diego, CA',
  description:
    'Allen Lu — ML infrastructure engineer at Ambient.AI. GPU inference systems, model compilation, and performance profiling.',

  /** Default theme. Visitors can flip it in the menu bar; the choice persists in localStorage. */
  defaultTheme: 'light' as Theme,

  /** Which hero the home page renders. 'a' = portrait + big name, 'b' = wide image band + headline. */
  heroLayout: 'a' as HeroLayout,

  cv: {
    file: 'assets/allen-lu-cv-2026.pdf',
    downloadName: 'Allen-Lu-CV-2026.pdf',
    label: 'CV 2026.pdf',
    pages: 2,
  },

  hero: {
    kicker: 'ML INFRASTRUCTURE ENGINEER · AMBIENT.AI',
    taglineA:
      'Placeholder tagline goes here — a couple of sentences on what you build and why it matters. GPU inference systems, model compilation paths, and the profiling work that makes real-time computer vision cheap enough to run everywhere.',
    headlineB: 'Allen Lu builds the layer between models and hardware.',
    taglineB:
      'Placeholder tagline goes here — one paragraph on the work, the systems, and the numbers you like moving.',
    statusB: 'SAN DIEGO, CA · AVAILABLE FOR CONVERSATION',
    /** Drop a file in public/images/ and point `src` at it, e.g. 'images/portrait.jpg'. Leave undefined for the placeholder slot. */
    portrait: { src: undefined as string | undefined, alt: 'Portrait of Allen Lu', caption: 'portrait.jpg', placeholder: 'Drop a portrait' },
    band: { src: undefined as string | undefined, alt: '', placeholder: 'Drop a wide image — desk, rack, profiler capture' },
  },

  about: {
    paragraphs: [
      'I work on the layer between models and hardware. At Ambient.AI I moved an eleven-model real-time computer vision pipeline off monolithic PyTorch onto NVIDIA Triton, then spent most of my time in profilers finding out why the GPUs were still idle.',
      'The answers are rarely in the model. They are in graph breaks, kernel launch counts, a global flag contaminating a shared CUDA context, a scheduler that never overlaps preprocessing with execution. I like the part of the job where a number moves because someone finally understood the system.',
      'Before Ambient I studied computer science at UC San Diego and National Tsing Hua University, and did research on reinforcement learning environments for LLM tool use and on cross-spectral estimators for multichannel EEG.',
    ],
  },

  /**
   * Optional Finder-style colours for tags, keyed by tag name. Values: red, orange,
   * yellow, green, blue, purple, gray. Tags not listed get a stable automatic colour.
   *   tagColors: { poker: 'red', 'GPU optimizing': 'green' }
   */
  tagColors: {} as Record<string, 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'gray'>,

  contacts: [
    { k: 'EMAIL', v: 'chiaen119@gmail.com', href: 'mailto:chiaen119@gmail.com' },
    { k: 'GITHUB', v: 'github.com/aaaallleen', href: 'https://github.com/aaaallleen' },
    { k: 'LINKEDIN', v: 'linkedin.com/in/allenlu', href: 'https://linkedin.com/in/allenlu' },
  ],
};
