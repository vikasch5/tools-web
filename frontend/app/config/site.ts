/** Brand and navigation config. */
export const site = {
  name: "AllToolsDesk",
  /** Production origin for canonical URLs. */
  url: import.meta.env.VITE_SITE_URL ?? "https://alltoolsdesk.com",
  tagline: "Small, sharp tools for the jobs in between.",
  email: "hello@alltoolsdesk.com",
} as const;

/**
 * Google AdSense. Everything is off until a publisher ID is set at build time,
 * so no ad script, ad slot or ads.txt record ships before the account exists.
 * - VITE_ADSENSE_CLIENT: publisher ID, "ca-pub-1234567890123456".
 * - VITE_ADSENSE_SLOT: ID of a display ad unit for the in-page slots. Without
 *   it only the site-verification tag and Auto ads (if enabled in AdSense) apply.
 */
const adClient = import.meta.env.VITE_ADSENSE_CLIENT?.trim() || undefined;
if (adClient && !/^ca-pub-\d{10,20}$/.test(adClient)) {
  throw new Error(`VITE_ADSENSE_CLIENT must look like "ca-pub-1234567890123456", got "${adClient}"`);
}

export const ads = {
  client: adClient,
  /** "pub-…" form used in ads.txt. */
  publisherId: adClient?.replace(/^ca-/, ""),
  slot: (adClient && import.meta.env.VITE_ADSENSE_SLOT?.trim()) || undefined,
  enabled: adClient !== undefined,
} as const;

export type NavLink = { label: string; to: string };

export const primaryNav: NavLink[] = [
  { label: "About", to: "/about" },
  { label: "Help", to: "/help" },
  { label: "Contact", to: "/contact" },
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
