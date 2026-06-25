"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  ImageOff,
  Loader2,
  Trash2,
} from "lucide-react";
import type { Collection, Photo } from "@/lib/types";

const field =
  "w-full border border-ink/15 bg-paper px-3 py-2 font-sans text-sm text-ink outline-none focus:border-ink/50";
const label = "font-sans text-[11px] uppercase tracking-widest2 text-ink-muted";
const moveBtn =
  "rounded border border-ink/15 p-2 text-ink-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-30 disabled:hover:border-ink/15 disabled:hover:text-ink-muted";

export default function AdminPhotoRow({
  photo,
  preview,
  collections,
  missingFile = false,
  uploading = false,
  isFirst = false,
  isLast = false,
  onChange,
  onFile,
  onDelete,
  onMove,
}: {
  photo: Photo;
  preview: string;
  collections: Collection[];
  // This row has no usable picture yet (never chosen, or the last upload
  // failed) — Ed needs to choose one.
  missingFile?: boolean;
  // The picture is currently saving to the website.
  uploading?: boolean;
  // First/last within its collection — used to disable the up/top, down/bottom
  // arrows so Ed never wonders why a tap "did nothing".
  isFirst?: boolean;
  isLast?: boolean;
  onChange: (patch: Partial<Photo>) => void;
  onFile: (file: File) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1 | "top" | "bottom") => void;
}) {
  // A committed src that no longer resolves (e.g. an old draft pointing at a
  // file renamed on the server) would otherwise render as a silent blank box.
  // Treat that the same as a missing file so Ed sees the "choose again" prompt
  // instead of nothing. Reset whenever the picture changes.
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    setLoadFailed(false);
  }, [preview]);
  const needsPhoto = missingFile || loadFailed;

  return (
    <div className="grid grid-cols-1 gap-5 border border-ink/10 bg-paper-soft p-5 sm:grid-cols-[160px_1fr]">
      <div>
        <div className="relative aspect-[4/5] overflow-hidden bg-paper">
          {needsPhoto && !uploading ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-amber-600/50 px-3 text-center">
              <ImageOff size={22} className="text-amber-700" />
              <p className="font-sans text-xs leading-snug text-amber-700">
                This picture needs to be chosen again
              </p>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={photo.alt}
              className="h-full w-full object-cover"
              onError={() => setLoadFailed(true)}
            />
          )}
          {uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-paper/70 text-center">
              <Loader2 size={22} className="animate-spin text-ink-soft" />
              <p className="font-sans text-xs text-ink-soft">Saving…</p>
            </div>
          )}
        </div>
        <label
          className={`mt-2 block cursor-pointer border px-3 py-2 text-center font-sans text-sm transition-colors ${
            needsPhoto
              ? "border-amber-600 text-amber-700 hover:bg-paper"
              : "border-ink/20 text-ink hover:border-ink"
          }`}
        >
          {needsPhoto ? "Choose this photo again" : "Replace photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <span className={label}>Name shown on the site</span>
            <input
              className={field}
              value={photo.name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </div>
          <div>
            <span className={label}>Working title</span>
            <input
              className={field}
              value={photo.title}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </div>
        </div>

        <div>
          <span className={label}>Description</span>
          <textarea
            className={`${field} h-20 resize-y`}
            value={photo.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <span className={label}>Collection</span>
            <select
              className={field}
              value={photo.collection}
              onChange={(e) => onChange({ collection: e.target.value })}
            >
              {collections.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className={label}>Group within collection (optional)</span>
            <input
              className={field}
              value={photo.section ?? ""}
              placeholder="e.g. Fog, Boats, Life"
              onChange={(e) =>
                onChange({
                  section: e.target.value.trim() ? e.target.value : undefined,
                })
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <label className="flex items-center gap-2 font-sans text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={photo.trigger}
                onChange={(e) => onChange({ trigger: e.target.checked })}
              />
              Show on home page
            </label>
            <label className="flex items-center gap-2 font-sans text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={!!photo.award}
                onChange={(e) => onChange({ award: e.target.checked })}
              />
              Award winner ★
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              title="Move to top"
              aria-label="Move to top of collection"
              disabled={isFirst}
              onClick={() => onMove("top")}
              className={moveBtn}
            >
              <ChevronsUp size={18} />
            </button>
            <button
              type="button"
              title="Move up"
              aria-label="Move up"
              disabled={isFirst}
              onClick={() => onMove(-1)}
              className={moveBtn}
            >
              <ChevronUp size={18} />
            </button>
            <button
              type="button"
              title="Move down"
              aria-label="Move down"
              disabled={isLast}
              onClick={() => onMove(1)}
              className={moveBtn}
            >
              <ChevronDown size={18} />
            </button>
            <button
              type="button"
              title="Move to bottom"
              aria-label="Move to bottom of collection"
              disabled={isLast}
              onClick={() => onMove("bottom")}
              className={moveBtn}
            >
              <ChevronsDown size={18} />
            </button>
            <button
              type="button"
              title="Delete this photograph"
              aria-label="Delete this photograph"
              onClick={() => {
                if (
                  confirm(
                    `Delete "${photo.name || "this photograph"}"?\n\nIt will be removed from your website the next time your changes are published. This cannot be undone here.`,
                  )
                )
                  onDelete();
              }}
              className="ml-2 inline-flex items-center gap-1.5 rounded border border-ink/15 px-3 py-2 font-sans text-sm text-ink-muted transition-colors hover:border-red-700 hover:text-red-700"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
