export type Collection = {
  slug: string;
  name: string;
  kicker: string;
  blurb: string;
  cover: string;
  // Computed at load time in lib/data.ts.
  count?: number;
};

export type Photo = {
  id: string;
  src: string;
  alt: string;
  // The name shown beneath the image on the public site (one or two words).
  name: string;
  // The underlying working title, used in the lightbox detail line.
  title: string;
  description: string;
  collection: string;
  // Trigger photos appear on the home page grid.
  trigger: boolean;
  order: number;
  // Computed at load time from public/data/imeta.json (the optimize step).
  optBase?: string;
  optWidths?: number[];
  lqip?: string;
  width?: number;
  height?: number;
};

export type SiteContent = {
  name: string;
  role: string;
  concepts: string[];
  heroLine: string;
  tagline: string;
  heroSub: string;
  intro: string;
  // A short statement shown in the footer (formerly "less is more").
  lessIsMore: string;
  bio: {
    portrait: string;
    heading: string;
    body: string[];
  };
  edisms: string[];
  contactEmail: string;
  location: string;
  ownerName: string;
  prints: {
    available: boolean;
    statement: string;
  };
  // "none" or "subtle" — applied to the full-size image at optimize time.
  watermark: "none" | "subtle";
  // Web3Forms access key. Empty string falls back to a mailto: link.
  formEndpoint: string;
};
