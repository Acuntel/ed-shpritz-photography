import type { Photo } from "./types";

// The caption shown beneath a photograph on the public site. Ed fills two fields
// in the admin: "Name shown on the site" (name) and "Working title" (title).
// When he uploads a batch he often types only the working title — e.g. the bird
// species ("Moorhen", "Osprey") — and leaves the name blank. The grid and
// lightbox display `name`, so those photos would show no writing at all. Fall
// back to the title (then the file's own name) so every photo always keeps a
// caption, no matter which field Ed used.
export function photoLabel(p: Pick<Photo, "name" | "title">): string {
  return p.name?.trim() || p.title?.trim() || "";
}
