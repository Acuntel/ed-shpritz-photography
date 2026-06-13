"use client";

import { ChevronDown, ChevronUp, ImageOff, Trash2 } from "lucide-react";
import type { Collection, Photo } from "@/lib/types";

const field =
  "w-full border border-ink/15 bg-paper px-3 py-2 font-sans text-sm text-ink outline-none focus:border-ink/50";
const label = "font-sans text-[11px] uppercase tracking-widest2 text-ink-muted";

export default function AdminPhotoRow({
  photo,
  preview,
  collections,
  missingFile = false,
  onChange,
  onFile,
  onDelete,
  onMove,
}: {
  photo: Photo;
  preview: string;
  collections: Collection[];
  // The photo was picked in an earlier visit; the browser could not keep the
  // image itself, so Ed needs to choose this picture again.
  missingFile?: boolean;
  onChange: (patch: Partial<Photo>) => void;
  onFile: (file: File) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 border border-ink/10 bg-paper-soft p-5 sm:grid-cols-[160px_1fr]">
      <div>
        <div className="aspect-[4/5] overflow-hidden bg-paper">
          {missingFile ? (
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
            />
          )}
        </div>
        <label
          className={`mt-2 block cursor-pointer border px-3 py-2 text-center font-sans text-sm transition-colors ${
            missingFile
              ? "border-amber-600 text-amber-700 hover:bg-paper"
              : "border-ink/20 text-ink hover:border-ink"
          }`}
        >
          {missingFile ? "Choose this photo again" : "Replace photo"}
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

        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px] flex-1">
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
          <label className="flex items-center gap-2 pb-2 font-sans text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={photo.trigger}
              onChange={(e) => onChange({ trigger: e.target.checked })}
            />
            Show on home page
          </label>
          <div className="ml-auto flex items-center gap-1 pb-1">
            <button
              type="button"
              aria-label="Move up"
              onClick={() => onMove(-1)}
              className="p-1 text-ink-muted hover:text-ink"
            >
              <ChevronUp size={18} />
            </button>
            <button
              type="button"
              aria-label="Move down"
              onClick={() => onMove(1)}
              className="p-1 text-ink-muted hover:text-ink"
            >
              <ChevronDown size={18} />
            </button>
            <button
              type="button"
              aria-label="Delete"
              onClick={onDelete}
              className="p-1 text-ink-muted hover:text-red-700"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
