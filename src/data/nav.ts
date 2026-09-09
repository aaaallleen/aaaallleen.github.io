export type SectionKey = 'home' | 'experience' | 'projects' | 'cv' | 'blog' | 'post' | 'contact' | 'notfound';

export interface NavItem {
  key: SectionKey;
  label: string;
  href: string;
  /** Extra section keys that should light this item up (e.g. a post highlights "Writing"). */
  also?: SectionKey[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const nav: NavGroup[] = [
  { label: 'ONE PAGE', items: [{ key: 'home', label: 'Home (full scroll)', href: '/' }] },
  {
    label: 'PAGES',
    items: [
      { key: 'experience', label: 'Experience', href: '/experience/' },
      { key: 'projects', label: 'Projects', href: '/projects/' },
      { key: 'blog', label: 'Writing', href: '/writing/', also: ['post'] },
      { key: 'contact', label: 'Contact', href: '/contact/' },
    ],
  },
  { label: 'FILES', items: [{ key: 'cv', label: 'CV 2026.pdf', href: '/cv/' }] },
];

/** Window-title-bar text per section (mirrors TITLES in the mockup). */
export const titles: Record<SectionKey, string> = {
  home: 'Allen Lu — Home',
  experience: 'Experience',
  projects: 'Projects',
  cv: 'CV 2026.pdf',
  blog: 'Writing',
  post: 'Writing — post',
  contact: 'Contact',
  notfound: 'File not found',
};
