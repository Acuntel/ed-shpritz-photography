export type Collection = {
  slug: string;
  name: string;
  kicker: string;
  blurb: string;
  cover: string;
};

export type Photo = {
  id: string;
  src: string;
  alt: string;
  // The name shown beneath the image on the public site.
  name: string;
  // The underlying working title, used in the lightbox detail line.
  title: string;
  description: string;
  collection: string;
  // Trigger photos appear on the home page grid.
  trigger: boolean;
  order: number;
};

export type SiteContent = {
  name: string;
  role: string;
  concepts: string[];
  heroLine: string;
  heroSub: string;
  intro: string;
  lessIsMore: string;
  bio: {
    portrait: string;
    heading: string;
    body: string[];
  };
  edisms: string[];
  contactEmail: string;
  location: string;
};
