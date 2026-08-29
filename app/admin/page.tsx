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

const AUTH_KEY = "edshpritz-admin";
const PASS_KEY = "edshpritz-admin-pass";
// One-time reset for stale drafts created before the admin stabilization work.
const DRAFT_RESET_BEFORE = Date.parse("2026-08-29T00:40:00Z");

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

    if ((d.savedAt ?? 0) < DRAFT_RESET_BEFORE) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }

    // Autosave normalizes numeric order values. Ignore those numbers when
    // deciding whether a draft differs from live; the photo array sequence still
    // detects a genuine reorder.
    const comparable = (x: Loaded | AdminDraft) =>
      JSON.stringify([
        x.site,
        x.collections,
        x.photos.map(({ order: _order, ...photo }) => photo),
        x.galleries,
      ]);

    if (comparable(d) === comparable(live)) {
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
  const [passcode, setPasscode] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const [live, setLive] = useState<Loaded | null>(null);
  const [draft, setDraft] = useState<AdminDraft | null>(null);
  const [useDraft, setUseDraft] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(AUTH_KEY) === "1") {
      setPasscode(sessionStorage.getItem(PASS_KEY) ?? "");
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("skipgc", "t");
    } catch {
      // private-mode storage failures are harmless
    }
  }, []);

  // Load EXACTLY what is live. Do not renumber, delete, or otherwise mutate
  // photos here. Ed's admin must never manufacture an unsaved change on load.
  useEffect(() => {
    if (!authed) return;
    fetch("/api/content/", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("load failed");
        return r.json();
      })
      .then((loaded: Loaded) => {
        setDraft(readDraft(loaded));
        setLive(loaded);
      })
      .catch(() => setLoadFailed(true));
  }, [authed]);

  const discardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setDraft(null);
    setUseDraft(false);
  };

  const restoreDraft = () => setUseDraft(true);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setChecking(true);
    try {
      const res = await fetch("/api/content/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: pass, verify: true }),
      });
      if (res.ok) {
        sessionStorage.setItem(AUTH_KEY, "1");
        sessionStorage.setItem(PASS_KEY, pass);
        setPasscode(pass);
        setAuthed(true);
      } else {
        const e2 = (await res.json().catch(() => ({}))) as { error?: string };
        setError(e2.error || "That password is not right.");
      }
    } catch {
      setError("Could not reach the website. Check your internet and retry.");
    } finally {
      setChecking(false);
    }
  };

  if (!authed) {
    return (
      <section className="container-rail flex min-h-screen flex-col items-center justify-center">
        <form onSubmit={submit} className="w-full max-w-sm text-center">
          <p className="kicker">Ed Shpritz Photography</p>
          <h1 className="mt-3 font-serif text-3xl font-light text-ink">Admin</h1>
          <input
            type="password"
            value={pass}
            autoFocus
            onChange={(e) => {
              setPass(e.target.value);
              setError(null);
            }}
            placeholder="Password"
            className="mt-8 w-full border-b border-ink/30 bg-transparent py-3 text-center font-sans text-lg text-ink outline-none focus:border-ink"
          />
          {error && <p className="mt-3 font-sans text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={checking || !pass}
            className="mt-8 w-full rounded-full bg-ink px-7 py-3 font-sans text-sm text-paper transition-colors hover:bg-ink-soft disabled:opacity-60"
          >
            {checking ? "Checking..." : "Enter"}
          </button>
        </form>
      </section>
    );
  }

  if (loadFailed) {
    return (
      <section className="container-rail flex min-h-screen items-center justify-center">
        <p className="max-w-sm text-center font-sans text-sm text-ink-muted">
          The photographs could not be loaded. Check that you are connected to the internet, then reload.
        </p>
      </section>
    );
  }

  if (!live) {
    return (
      <section className="container-rail flex min-h-screen items-center justify-center">
        <p className="font-sans text-sm text-ink-muted">Loading your photographs...</p>
      </section>
    );
  }

  const showingDraft = useDraft && draft;
  const source = showingDraft ? draft : live;
  return (
    <AdminEditor
      key={showingDraft ? `draft-${draft.savedAt}` : "live"}
      passcode={passcode}
      initialSite={source.site}
      initialCollections={source.collections}
      initialPhotos={source.photos}
      initialGalleries={source.galleries}
      restored={showingDraft ? { savedAt: draft.savedAt } : null}
      pendingDraft={!useDraft && draft ? { savedAt: draft.savedAt } : null}
      paused={!useDraft && !!draft}
      onRestoreDraft={restoreDraft}
      onDiscardDraft={discardDraft}
    />
  );
}
