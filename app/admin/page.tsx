"use client";

import { useEffect, useState } from "react";
import type { Collection, Photo, SiteContent } from "@/lib/types";
import AdminEditor from "@/components/AdminEditor";

const PASSWORD = "1111";
const KEY = "edshpritz-admin";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);

  const [site, setSite] = useState<SiteContent | null>(null);
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [photos, setPhotos] = useState<Photo[] | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(KEY) === "1") setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    Promise.all([
      fetch("/data/site.json").then((r) => r.json()),
      fetch("/data/collections.json").then((r) => r.json()),
      fetch("/data/photos.json").then((r) => r.json()),
    ]).then(([s, c, p]) => {
      setSite(s);
      setCollections(c);
      setPhotos(p);
    });
  }, [authed]);

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

  if (!site || !collections || !photos) {
    return (
      <section className="container-rail flex min-h-screen items-center justify-center">
        <p className="font-sans text-sm text-ink-muted">
          Loading your photographs...
        </p>
      </section>
    );
  }

  return (
    <AdminEditor
      initialSite={site}
      initialCollections={collections}
      initialPhotos={photos}
    />
  );
}
