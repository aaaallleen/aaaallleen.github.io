export type TimelineKind = 'work' | 'edu';

export interface TimelineEntry {
  kind: TimelineKind;
  org: string;
  role: string;
  dates: string;
  bullets: string[];
}

/** Newest first. Work renders on the left of the spine, education on the right. */
export const timeline: TimelineEntry[] = [
  {
    kind: 'work',
    org: 'Ambient.AI',
    role: 'Software Engineer, ML Infrastructure',
    dates: 'FEB 2026 — PRESENT',
    bullets: [
      'Migrated an 11-model real-time CV pipeline from monolithic PyTorch to NVIDIA Triton, enabling independent GPU memory management and concurrent execution.',
      'Cut multi-model inference latency 33% with a pipeline-parallel scheduler, and tensor transport 18× via shared-memory transport.',
      'Reduced cloud inference cost 80% with scale-to-zero autoscaling for idle model replicas.',
    ],
  },
  {
    kind: 'work',
    org: 'GenseeAI Inc.',
    role: 'Research Intern, AI Systems & Infrastructure',
    dates: 'JUN 2025 — SEP 2025',
    bullets: [
      'Architected a sandboxed AI agent execution environment on Docker and AWS ECS/ECR, cutting container startup latency 40%.',
      'Co-developed a full-stack agent serving platform with multi-turn sessions, tool execution, and per-session usage tracking.',
    ],
  },
  {
    kind: 'edu',
    org: 'UC San Diego',
    role: 'M.S. Computer Science',
    dates: 'SEP 2024 — DEC 2025',
    bullets: ['Graduate researcher at Shang Data Lab and the Swartz Center for Computational Neuroscience.'],
  },
  {
    kind: 'work',
    org: 'Taiwan AI Labs',
    role: 'Software Engineer Intern, Algorithm Team',
    dates: 'JUN 2024 — AUG 2024',
    bullets: [
      'Improved Truku translation quality 14% (BLEU 28 → 32) and cut training time 13% with Dynamic Data Selection.',
      'Reached BLEU 37.5 on medical-domain translation via retrieval-augmented data augmentation.',
    ],
  },
  {
    kind: 'edu',
    org: 'National Tsing Hua University',
    role: 'B.S. Computer Science · Hsinchu, Taiwan',
    dates: 'SEP 2019 — JUN 2023',
    bullets: [],
  },
];
