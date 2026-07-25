export type Collection = {
  slug: string;
  name: string;
  // A short label that used to sit above the title on the overview/collection
  // pages. Ed asked for these to be hidden, so they are no longer rendered on
  // the public site — kept in the data only for the admin/legacy reference.
  kicker: string;
  blurb: string;
  // A longer introduction shown ONLY on the individual collection page, beneath
  // the title. The overview page keeps the short `blurb`.
  intro?: string;
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
  // Optional subgroup within a collection (e.g. "Fog", "Boats Beached",
  // "Life"). Consecutive photos sharing a section render under one heading.
  section?: string;
  // Trigger photos appear on the home page grid.
  trigger: boolean;
  // Award-winning images carry a small star/asterisk on the site. Ed marks
  // these in the admin; defaults to false.
  award?: boolean;
  order: number;
  // Computed at load time from public/data/imeta.json (the optimize step).
  optBase?: string;
  optWidths?: number[];
  lqip?: string;
  width?: number;
  height?: number;
};

// A single image inside a private client gallery. Served at full quality and
// downloadable — these are the customer's own photos, the opposite of the
// public site (where the print master is never served).
export type GalleryPhoto = {
  id: string;
  src: string;
  alt: string;
  // Optional one- or two-word caption shown beneath the image.
  name?: string;
  // Optimize meta (only present if the image was run through scripts/optimize.mjs).
  optBase?: string;
  optWidths?: number[];
  lqip?: string;
  width?: number;
  height?: number;
};

// A private, unlisted gallery for one person/dog Ed photographed. Reached only
// by its unguessable token URL (/gallery/<token>/), never linked or indexed.
// An optional passcode adds a soft second gate (see components/PrivateGallery).
export type ClientGallery = {
  // Unguessable URL slug — the primary access control on a static site.
  token: string;
  // Who it's for, e.g. "The Johnson Family".
  client: string;
  // The dog's name, e.g. "Marley".
  dog?: string;
  // A short welcome note from Ed shown at the top of the gallery.
  intro?: string;
  // SHA-256 hex of an optional passcode. Empty/undefined = no passcode gate.
  passcodeHash?: string;
  photos: GalleryPhoto[];
};

export type SiteContent = {
  name: string;
  role: string;
  // The site's overarching title/question, shown in the browser tab and footer.
  titleQuestion: string;
  concepts: string[];
  heroLine: string;
  tagline: string;
  heroSub: string;
  intro: string;
  // A short statement shown in the footer (formerly "less is more").
  lessIsMore: string;
  // Optional path to Ed's cartoon/self-portrait illustration, shown small in
  // the lower-right of the closing statement. Empty string = nothing rendered.
  cartoon?: string;
  // The closing statement on the About page ("the last page"): a headline,
  // two short lines, and the awards note. Cartoon (above) sits lower-right.
  closing?: {
    headline: string;
    thankYou: string;
    didYouSee: string;
    awards: string;
  };
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
  // Legacy — the contact form was replaced by a direct email link; kept only
  // because saved content still carries the field.
  formEndpoint: string;
};
