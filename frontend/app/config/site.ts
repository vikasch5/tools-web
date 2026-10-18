/** Brand and navigation config. "Toolbench" is a placeholder name. */
export const site = {
  name: "Toolbench",
  /** Production origin for canonical URLs. Placeholder until a domain is chosen. */
  url: import.meta.env.VITE_SITE_URL ?? "https://toolbench.example",
  tagline: "Small, sharp tools for the jobs in between.",
  /** Placeholder until launch; pages that show it say so. */
  email: "hello@toolbench.example",
} as const;

export type NavLink = { label: string; to: string };

export const primaryNav: NavLink[] = [
  { label: "All tools", to: "/tools" },
  { label: "Help", to: "/help" },
];

export const companyNav: NavLink[] = [
  { label: "About", to: "/about" },
  { label: "Help center", to: "/help" },
  { label: "Contact", to: "/contact" },
];

export const legalNav: NavLink[] = [
  { label: "Privacy policy", to: "/privacy" },
  { label: "Terms of use", to: "/terms" },
];
