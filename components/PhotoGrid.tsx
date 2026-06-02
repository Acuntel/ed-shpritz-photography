"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import Lightbox from "@/components/Lightbox";
import Picture from "@/components/Picture";
import type { Photo } from "@/lib/types";

export default function PhotoGrid({
  photos,
  email,
}: {
  photos: Photo[];
  email: string;
}) {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <>
      <div className="protect columns-1 gap-4 sm:columns-2 sm:gap-5 lg:columns-3">
        {photos.map((p, i) => (
          <Reveal
            key={p.id}
            as="div"
            delay={Math.min(i, 8) * 50}
            className="mb-4 break-inside-avoid sm:mb-5"
          >
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group block w-full text-left"
              aria-label={`Open ${p.name}`}
            >
              <span className="block overflow-hidden bg-paper-soft">
                <Picture
                  photo={p}
                  variant="grid"
                  className="block h-auto w-full transition-transform duration-[1.4s] ease-gallery group-hover:scale-[1.03]"
                />
              </span>
              <span className="mt-3 flex items-baseline justify-between gap-3">
                <span className="font-serif text-base text-ink-soft transition-colors group-hover:text-ink">
                  {p.name}
                </span>
                <span className="kicker shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                  View
                </span>
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      <Lightbox
        photos={photos}
        index={index}
        email={email}
        onClose={() => setIndex(null)}
        onIndex={setIndex}
      />
    </>
  );
}
