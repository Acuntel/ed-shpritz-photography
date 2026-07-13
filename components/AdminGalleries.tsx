"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import type { ClientGallery } from "@/lib/types";

const field =
  "w-full border border-ink/15 bg-paper px-3 py-2 font-sans text-sm text-ink outline-none focus:border-ink/50";
const label = "font-sans text-[11px] uppercase tracking-widest2 text-ink-muted";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function AdminGalleries({
  galleries,
  setGalleries,
  previews,
  uploading,
  addGallery,
  addGalleryPhotos,
}: {
  galleries: ClientGallery[];
  setGalleries: React.Dispatch<React.SetStateAction<ClientGallery[]>>;
  previews: Record<string, string>;
  uploading: Record<string, boolean>;
  addGallery: () => void;
  addGalleryPhotos: (token: string, list: FileList | null) => void;
}) {
  const [origin, setOrigin] = useState("");
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  const patch = (token: string, p: Partial<ClientGallery>) =>
    setGalleries((gs) =>
      gs.map((g) => (g.token === token ? { ...g, ...p } : g)),
    );

  const removeGallery = (token: string) =>
    setGalleries((gs) => gs.filter((g) => g.token !== token));

  const movePhoto = (token: string, i: number, dir: -1 | 1) =>
    setGalleries((gs) =>
      gs.map((g) => {
        if (g.token !== token) return g;
        const j = i + dir;
        if (j < 0 || j >= g.photos.length) return g;
        const photos = [...g.photos];
        [photos[i], photos[j]] = [photos[j], photos[i]];
        return { ...g, photos };
      }),
    );

  const patchPhoto = (
    token: string,
    id: string,
    p: Partial<{ name: string; alt: string }>,
  ) =>
    setGalleries((gs) =>
      gs.map((g) =>
        g.token === token
          ? {
              ...g,
              photos: g.photos.map((ph) =>
                ph.id === id ? { ...ph, ...p } : ph,
              ),
            }
          : g,
      ),
    );

  const removePhoto = (token: string, id: string) =>
    setGalleries((gs) =>
      gs.map((g) =>
        g.token === token
          ? { ...g, photos: g.photos.filter((ph) => ph.id !== id) }
          : g,
      ),
    );

  const applyCode = async (token: string) => {
    const raw = (codes[token] ?? "").trim();
    if (!raw) return;
    patch(token, { passcodeHash: await sha256(raw) });
    setCodes((c) => ({ ...c, [token]: "" }));
  };

  const copyUrl = async (token: string) => {
    try {
      await navigator.clipboard.writeText(`${origin}/gallery/${token}/`);
      setCopied(token);
      setTimeout(() => setCopied((t) => (t === token ? null : t)), 1500);
    } catch {
      /* clipboard blocked — the URL is shown on screen to copy by hand */
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl font-sans text-sm leading-relaxed text-ink-muted">
          Private galleries for the people whose dogs you photograph. Each has a
          secret link — share it (and the passcode, if you set one) only with
          that person. They are never listed on your site or found by Google.
        </p>
        <button
          onClick={addGallery}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-4 py-2 font-sans text-sm text-paper transition-colors hover:bg-ink-soft"
        >
          <Plus size={16} /> New gallery
        </button>
      </div>

      {galleries.length === 0 && (
        <div className="max-w-2xl border border-dashed border-ink/25 bg-paper-soft p-6 text-center">
          <p className="font-sans text-sm leading-relaxed text-ink-muted">
            No private galleries yet. Press{" "}
            <strong className="text-ink">New gallery</strong> to make one: add
            the person’s name and their dog, press{" "}
            <strong className="text-ink">Add photos</strong> to put in their
            pictures, then <strong className="text-ink">Copy link</strong> and
            text or email it to them. Press{" "}
            <strong className="text-ink">Save to my website</strong> when you’re
            done so the link works.
          </p>
        </div>
      )}

      {galleries.map((g) => (
        <div
          key={g.token}
          className="space-y-4 border border-ink/10 bg-paper-soft p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-serif text-xl text-ink">
              {g.client}
              {g.dog ? ` · ${g.dog}` : ""}
            </p>
            <button
              onClick={() => removeGallery(g.token)}
              className="inline-flex items-center gap-1.5 font-sans text-xs text-ink-muted hover:text-red-700"
            >
              <Trash2 size={14} /> Delete gallery
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <code className="break-all bg-paper px-2 py-1 font-sans text-xs text-ink-soft">
              {origin}/gallery/{g.token}/
            </code>
            <button
              onClick={() => copyUrl(g.token)}
              className="inline-flex items-center gap-1.5 border border-ink/20 px-3 py-1 font-sans text-xs text-ink hover:border-ink"
            >
              {copied === g.token ? <Check size={13} /> : <Copy size={13} />}
              {copied === g.token ? "Copied" : "Copy link"}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className={label}>Client name</span>
              <input
                className={field}
                value={g.client}
                onChange={(e) => patch(g.token, { client: e.target.value })}
              />
            </div>
            <div>
              <span className={label}>Dog&apos;s name</span>
              <input
                className={field}
                value={g.dog ?? ""}
                onChange={(e) => patch(g.token, { dog: e.target.value })}
              />
            </div>
          </div>

          <div>
            <span className={label}>Welcome note</span>
            <textarea
              className={`${field} resize-y`}
              rows={3}
              value={g.intro ?? ""}
              onChange={(e) => patch(g.token, { intro: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="grow">
              <span className={label}>
                Passcode {g.passcodeHash ? "(set — type to change)" : "(none)"}
              </span>
              <input
                className={field}
                placeholder={g.passcodeHash ? "•••• set" : "no passcode"}
                value={codes[g.token] ?? ""}
                onChange={(e) =>
                  setCodes((c) => ({ ...c, [g.token]: e.target.value }))
                }
              />
            </div>
            <button
              onClick={() => applyCode(g.token)}
              className="border border-ink/20 px-4 py-2 font-sans text-sm text-ink hover:border-ink"
            >
              Set passcode
            </button>
            {g.passcodeHash && (
              <button
                onClick={() => patch(g.token, { passcodeHash: undefined })}
                className="font-sans text-xs text-ink-muted hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>

          <div className="space-y-2 border-t border-ink/10 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={label}>
                {g.photos.length === 1
                  ? "1 photo"
                  : `${g.photos.length} photos`}
              </p>
              <label className="inline-flex cursor-pointer items-center gap-2 border border-ink/20 px-3 py-1.5 font-sans text-xs text-ink transition-colors hover:border-ink">
                <ImagePlus size={14} /> Add photos
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addGalleryPhotos(g.token, e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {g.photos.length === 0 && (
              <p className="font-sans text-xs text-ink-muted">
                No photos yet — press “Add photos” to put in their pictures.
              </p>
            )}
            {g.photos.map((ph, i) => (
              <div
                key={ph.id}
                className="flex flex-wrap items-center gap-2 bg-paper p-2"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-paper-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previews[ph.id] || ph.src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {uploading[ph.id] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-paper/70">
                      <Loader2
                        size={14}
                        className="animate-spin text-ink-soft"
                      />
                    </div>
                  )}
                </div>
                <input
                  className={`${field} grow`}
                  value={ph.name ?? ""}
                  placeholder="Caption"
                  onChange={(e) =>
                    patchPhoto(g.token, ph.id, { name: e.target.value })
                  }
                />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => movePhoto(g.token, i, -1)}
                    aria-label="Move up"
                    className="p-1.5 text-ink-muted hover:text-ink"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => movePhoto(g.token, i, 1)}
                    aria-label="Move down"
                    className="p-1.5 text-ink-muted hover:text-ink"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={() => removePhoto(g.token, ph.id)}
                    aria-label="Remove photo"
                    className="p-1.5 text-ink-muted hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
