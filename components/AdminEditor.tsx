"use client";

import { useMemo, useState } from "react";
import { Plus, Download, LogOut } from "lucide-react";
import type { Collection, Photo, SiteContent } from "@/lib/types";
import AdminPhotoRow from "@/components/AdminPhotoRow";
import { downloadText, downloadFile, sanitizeFilename } from "@/lib/download";

const field =
  "w-full border border-ink/15 bg-paper px-3 py-2 font-sans text-sm text-ink outline-none focus:border-ink/50";
const label = "font-sans text-[11px] uppercase tracking-widest2 text-ink-muted";
const tabs = ["Photographs", "Words", "Collections"] as const;
type Tab = (typeof tabs)[number];

export default function AdminEditor({
  initialSite,
  initialCollections,
  initialPhotos,
}: {
  initialSite: SiteContent;
  initialCollections: Collection[];
  initialPhotos: Photo[];
}) {
  const [tab, setTab] = useState<Tab>("Photographs");
  const [site, setSite] = useState(initialSite);
  const [collections, setCollections] = useState(initialCollections);
  const [photos, setPhotos] = useState(
    [...initialPhotos].sort((a, b) => a.order - b.order),
  );
  const [files, setFiles] = useState<Record<string, File>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const patchPhoto = (id: string, patch: Partial<Photo>) =>
    setPhotos((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const onFile = (id: string, file: File) => {
    const target = `/images/uploads/${id}-${sanitizeFilename(file.name)}`;
    patchPhoto(id, { src: target });
    setFiles((f) => ({ ...f, [id]: file }));
    setPreviews((p) => ({ ...p, [id]: URL.createObjectURL(file) }));
  };

  const addPhoto = () => {
    const id = `p-${Date.now()}`;
    const next: Photo = {
      id,
      src: "/images/gallery/marina-white.jpg",
      alt: "New photograph",
      name: "Untitled",
      title: "untitled",
      description: "",
      collection: collections[0]?.slug ?? "chicago",
      trigger: false,
      order: photos.length,
    };
    setPhotos((ps) => [...ps, next]);
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

  const exportAll = () => {
    const ordered = photos.map((p, i) => ({ ...p, order: i }));
    downloadText("photos.json", JSON.stringify(ordered, null, 2));
    downloadText("site.json", JSON.stringify(site, null, 2));
    downloadText("collections.json", JSON.stringify(collections, null, 2));
    Object.entries(files).forEach(([id, file]) => {
      const p = ordered.find((x) => x.id === id);
      if (p) downloadFile(p.src.split("/").pop() as string, file);
    });
    setDone(true);
  };

  const logout = () => {
    sessionStorage.removeItem("edshpritz-admin");
    location.href = "/";
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
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportAll}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-sans text-sm text-paper transition-colors hover:bg-ink-soft"
            >
              <Download size={16} /> Export to publish
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 font-sans text-sm text-ink-muted hover:text-ink"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>

        {done && (
          <div className="mt-5 border border-wash-300 bg-wash-50 p-4 font-sans text-sm text-wash-800">
            Files downloaded. Put the three .json files into{" "}
            <code className="text-ink">public/data</code>, put any new photos
            into <code className="text-ink">public/images/uploads</code>, then
            redeploy. Send them to Brady if you would like him to publish.
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
            <div className="flex items-center justify-between">
              <p className="font-sans text-sm text-ink-muted">
                {photos.length} photographs, {triggerCount} shown on the home
                page.
              </p>
              <button
                onClick={addPhoto}
                className="inline-flex items-center gap-2 border border-ink/20 px-4 py-2 font-sans text-sm text-ink hover:border-ink"
              >
                <Plus size={16} /> Add a photograph
              </button>
            </div>
            {photos.map((p) => (
              <AdminPhotoRow
                key={p.id}
                photo={p}
                preview={previews[p.id] ?? p.src}
                collections={collections}
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
