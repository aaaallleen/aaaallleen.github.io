export interface Project {
  tag: string;
  title: string;
  description: string;
  /** Path under public/, e.g. 'images/projects/triton.png'. Undefined renders the placeholder slot. */
  image?: string;
  alt?: string;
  href?: string;
}

const PLACEHOLDER =
  'Placeholder description. One or two lines on what the project does and what made it interesting to build.';

export const projects: Project[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  tag: `PLACEHOLDER 0${n}`,
  title: `Project title ${n}`,
  description: PLACEHOLDER,
}));
