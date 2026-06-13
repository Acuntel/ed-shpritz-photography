"use client";

import { useEffect, useState } from "react";
import type {
  ClientGallery,
  Collection,
  Photo,
  SiteContent,
} from "@/lib/types";
import AdminEditor, {
  DRAFT_KEY,
  type AdminDraft,
} from "@/components/AdminEditor";

const PASSWORD = "1111";
const KEY = "edshpritz-admin";

type Loaded = {
  site: SiteContent;
  collections: Collection[];
  photos: Photo[];
  galleries: ClientGallery[];
};

function readDraft(live: Loaded): AdminDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as AdminDraft;
    if (!d?.site || !Array.isArray(d.photos) || !Array.isArray(d.collections))
      return null;
    // If the draft matches the live site (Brady already published it), it has
    // nothing to restore — clear it so Ed starts clean.
    const strip = (x: Loaded | AdminDraft) =>
      JSON.stringify([x.site, x.collections, x.photos, x.galleries]);
    if (strip(d) === strip(live)) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);

  const [live, setLive] = useState<Loaded | null>(null);
  const [draft, setDraft] = useState<AdminDraft | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(KEY) === "1") setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    Promise.all([
      fetch("/data/site.json").then((r) => r.json()),
      fetch("/data/collections.json").then((r) => r.json()),
      fetch("/data/photos.json").then((r) => r.json()),
      fetch("/data/galleries.json")
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ])
      .then(([site, collections, photos, galleries]) => {
        const loaded: Loaded = { site, collections, photos, galleries };
        setDraft(readDraft(loaded));
        setLive(loaded);
      })
      .catch(() => setLoadFailed(true));
  }, [authed]);

  const discardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Storage blocked — the draft will simply be offered again next time.
    }
    setDraft(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === PASSWORD) {
      sessionStorage.setItem(KEY, "1");
      setAuthed(true);
    } else {
      setError(true);
    }
  };

  if (!authed) {
    return (
      <section className="container-rail flex min-h-screen flex-col items-center justify-center">
        <form onSubmit={submit} className="w-full max-w-sm text-center">
          <p className="kicker">Ed Shpritz Photography</p>
          <h1 className="mt-3 font-serif text-3xl font-light text-ink">
            Admin
          </h1>
          <input
            type="password"
            value={pass}
            autoFocus
            onChange={(e) => {
              setPass(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            className="mt-8 w-full border-b border-ink/30 bg-transparent py-3 text-center font-sans text-lg text-ink outline-none focus:border-ink"
          />
          {error && (
            <p className="mt-3 font-sans text-sm text-red-700">
              That password is not right.
            </p>
          )}
          <button
            type="submit"
            className="mt-8 w-full rounded-full bg-ink px-7 py-3 font-sans text-sm text-paper transition-colors hover:bg-ink-soft"
          >
            Enter
          </button>
        </form>
      </section>
    );
  }

  if (loadFailed) {
    return (
      <section className="container-rail flex min-h-screen items-center justify-center">
        <p className="max-w-sm text-center font-sans text-sm text-ink-muted">
          The photographs could not be loaded. Check that you are connected to
          the internet, then pull down or press reload to try again.
        </p>
      </section>
    );
  }

  if (!live) {
    return (
      <section className="container-rail flex min-h-screen items-center justify-center">
        <p className="font-sans text-sm text-ink-muted">
          Loading your photographs...
        </p>
      </section>
    );
  }

  const d = draft;
  return (
    <AdminEditor
      key={d ? `draft-${d.savedAt}` : "live"}
      initialSite={d ? d.site : live.site}
      initialCollections={d ? d.collections : live.collections}
      initialPhotos={d ? d.photos : live.photos}
      initialGalleries={d ? d.galleries : live.galleries}
      restored={
        d ? { savedAt: d.savedAt, pendingFiles: d.pendingFiles ?? {} } : null
      }
      onDiscardDraft={discardDraft}
    />
  );
}
