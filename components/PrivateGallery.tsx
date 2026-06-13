"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Lock } from "lucide-react";
import Reveal from "@/components/Reveal";
import Lightbox from "@/components/Lightbox";
import Picture from "@/components/Picture";
import type { ClientGallery, Photo } from "@/lib/types";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fileName(src: string) {
  return src.split("/").pop() || "photo.jpg";
}

export default function PrivateGallery({
  gallery,
  email,
  photographer,
}: {
  gallery: ClientGallery;
  email: string;
  photographer: string;
}) {
  const needsCode = Boolean(gallery.passcodeHash);
  const storeKey = `gallery-${gallery.token}`;

  const [unlocked, setUnlocked] = useState(!needsCode);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    if (needsCode && sessionStorage.getItem(storeKey) === "1") {
      setUnlocked(true);
    }
  }, [needsCode, storeKey]);

  // Map the gallery's photos onto the shared Photo shape so we can reuse the
  // Picture + Lightbox components from the public site.
  const photos: Photo[] = useMemo(
    () =>
      gallery.photos.map((p, i) => ({
        id: p.id,
        src: p.src,
        alt: p.alt,
        name: p.name ?? "",
        title: "",
        description: "",
        collection: gallery.token,
        trigger: false,
        order: i,
        optBase: p.optBase,
        optWidths: p.optWidths,
        lqip: p.lqip,
        width: p.width,
        height: p.height,
      })),
    [gallery],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = (await sha256(code)) === gallery.passcodeHash;
    if (ok) {
      sessionStorage.setItem(storeKey, "1");
      setUnlocked(true);
    } else {
      setError(true);
    }
  };

  if (!unlocked) {
    return (
      <section className="container-rail flex min-h-screen flex-col items-center justify-center pt-24 text-center">
        <Reveal className="w-full max-w-sm">
          <Lock size={22} className="mx-auto text-ink-muted" />
          <p className="kicker mt-5">A private gallery</p>
          <h1 className="mt-3 font-serif text-3xl font-light text-ink">
            {gallery.dog ? `${gallery.dog}'s photos` : "Your photos"}
          </h1>
          <p className="mt-4 font-sans text-sm leading-relaxed text-ink-muted">
            Enter the passcode {photographer} gave you to see them.
          </p>
          <form onSubmit={submit}>
            <input
              type="text"
              inputMode="text"
              autoFocus
              autoComplete="off"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(false);
              }}
              placeholder="Passcode"
              className="mt-8 w-full border-b border-ink/30 bg-transparent py-3 text-center font-sans text-lg text-ink outline-none focus:border-ink"
            />
            {error && (
              <p className="mt-3 font-sans text-sm text-red-700">
                That passcode is not right.
              </p>
            )}
            <button
              type="submit"
              className="mt-8 w-full rounded-full bg-ink px-7 py-3 font-sans text-sm text-paper transition-colors hover:bg-ink-soft"
            >
              View my photos
            </button>
          </form>
          <a
            href={`mailto:${email}?subject=${encodeURIComponent(
              "Help with my gallery",
            )}`}
            className="mt-6 inline-block font-sans text-xs text-ink-faint underline-offset-4 hover:underline"
          >
            Trouble getting in? Email {photographer}.
          </a>
        </Reveal>
      </section>
    );
  }

  return (
    <article className="pt-28">
      <header className="container-rail">
        <Reveal className="border-b border-ink/10 pb-10">
          <p className="kicker">A private gallery for {gallery.client}</p>
          <h1 className="mt-3 font-serif text-5xl font-light text-ink sm:text-6xl">
            {gallery.dog ? gallery.dog : gallery.client}
          </h1>
          {gallery.intro && (
            <p className="mt-5 max-w-prose2 font-sans text-base leading-relaxed text-ink-soft">
              {gallery.intro}
            </p>
          )}
          <p className="mt-4 font-sans text-xs uppercase tracking-widest2 text-ink-faint">
            {photos.length} {photos.length === 1 ? "photo" : "photos"} · tap any
            picture to view · download is yours to keep
          </p>
        </Reveal>
      </header>

      <section className="container-rail mt-12">
        {photos.length === 0 ? (
          <p className="font-sans text-sm text-ink-muted">
            Photos are on their way.
          </p>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 sm:gap-5 lg:columns-3">
            {photos.map((p, i) => (
              <Reveal
                key={p.id}
                as="div"
                delay={Math.min(i, 8) * 50}
                className="group mb-4 break-inside-avoid sm:mb-5"
              >
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  className="block w-full text-left"
                  aria-label={`Open ${p.name || "photo"}`}
                >
                  <span className="block overflow-hidden bg-paper-soft">
                    <Picture
                      photo={p}
                      variant="grid"
                      className="block h-auto w-full transition-transform duration-[1.4s] ease-gallery group-hover:scale-[1.03]"
                    />
                  </span>
                </button>
                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <span className="font-serif text-base text-ink-soft">
                    {p.name}
                  </span>
                  <a
                    href={p.src}
                    download={fileName(p.src)}
                    className="kicker inline-flex shrink-0 items-center gap-1.5 text-ink-muted transition-colors hover:text-ink"
                  >
                    <Download size={13} /> Download
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="container-rail mt-20 border-t border-ink/10 pt-12 text-center">
        <p className="font-sans text-sm text-ink-muted">
          These pictures are yours to download, keep, and print. Questions?{" "}
          <a
            href={`mailto:${email}?subject=${encodeURIComponent(
              `${gallery.dog || gallery.client} — photos`,
            )}`}
            className="border-b border-ink/30 pb-0.5 text-ink hover:border-ink"
          >
            Email {photographer}.
          </a>
        </p>
      </section>

      <Lightbox
        photos={photos}
        index={index}
        email={email}
        download
        onClose={() => setIndex(null)}
        onIndex={setIndex}
      />
    </article>
  );
}
