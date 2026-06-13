"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Send, LogOut } from "lucide-react";
import type {
  ClientGallery,
  Collection,
  Photo,
  SiteContent,
} from "@/lib/types";
import AdminPhotoRow from "@/components/AdminPhotoRow";
import AdminGalleries from "@/components/AdminGalleries";
import { sanitizeFilename } from "@/lib/download";
import { buildZip, downloadBlob } from "@/lib/zip";
import { upload } from "@vercel/blob/client";

const field =
  "w-full border border-ink/15 bg-paper px-3 py-2 font-sans text-sm text-ink outline-none focus:border-ink/50";
const label = "font-sans text-[11px] uppercase tracking-widest2 text-ink-muted";
const tabs = ["Photographs", "Words", "Collections", "Galleries"] as const;
type Tab = (typeof tabs)[number];

export const DRAFT_KEY = "edshpritz-admin-draft";
const BRADY_EMAIL = "bradyschwartz25@gmail.com";
// One-tap send: the ed-uploads Vercel project stores the zip and emails Brady
// a download link. The key only gates the notify endpoint against drive-by
// spam — it is public in this bundle by design (static site, no secrets).
const UPLOAD_API = "https://ed-uploads.vercel.app";
const NOTIFY_KEY = "305ff55ea622419f65238c2bc2dc7d86";
// HEIC previews fine in Safari but breaks for Chrome/Firefox visitors, so we
// only accept formats every browser can show. Restricting `accept` also makes
// iPads convert HEIC to JPEG automatically when picking from Photos.
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Edits autosaved to this device. The browser cannot keep picked image BYTES
// across a reload, so those are tracked by name in pendingFiles and the row
// asks Ed to choose that picture again.
export type AdminDraft = {
  savedAt: number;
  site: SiteContent;
  collections: Collection[];
  photos: Photo[];
  galleries: ClientGallery[];
  pendingFiles: Record<string, string>;
};

export default function AdminEditor({
  initialSite,
  initialCollections,
  initialPhotos,
  initialGalleries,
  restored,
  onDiscardDraft,
}: {
  initialSite: SiteContent;
  initialCollections: Collection[];
  initialPhotos: Photo[];
  initialGalleries: ClientGallery[];
  restored?: { savedAt: number; pendingFiles: Record<string, string> } | null;
  onDiscardDraft?: () => void;
}) {
  const [tab, setTab] = useState<Tab>("Photographs");
  const [site, setSite] = useState(initialSite);
  const [collections, setCollections] = useState(initialCollections);
  const [galleries, setGalleries] = useState(initialGalleries);
  const [photos, setPhotos] = useState(
    [...initialPhotos].sort((a, b) => a.order - b.order),
  );
  const [files, setFiles] = useState<Record<string, File>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<Record<string, string>>(
    restored?.pendingFiles ?? {},
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [sent, setSent] = useState<null | {
    filename: string;
    how: "uploaded" | "shared" | "downloaded";
    missingNames: string[];
  }>(null);
  const [building, setBuilding] = useState(false);
  const addInput = useRef<HTMLInputElement>(null);

  // Autosave every edit to this device so a closed tab, a back-swipe, or an
  // iPad reloading the page never loses Ed's work.
  useEffect(() => {
    const t = setTimeout(() => {
      const pendingFiles: Record<string, string> = {};
      photos.forEach((p) => {
        if (files[p.id]) pendingFiles[p.id] = files[p.id].name;
        else if (pending[p.id]) pendingFiles[p.id] = pending[p.id];
      });
      const draft: AdminDraft = {
        savedAt: Date.now(),
        site,
        collections,
        photos: photos.map((p, i) => ({ ...p, order: i })),
        galleries,
        pendingFiles,
      };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // Storage full or blocked — nothing useful to do.
      }
    }, 800);
    return () => clearTimeout(t);
  }, [site, collections, photos, galleries, files, pending]);

  const patchPhoto = (id: string, patch: Partial<Photo>) =>
    setPhotos((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const acceptFile = (id: string, file: File): boolean => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setNotice(
        `"${file.name}" is in a format web browsers cannot show (probably Apple's HEIC). ` +
          `In the Photos app, share or export it as a JPEG, then try again.`,
      );
      return false;
    }
    setFiles((f) => ({ ...f, [id]: file }));
    setPreviews((p) => ({ ...p, [id]: URL.createObjectURL(file) }));
    setPending((pd) => {
      const copy = { ...pd };
      delete copy[id];
      return copy;
    });
    return true;
  };

  const onFile = (id: string, file: File) => {
    const target = `/images/uploads/${id}-${sanitizeFilename(file.name)}`;
    if (acceptFile(id, file)) patchPhoto(id, { src: target });
  };

  // "Add photographs" opens the picker straight away — a new row only ever
  // exists WITH Ed's picture in it, and it appears at the top of the list.
  const addPhotos = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const rows: Photo[] = [];
    Array.from(list).forEach((file, i) => {
      const id = `p-${Date.now()}-${i}`;
      if (!acceptFile(id, file)) return;
      rows.push({
        id,
        src: `/images/uploads/${id}-${sanitizeFilename(file.name)}`,
        alt: "Photograph by Ed Shpritz",
        name: "Untitled",
        title: "untitled",
        description: "",
        collection: collections[0]?.slug ?? "",
        trigger: false,
        order: 0,
      });
    });
    if (rows.length) {
      setPhotos((ps) => [...rows, ...ps]);
      setSent(null);
    }
  };

  const removePhoto = (id: string) =>
    setPhotos((ps) => ps.filter((p) => p.id !== id));

  const movePhoto = (id: string, dir: -1 | 1) =>
    setPhotos((ps) => {
      const i = ps.findIndex((p) => p.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ps.length) return ps;
      const copy = [...ps];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const triggerCount = useMemo(
    () => photos.filter((p) => p.trigger).length,
    [photos],
  );

  const pendingCount = useMemo(
    () => photos.filter((p) => pending[p.id] && !files[p.id]).length,
    [photos, pending, files],
  );

  // Everything goes into ONE zip (Safari and iPads drop extra simultaneous
  // downloads). The share sheet can hand it straight to Mail; otherwise it
  // downloads and the banner explains exactly what to email to Brady.
  const exportAll = async () => {
    setBuilding(true);
    setNotice(null);
    try {
      const ordered = photos.map((p, i) => ({ ...p, order: i }));
      const missingNames = photos
        .filter((p) => pending[p.id] && !files[p.id])
        .map((p) => p.name);
      // Local date, not UTC — an evening export must not be "dated tomorrow".
      const stamp = new Date().toLocaleDateString("en-CA");
      const filename = `ed-website-update-${stamp}.zip`;
      const readme = [
        `Website update exported from /admin on ${new Date().toLocaleString()}.`,
        ``,
        `To publish:`,
        `1. Copy the four files in data/ into public/data/ (replace the old ones).`,
        `2. Copy everything in uploads/ into public/images/uploads/.`,
        `3. Run: node scripts/optimize.mjs && npm run build`,
        `4. Deploy: npx vercel --prod --yes`,
        ``,
        `If photos.json points at an /images/uploads/ file that is not in this`,
        `zip, Ed picked it in an earlier session and the browser could not keep`,
        `the bytes — ask him to open that photo's row and choose it again.`,
      ].join("\n");
      const zipFiles: { name: string; data: string | Blob }[] = [
        { name: "README-FOR-BRADY.txt", data: readme },
        { name: "data/photos.json", data: JSON.stringify(ordered, null, 2) },
        { name: "data/site.json", data: JSON.stringify(site, null, 2) },
        {
          name: "data/collections.json",
          data: JSON.stringify(collections, null, 2),
        },
        {
          name: "data/galleries.json",
          data: JSON.stringify(galleries, null, 2),
        },
      ];
      Object.entries(files).forEach(([id, file]) => {
        const p = ordered.find((x) => x.id === id);
        if (p) {
          zipFiles.push({
            name: `uploads/${p.src.split("/").pop()}`,
            data: file,
          });
        }
      });
      const blob = await buildZip(zipFiles);
      // Best path: the file goes straight to Brady — upload to storage, then
      // a server function emails him the download link. Ed does nothing else.
      try {
        const uploaded = await upload(filename, blob, {
          access: "public",
          handleUploadUrl: `${UPLOAD_API}/api/upload`,
          contentType: "application/zip",
          multipart: true,
        });
        const notifyRes = await fetch(`${UPLOAD_API}/api/notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: NOTIFY_KEY,
            filename,
            url: uploaded.url,
            size: blob.size,
            photoCount: ordered.length,
          }),
        });
        if (!notifyRes.ok) throw new Error("notify failed");
        setSent({ filename, how: "uploaded", missingNames });
        return;
      } catch {
        // Offline or the upload service is down — fall back to share/download.
      }
      const zipAsFile = new File([blob], filename, {
        type: "application/zip",
      });
      if (navigator.canShare?.({ files: [zipAsFile] })) {
        try {
          await navigator.share({
            files: [zipAsFile],
            title: "Website update from Ed",
          });
          setSent({ filename, how: "shared", missingNames });
          return;
        } catch {
          // Cancelled or blocked — fall through to a plain download.
        }
      }
      downloadBlob(filename, blob);
      setSent({ filename, how: "downloaded", missingNames });
    } finally {
      setBuilding(false);
    }
  };

  const logout = () => {
    if (!confirm("Sign out? Your editing stays saved on this device.")) return;
    sessionStorage.removeItem("edshpritz-admin");
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

  const mailto = `mailto:${BRADY_EMAIL}?subject=${encodeURIComponent(
    "Website update from Ed",
  )}&body=${encodeURIComponent(
    `Hi Brady,\n\nMy website changes are in the attached file${
      sent ? ` (${sent.filename}, in my Downloads folder)` : ""
    }. Please put them on the site.\n\nEd`,
  )}`;

  return (
    <div className="pt-24">
      <div className="container-rail">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-5">
          <div>
            <p className="kicker">Ed Shpritz Photography</p>
            <h1 className="mt-1 font-serif text-3xl font-light text-ink">
              Manage the site
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportAll}
              disabled={building}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-sans text-sm text-paper transition-colors hover:bg-ink-soft disabled:opacity-60"
            >
              <Send size={16} />
              {building ? "Getting it ready..." : "Send my changes to Brady"}
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 font-sans text-sm text-ink-muted hover:text-ink"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>

        {restored && (
          <div className="mt-5 border border-ink/15 bg-paper-soft p-4 font-sans text-sm text-ink-soft">
            Welcome back — the changes you made on{" "}
            {new Date(restored.savedAt).toLocaleString(undefined, {
              dateStyle: "long",
              timeStyle: "short",
            })}{" "}
            were brought back for you.
            {pendingCount > 0 && (
              <>
                {" "}
                <strong className="text-amber-700">
                  {pendingCount} picture{pendingCount === 1 ? "" : "s"} need
                  {pendingCount === 1 ? "s" : ""} to be chosen again
                </strong>{" "}
                — look for the orange notes below.
              </>
            )}{" "}
            <button onClick={discardDraft} className="underline hover:text-ink">
              Start over from the live site
            </button>
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

        {sent && (
          <div className="mt-5 space-y-2 border border-wash-300 bg-wash-50 p-4 font-sans text-sm text-wash-800">
            {sent.how === "uploaded" ? (
              <p>
                <strong className="text-ink">
                  Sent! Your changes went straight to Brady.
                </strong>{" "}
                You are done — there is nothing else to do. He will put them on
                the site.
              </p>
            ) : sent.how === "shared" ? (
              <p>
                Your update was handed to the app you picked. If you emailed it
                to Brady, you are done — he will put it on the site.
              </p>
            ) : (
              <p>
                Everything was saved into one file:{" "}
                <strong className="text-ink">{sent.filename}</strong> (in your
                Downloads). Email that one file to Brady at{" "}
                <strong className="text-ink">{BRADY_EMAIL}</strong> and he will
                put it on the site.{" "}
                <a href={mailto} className="underline hover:text-ink">
                  Open an email to Brady
                </a>{" "}
                (then attach the file from Downloads).
              </p>
            )}
            {sent.missingNames.length > 0 && (
              <p className="text-amber-800">
                Heads up: {sent.missingNames.join(", ")} still need
                {sent.missingNames.length === 1 ? "s" : ""} a picture — choose
                {sent.missingNames.length === 1 ? " it" : " them"} again below
                and send once more.
              </p>
            )}
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
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-sans text-sm text-ink-muted">
                {photos.length} photographs, {triggerCount} shown on the home
                page. New pictures appear at the top of this list.
              </p>
              <button
                onClick={() => addInput.current?.click()}
                className="inline-flex items-center gap-2 border border-ink/20 px-4 py-2 font-sans text-sm text-ink hover:border-ink"
              >
                <Plus size={16} /> Add photographs
              </button>
              <input
                ref={addInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
            {photos.map((p) => (
              <AdminPhotoRow
                key={p.id}
                photo={p}
                preview={previews[p.id] ?? p.src}
                collections={collections}
                missingFile={!!pending[p.id] && !files[p.id]}
                onChange={(patch) => patchPhoto(p.id, patch)}
                onFile={(file) => onFile(p.id, file)}
                onDelete={() => removePhoto(p.id)}
                onMove={(dir) => movePhoto(p.id, dir)}
              />
            ))}
          </div>
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
            <Text
              label="Contact form key (Web3Forms access key — leave blank to use email)"
              value={site.formEndpoint}
              onChange={(v) => setSite({ ...site, formEndpoint: v })}
            />
          </div>
        )}

        {tab === "Collections" && (
          <div className="max-w-2xl space-y-8">
            {collections.map((c, i) => (
              <div
                key={c.slug}
                className="space-y-3 border border-ink/10 bg-paper-soft p-5"
              >
                <p className="font-serif text-xl text-ink">{c.name}</p>
                <Text
                  label="Title"
                  value={c.name}
                  onChange={(v) =>
                    setCollections((cs) =>
                      cs.map((x, k) => (k === i ? { ...x, name: v } : x)),
                    )
                  }
                />
                <Text
                  label="Short line"
                  value={c.kicker}
                  onChange={(v) =>
                    setCollections((cs) =>
                      cs.map((x, k) => (k === i ? { ...x, kicker: v } : x)),
                    )
                  }
                />
                <Area
                  label="Blurb"
                  value={c.blurb}
                  onChange={(v) =>
                    setCollections((cs) =>
                      cs.map((x, k) => (k === i ? { ...x, blurb: v } : x)),
                    )
                  }
                />
              </div>
            ))}
          </div>
        )}

        {tab === "Galleries" && (
          <AdminGalleries galleries={galleries} setGalleries={setGalleries} />
        )}
      </div>
    </div>
  );
}

function Text({
  label: l,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className={label}>{l}</span>
      <input
        className={field}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Area({
  label: l,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <span className={label}>{l}</span>
      <textarea
        className={`${field} resize-y`}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Select({
  label: l,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className={label}>{l}</span>
      <select
        className={field}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
