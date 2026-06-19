"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { Collection, Photo } from "@/lib/types";
import { Area, Select, Text } from "@/components/AdminFields";

// The Collections tab: edit each collection's words, choose which photograph is
// its cover, and set the order the collections appear in across the site.
export default function AdminCollections({
  collections,
  setCollections,
  photos,
  previews,
}: {
  collections: Collection[];
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
  photos: Photo[];
  previews: Record<string, string>;
}) {
  const patch = (i: number, p: Partial<Collection>) =>
    setCollections((cs) => cs.map((x, k) => (k === i ? { ...x, ...p } : x)));

  const move = (i: number, dir: -1 | 1) =>
    setCollections((cs) => {
      const j = i + dir;
      if (j < 0 || j >= cs.length) return cs;
      const copy = [...cs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const thumbFor = (src: string): string => {
    const owner = photos.find((p) => p.src === src);
    if (owner && previews[owner.id]) return previews[owner.id];
    return src;
  };

  return (
    <div className="max-w-2xl space-y-8">
      <p className="font-sans text-sm text-ink-muted">
        These are in the order they show on your site. Use the arrows to move a
        collection up or down.
      </p>
      {collections.map((c, i) => {
        const inIt = photos.filter((p) => p.collection === c.slug);
        const resolvedCover =
          c.cover && inIt.some((p) => p.src === c.cover)
            ? c.cover
            : (inIt[0]?.src ?? "");
        return (
          <div
            key={c.slug}
            className="space-y-3 border border-ink/10 bg-paper-soft p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-serif text-xl text-ink">{c.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-xs text-ink-muted">
                  #{i + 1}
                </span>
                <button
                  type="button"
                  aria-label="Move collection up"
                  title="Move up"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  className="rounded border border-ink/15 p-2 text-ink-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-30"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Move collection down"
                  title="Move down"
                  disabled={i === collections.length - 1}
                  onClick={() => move(i, 1)}
                  className="rounded border border-ink/15 p-2 text-ink-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-30"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            <Text
              label="Title"
              value={c.name}
              onChange={(v) => patch(i, { name: v })}
            />
            <Area
              label="Short description (shown on the collections page)"
              value={c.blurb}
              onChange={(v) => patch(i, { blurb: v })}
            />
            <Area
              label="Introduction (shown when this collection is opened)"
              value={c.intro ?? ""}
              onChange={(v) => patch(i, { intro: v.trim() ? v : undefined })}
            />

            <div className="flex items-end gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden bg-paper">
                {resolvedCover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbFor(resolvedCover)}
                    alt={`${c.name} cover`}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex-1">
                <Select
                  label="Cover photograph"
                  value={c.cover ?? ""}
                  options={[
                    { value: "", label: "First photo in the collection" },
                    ...inIt.map((p) => ({
                      value: p.src,
                      label: p.name || p.title || p.src.split("/").pop() || "",
                    })),
                  ]}
                  onChange={(v) => patch(i, { cover: v })}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
