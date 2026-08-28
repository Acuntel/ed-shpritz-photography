"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, LogOut, UploadCloud } from "lucide-react";
import type {
  ClientGallery,
  Collection,
  Photo,
  SiteContent,
} from "@/lib/types";
import AdminGalleries from "@/components/AdminGalleries";
import AdminPhotographs from "@/components/AdminPhotographs";
import AdminCollections from "@/components/AdminCollections";
import AdminStats from "@/components/AdminStats";
import AdminSubscribers from "@/components/AdminSubscribers";
import { Area, Select, Text } from "@/components/AdminFields";
import { sanitizeFilename } from "@/lib/download";
import { measureImage } from "@/lib/measure";
import { upload } from "@vercel/blob/client";

const tabs = [
  "Photographs",
  "Words",
  "Collections",
  "Galleries",
  "Subscribers",
  "Who's looking",
] as const;
type Tab = (typeof tabs)[number];

export const DRAFT_KEY = "edshpritz-admin-draft";
// Only formats every browser can show. Restricting `accept` also makes iPads
// convert HEIC to JPEG automatically when Ed picks from Photos.
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// A private gallery's URL IS its token. The trailing random hex is the real
// access control (unguessable); the name prefix just makes the link readable.
function slugify(s: string): string {
  return (
    (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "guest"
  );
}

function newGalleryToken(seed: string): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(5)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${slugify(seed)}-${hex}`;
}

// Unsaved edits autosaved to this device. Image bytes are NOT kept here — by
// the time a photo is in the list its picture already lives in Blob and `src`
// is a permanent URL, so a reload simply reloads it.
export type AdminDraft = {
  savedAt: number;
  site: SiteContent;
  collections: Collection[];
  photos: Photo[];
  galleries: ClientGallery[];
};

export default function AdminEditor({
  passcode,
  initialSite,
  initialCollections,
  initialPhotos,
  initialGalleries,
  restored,
  pendingDraft,
  paused,
  onRestoreDraft,
  onDiscardDraft,
}: {
  passcode: string;
  initialSite: SiteContent;
  initialCollections: Collection[];
  initialPhotos: Photo[];
  initialGalleries: ClientGallery[];
  // Set when the editor is currently showing a restored draft (opt-in).
  restored?: { savedAt: number } | null;
  // Set when an unsaved draft exists but the editor is showing LIVE content.
  // We OFFER the draft here — we never load it as the base automatically, so a
  // Save can no longer republish a stale draft over the live site.
  pendingDraft?: { savedAt: number } | null;
  // While an undecided draft offer is showing, don't autosave over it.
  paused?: boolean;
  onRestoreDraft?: () => void;
  onDiscardDraft?: () => void;
}) {
  const [tab, setTab] = useState<Tab>("Photographs");
  const [site, setSite] = useState(initialSite);
  const [collections, setCollections] = useState(initialCollections);
  const [galleries, setGalleries] = useState(initialGalleries);
  const [photos, setPhotos] = useState(
    [...initialPhotos].sort((a, b) => a.order - b.order),
  );
  // Transient: object-URL preview shown the instant a file is picked, before
  // its Blob URL is ready. `uploading`/`failed` drive the per-row status.
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  const [notice, setNotice] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [draftAt, setDraftAt] = useState<number | null>(null);

  const uploadingCount = useMemo(
    () => Object.keys(uploading).length,
    [uploading],
  );
  const needPhotoCount = useMemo(
    () =>
      photos.filter((p) => !p.src || failed[p.id]).length +
      galleries.reduce(
        (n, g) => n + g.photos.filter((p) => !p.src || failed[p.id]).length,
        0,
      ),
    [photos, galleries, failed],
  );

  // Autosave edits to this device so a closed tab or a reload never loses work.
  // Suspended while an unresolved draft offer is on screen, so showing the live
  // site does not overwrite the draft Ed may still want to bring back.
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => {
      const draft: AdminDraft = {
        savedAt: Date.now(),
        site,
        collections,
        photos: photos.map((p, i) => ({ ...p, order: i })),
        galleries,
      };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setDraftAt(draft.savedAt);
      } catch {
        // Storage full or blocked — nothing useful to do.
      }
    }, 800);
    return () => clearTimeout(t);
  }, [site, collections, photos, galleries, paused]);

  const patchPhoto = (id: string, patch: Partial<Photo>) =>
    setPhotos((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  // Save one picked file straight to Blob and stamp its URL + dimensions onto
  // the photo. The picture is safe the moment this resolves — no zip, no email,
  // no "the browser lost it".
  const ingest = async (id: string, file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setNotice(
        `"${file.name}" is in a format web browsers cannot show (probably Apple's HEIC). ` +
          `In the Photos app, share or export it as a JPEG, then try again.`,
      );
      return;
    }
    setPreviews((p) => ({ ...p, [id]: URL.createObjectURL(file) }));
    setFailed((f) => {
      const c = { ...f };
      delete c[id];
      return c;
    });
    setUploading((u) => ({ ...u, [id]: true }));
    try {
      const meta = await measureImage(file);
      const blob = await upload(
        `gallery/${id}-${sanitizeFilename(file.name)}`,
        file,
        {
          access: "public",
          handleUploadUrl: "/api/upload/",
          contentType: file.type,
          clientPayload: passcode,
        },
      );
      patchPhoto(id, {
        src: blob.url,
        width: meta.width,
        height: meta.height,
        lqip: meta.lqip,
      });
    } catch {
      setFailed((f) => ({ ...f, [id]: true }));
      setNotice(
        "That picture could not be saved just now. Please check your internet and choose it again.",
      );
    } finally {
      setUploading((u) => {
        const c = { ...u };
        delete c[id];
        return c;
      });
    }
  };

  // Replace the picture on an existing row.
  const onFile = (id: string, file: File) => {
    void ingest(id, file);
  };

  // "Add photographs" — new rows appear immediately (with a preview + a spinner)
  // INSIDE the open collection, then each picture saves itself to Blob.
  const addPhotos = (
    list: FileList | null,
    slug: string,
    position: "top" | "bottom" = "top",
  ) => {
    if (!list || list.length === 0) return;
    const picked = Array.from(list);
    const rejected = picked.filter((f) => !ACCEPTED_TYPES.includes(f.type));
    const accepted = picked.filter((f) => ACCEPTED_TYPES.includes(f.type));
    if (rejected.length) {
      setNotice(
        `${rejected.length} picture${rejected.length === 1 ? "" : "s"} could not be added ` +
          "(probably Apple's HEIC format). Export them as JPEG from Photos and try again.",
      );
    }
    if (!accepted.length) return;

    const base = Date.now();
    const items = accepted.map((file, i) => ({
      id: `p-${base}-${i}`,
      file,
    }));
    const rows: Photo[] = items.map(({ id }) => ({
      id,
      src: "",
      alt: "Photograph by Ed Shpritz",
      name: "Untitled",
      title: "untitled",
      description: "",
      collection: slug,
      published: true,
      trigger: false,
      order: 0,
    }));

    setPhotos((ps) => {
      if (position === "top") {
        const first = ps.findIndex((p) => p.collection === slug);
        const at = first < 0 ? 0 : first;
        return [...ps.slice(0, at), ...rows, ...ps.slice(at)];
      }
      let last = -1;
      ps.forEach((p, k) => {
        if (p.collection === slug) last = k;
      });
      const at = last < 0 ? ps.length : last + 1;
      return [...ps.slice(0, at), ...rows, ...ps.slice(at)];
    });

    items.forEach(({ id, file }) => void ingest(id, file));
  };

  const removePhoto = (id: string) =>
    setPhotos((ps) => ps.filter((p) => p.id !== id));

  // --- Private client galleries (for the people whose dogs Ed photographs) ---
  // Ed can now make one himself: a new gallery gets an unguessable secret link,
  // and he adds the person's photos the same upload-on-pick way as the site.
  const addGallery = () => {
    const token = newGalleryToken("guest");
    setGalleries((gs) => [
      { token, client: "", dog: "", intro: "", photos: [] },
      ...gs,
    ]);
    setTab("Galleries");
  };

  // Upload one picked file straight to Blob and stamp its URL + dimensions onto
  // the matching gallery photo. Full quality — a client gallery is the person's
  // own photos to keep and download.
  const ingestGalleryPhoto = async (token: string, id: string, file: File) => {
    setPreviews((p) => ({ ...p, [id]: URL.createObjectURL(file) }));
    setFailed((f) => {
      const c = { ...f };
      delete c[id];
      return c;
    });
    setUploading((u) => ({ ...u, [id]: true }));
    try {
      const meta = await measureImage(file);
      const blob = await upload(
        `private/${token}/${id}-${sanitizeFilename(file.name)}`,
        file,
        {
          access: "public",
          handleUploadUrl: "/api/upload/",
          contentType: file.type,
          clientPayload: passcode,
        },
      );
      setGalleries((gs) =>
        gs.map((g) =>
          g.token === token
            ? {
                ...g,
                photos: g.photos.map((ph) =>
                  ph.id === id
                    ? {
                        ...ph,
                        src: blob.url,
                        width: meta.width,
                        height: meta.height,
                        lqip: meta.lqip,
                      }
                    : ph,
                ),
              }
            : g,
        ),
      );
    } catch {
      setFailed((f) => ({ ...f, [id]: true }));
      setNotice(
        "That picture could not be saved just now. Please check your internet and choose it again.",
      );
    } finally {
      setUploading((u) => {
        const c = { ...u };
        delete c[id];
        return c;
      });
    }
  };

  const addGalleryPhotos = (token: string, list: FileList | null) => {
    if (!list || list.length === 0) return;
    const picked = Array.from(list);
    const rejected = picked.filter((f) => !ACCEPTED_TYPES.includes(f.type));
    const accepted = picked.filter((f) => ACCEPTED_TYPES.includes(f.type));
    if (rejected.length) {
      setNotice(
        `${rejected.length} picture${rejected.length === 1 ? "" : "s"} could not be added ` +
          "(probably Apple's HEIC format). Export them as JPEG from Photos and try again.",
      );
    }
    if (!accepted.length) return;
    const base = Date.now();
    const items = accepted.map((file, i) => ({
      id: `${token}-${base}-${i}`,
      file,
    }));
    const rows = items.map(({ id }) => ({
      id,
      src: "",
      alt: "Photograph by Ed Shpritz",
      name: "",
    }));
    setGalleries((gs) =>
      gs.map((g) =>
        g.token === token ? { ...g, photos: [...g.photos, ...rows] } : g,
      ),
    );
    items.forEach(({ id, file }) => void ingestGalleryPhoto(token, id, file));
  };

  const triggerCount = useMemo(
    () => photos.filter((p) => p.trigger && p.published !== false).length,
    [photos],
  );

  // The one button that matters: publish everything to the live site. No zip,
  // no email, no Brady — the website updates within seconds.
  const publish = async () => {
    if (uploadingCount > 0) {
      setNotice(
        "A picture is still being saved. Give it a moment, then try again.",
      );
      return;
    }
    if (needPhotoCount > 0) {
      setNotice(
        `${needPhotoCount} picture${needPhotoCount === 1 ? "" : "s"} still need a photo chosen — look for the orange notes below.`,
      );
      return;
    }
    setPublishing(true);
    setNotice(null);
    try {
      const ordered = photos.map((p, i) => ({ ...p, order: i }));
      const res = await fetch("/api/content/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode,
          content: { site, collections, photos: ordered, galleries },
        }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || "Your changes could not be saved.");
      }
      setSavedAt(Date.now());
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }
    } catch (e) {
      setNotice(
        (e as Error).message ||
          "Your changes could not be saved. Please try again.",
      );
    } finally {
      setPublishing(false);
    }
  };

  const logout = () => {
    if (!confirm("Sign out? Your editing stays saved on this device.")) return;
    sessionStorage.removeItem("edshpritz-admin");
    sessionStorage.removeItem("edshpritz-admin-pass");
    location.href = "/";
  };

  const discardDraft = () => {
    if (
      !confirm(
        "Throw away your unsaved changes and start over from what is on the live site?",
      )
    )
      return;
    onDiscardDraft?.();
  };

  return (
    <div className="pt-24">
      <div className="container-rail">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-5">
          <div>
            <p className="kicker">Ed Shpritz Photography</p>
            <h1 className="mt-1 font-serif text-3xl font-light text-ink">
              Manage the site
            </h1>
            <p className="mt-1 font-sans text-xs text-ink-muted">
              {savedAt
                ? `Published to your live website ✓ · ${new Date(savedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                : draftAt
                  ? `Your work is saved on this device. Press “Save to my website” to make it live.`
                  : "Make your changes, then press “Save to my website” to put them live."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={publish}
              disabled={publishing || uploadingCount > 0}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-sans text-sm text-paper transition-colors hover:bg-ink-soft disabled:opacity-60"
            >
              {publishing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <UploadCloud size={16} />
              )}
              {publishing
                ? "Saving to your website..."
                : uploadingCount > 0
                  ? "Saving pictures..."
                  : "Save to my website"}
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 font-sans text-sm text-ink-muted hover:text-ink"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>

        {pendingDraft && (
          <div className="mt-5 border border-amber-600/40 bg-paper-soft p-4 font-sans text-sm text-ink-soft">
            <p>
              You are looking at <strong className="text-ink">your live
              website</strong> — exactly what visitors see right now.
            </p>
            <p className="mt-2">
              You also have some unsaved changes from{" "}
              {new Date(pendingDraft.savedAt).toLocaleString(undefined, {
                dateStyle: "long",
                timeStyle: "short",
              })}{" "}
              that were never saved to your website. They are{" "}
              <strong className="text-ink">not</strong> shown below.
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <button
                onClick={() => onRestoreDraft?.()}
                className="underline hover:text-ink"
              >
                Bring those changes back
              </button>
              <button
                onClick={discardDraft}
                className="underline hover:text-ink"
              >
                Throw them away
              </button>
            </div>
          </div>
        )}

        {restored && (
          <div className="mt-5 border border-ink/15 bg-paper-soft p-4 font-sans text-sm text-ink-soft">
            You are looking at your unsaved changes from{" "}
            {new Date(restored.savedAt).toLocaleString(undefined, {
              dateStyle: "long",
              timeStyle: "short",
            })}
            . Press “Save to my website” to put them live, or{" "}
            <button onClick={discardDraft} className="underline hover:text-ink">
              start over from the live site
            </button>
            .
          </div>
        )}

        {savedAt && (
          <div className="mt-5 flex items-center gap-2 border border-wash-300 bg-wash-50 p-4 font-sans text-sm text-wash-800">
            <Check size={18} className="shrink-0 text-green-700" />
            <p>
              <strong className="text-ink">Your website is updated.</strong>{" "}
              Your changes are live now.{" "}
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-ink"
              >
                See your site
              </a>
              .
            </p>
          </div>
        )}

        {notice && (
          <div className="mt-5 flex items-start justify-between gap-4 border border-amber-600/40 bg-paper-soft p-4 font-sans text-sm text-amber-800">
            <p>{notice}</p>
            <button
              onClick={() => setNotice(null)}
              className="shrink-0 underline hover:text-ink"
            >
              OK
            </button>
          </div>
        )}

        <div className="mt-6 flex gap-6 border-b border-ink/10">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 pb-3 font-sans text-sm transition-colors ${
                tab === t
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="container-rail py-10">
        {tab === "Photographs" && (
          <AdminPhotographs
            photos={photos}
            setPhotos={setPhotos}
            collections={collections}
            previews={previews}
            uploading={uploading}
            triggerCount={triggerCount}
            onFile={onFile}
            addPhotos={addPhotos}
            patchPhoto={patchPhoto}
            removePhoto={removePhoto}
          />
        )}

        {tab === "Words" && (
          <div className="max-w-2xl space-y-5">
            <Text
              label="Site title (the question in the browser tab + footer)"
              value={site.titleQuestion}
              onChange={(v) => setSite({ ...site, titleQuestion: v })}
            />
            <Text
              label="Hero line (the big opening words)"
              value={site.heroLine}
              onChange={(v) => setSite({ ...site, heroLine: v })}
            />
            <Text
              label="Tagline (under the hero line)"
              value={site.tagline}
              onChange={(v) => setSite({ ...site, tagline: v })}
            />
            <Text
              label="Hero subtitle"
              value={site.heroSub}
              onChange={(v) => setSite({ ...site, heroSub: v })}
            />
            <Area
              label="Intro"
              value={site.intro}
              onChange={(v) => setSite({ ...site, intro: v })}
            />
            <Area
              label="Footer statement"
              value={site.lessIsMore}
              onChange={(v) => setSite({ ...site, lessIsMore: v })}
            />
            <Text
              label="Bio heading"
              value={site.bio.heading}
              onChange={(v) =>
                setSite({ ...site, bio: { ...site.bio, heading: v } })
              }
            />
            <Area
              label="Bio (leave a blank line between paragraphs)"
              value={site.bio.body.join("\n\n")}
              rows={8}
              onChange={(v) =>
                setSite({
                  ...site,
                  bio: { ...site.bio, body: v.split(/\n\n+/).filter(Boolean) },
                })
              }
            />
            <Area
              label="Ed'isms (one per line)"
              value={site.edisms.join("\n")}
              rows={6}
              onChange={(v) =>
                setSite({
                  ...site,
                  edisms: v
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
            <Text
              label="Contact email"
              value={site.contactEmail}
              onChange={(v) => setSite({ ...site, contactEmail: v })}
            />
            <Text
              label="Location"
              value={site.location}
              onChange={(v) => setSite({ ...site, location: v })}
            />
            <Area
              label="Prints statement"
              value={site.prints.statement}
              onChange={(v) =>
                setSite({ ...site, prints: { ...site.prints, statement: v } })
              }
            />
            <Select
              label="Watermark on full-size images"
              value={site.watermark}
              options={[
                { value: "none", label: "None" },
                { value: "subtle", label: "Subtle" },
              ]}
              onChange={(v) =>
                setSite({ ...site, watermark: v as "none" | "subtle" })
              }
            />
          </div>
        )}

        {tab === "Who's looking" && <AdminStats passcode={passcode} />}

        {tab === "Subscribers" && <AdminSubscribers passcode={passcode} />}

        {tab === "Collections" && (
          <AdminCollections
            collections={collections}
            setCollections={setCollections}
            photos={photos}
            previews={previews}
          />
        )}

        {tab === "Galleries" && (
          <AdminGalleries
            galleries={galleries}
            setGalleries={setGalleries}
            previews={previews}
            uploading={uploading}
            addGallery={addGallery}
            addGalleryPhotos={addGalleryPhotos}
          />
        )}
      </div>
    </div>
  );
}
