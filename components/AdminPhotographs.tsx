"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";
import type { Collection, Photo } from "@/lib/types";
import AdminPhotoRow from "@/components/AdminPhotoRow";

// The Photographs tab, organised the way Ed thinks about his work: by
// collection. He taps a collection to open it, then adds, reorders, and edits
// only the pictures inside that collection. New pictures go INTO the open
// collection (not always the first one), and the order shown here is the order
// the public site uses.
export default function AdminPhotographs({
  photos,
  setPhotos,
  collections,
  previews,
  uploading,
  triggerCount,
  onFile,
  addPhotos,
  patchPhoto,
  removePhoto,
}: {
  photos: Photo[];
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
  collections: Collection[];
  previews: Record<string, string>;
  uploading: Record<string, boolean>;
  triggerCount: number;
  onFile: (id: string, file: File) => void;
  addPhotos: (
    list: FileList | null,
    slug: string,
    position?: "top" | "bottom",
  ) => void;
  patchPhoto: (id: string, patch: Partial<Photo>) => void;
  removePhoto: (id: string) => void;
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const addInput = useRef<HTMLInputElement>(null);

  // Count + cover for each collection card.
  const counts = useMemo(() => {
    const m: Record<string, { published: number; hidden: number }> = {};
    photos.forEach((p) => {
      m[p.collection] ??= { published: 0, hidden: 0 };
      if (p.published === false) m[p.collection].hidden += 1;
      else m[p.collection].published += 1;
    });
    return m;
  }, [photos]);

  const publishedTotal = photos.filter((p) => p.published !== false).length;
  const hiddenTotal = photos.length - publishedTotal;

  // Resolve a thumbnail src, preferring a freshly-picked preview when the cover
  // points at a photo that hasn't been uploaded to the server yet.
  const thumbFor = (src: string): string => {
    const owner = photos.find((p) => p.src === src);
    if (owner && previews[owner.id]) return previews[owner.id];
    return src;
  };

  const coverFor = (c: Collection): string => {
    const inIt = photos.filter(
      (p) => p.collection === c.slug && p.published !== false,
    );
    const cover =
      c.cover && inIt.some((p) => p.src === c.cover)
        ? c.cover
        : (inIt[0]?.src ?? "");
    return cover ? thumbFor(cover) : "";
  };

  // Reorder helpers operate on the global photos array but only ever swap a
  // photo with its neighbour IN THE SAME COLLECTION, so the public collection
  // page (which filters by collection) ends up in exactly this order.
  const moveWithin = (id: string, dir: -1 | 1) =>
    setPhotos((ps) => {
      const i = ps.findIndex((p) => p.id === id);
      if (i < 0) return ps;
      const slug = ps[i].collection;
      let j = -1;
      if (dir === -1) {
        for (let k = i - 1; k >= 0; k--)
          if (ps[k].collection === slug) {
            j = k;
            break;
          }
      } else {
        for (let k = i + 1; k < ps.length; k++)
          if (ps[k].collection === slug) {
            j = k;
            break;
          }
      }
      if (j < 0) return ps;
      const copy = [...ps];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const moveEdge = (id: string, edge: "top" | "bottom") =>
    setPhotos((ps) => {
      const i = ps.findIndex((p) => p.id === id);
      if (i < 0) return ps;
      const slug = ps[i].collection;
      const item = ps[i];
      const rest = ps.filter((_, k) => k !== i);
      if (edge === "top") {
        const first = rest.findIndex((p) => p.collection === slug);
        const at = first < 0 ? 0 : first;
        return [...rest.slice(0, at), item, ...rest.slice(at)];
      }
      let last = -1;
      rest.forEach((p, k) => {
        if (p.collection === slug) last = k;
      });
      const at = last < 0 ? rest.length : last + 1;
      return [...rest.slice(0, at), item, ...rest.slice(at)];
    });

  const handleMove = (id: string, dir: -1 | 1 | "top" | "bottom") => {
    if (dir === "top" || dir === "bottom") moveEdge(id, dir);
    else moveWithin(id, dir);
  };

  // ---- Folder grid: choose a collection ------------------------------------
  if (!openSlug) {
    return (
      <div className="space-y-6">
        <p className="font-sans text-sm text-ink-muted">
          {publishedTotal} public photographs, {triggerCount} shown on the home
          page{hiddenTotal ? `, and ${hiddenTotal} kept hidden in admin` : ""}.
          Tap a collection to add pictures, put them in the order you want, or
          change their words.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {collections.map((c) => {
            const cover = coverFor(c);
            const count = counts[c.slug] ?? { published: 0, hidden: 0 };
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => setOpenSlug(c.slug)}
                className="group text-left"
              >
                <div className="aspect-[4/3] overflow-hidden bg-paper-soft">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={c.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-sans text-xs text-ink-muted">
                      No photographs yet
                    </div>
                  )}
                </div>
                <p className="mt-2 font-serif text-lg text-ink">{c.name}</p>
                <p className="font-sans text-xs text-ink-muted">
                  {count.published} public photograph
                  {count.published === 1 ? "" : "s"}
                  {count.hidden ? ` · ${count.hidden} hidden` : ""}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---- Open collection: add / reorder / edit -------------------------------
  const collection = collections.find((c) => c.slug === openSlug);
  const inIt = photos.filter((p) => p.collection === openSlug);
  const publicInIt = inIt.filter((p) => p.published !== false).length;
  const hiddenInIt = inIt.length - publicInIt;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpenSlug(null)}
          className="inline-flex items-center gap-1 font-sans text-sm text-ink-muted hover:text-ink"
        >
          <ChevronLeft size={16} /> All collections
        </button>
        <button
          type="button"
          onClick={() => addInput.current?.click()}
          className="inline-flex items-center gap-2 border border-ink/20 px-4 py-2 font-sans text-sm text-ink hover:border-ink"
        >
          <Plus size={16} /> Add photographs to {collection?.name}
        </button>
        <input
          ref={addInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            addPhotos(e.target.files, openSlug, "top");
            e.target.value = "";
          }}
        />
      </div>

      <div>
        <h2 className="font-serif text-2xl font-light text-ink">
          {collection?.name}
        </h2>
        <p className="mt-2 font-sans text-sm text-ink-muted">
          {publicInIt} public photograph{publicInIt === 1 ? "" : "s"}
          {hiddenInIt ? ` and ${hiddenInIt} hidden` : ""}. New pictures go to
          the top — use the arrows to set the order, which is the order they
          appear on your site.
        </p>
      </div>

      {inIt.length === 0 ? (
        <div className="border border-dashed border-ink/20 bg-paper-soft p-10 text-center font-sans text-sm text-ink-muted">
          No photographs in this collection yet. Tap “Add photographs to{" "}
          {collection?.name}” above to put your pictures here.
        </div>
      ) : (
        <div className="space-y-6">
          {inIt.map((p, i) => (
            <AdminPhotoRow
              key={p.id}
              photo={p}
              preview={previews[p.id] ?? p.src}
              collections={collections}
              missingFile={!p.src && !uploading[p.id]}
              uploading={!!uploading[p.id]}
              isFirst={i === 0}
              isLast={i === inIt.length - 1}
              onChange={(patch) => patchPhoto(p.id, patch)}
              onFile={(file) => onFile(p.id, file)}
              onDelete={() => removePhoto(p.id)}
              onMove={(dir) => handleMove(p.id, dir)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
