"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import Lightbox from "@/components/Lightbox";
import Picture from "@/components/Picture";
import type { Photo } from "@/lib/types";

type Group = { section?: string; items: { photo: Photo; index: number }[] };

// Group consecutive photos that share a `section` so each subgroup can render
// under its own heading (e.g. Life Observed → Fog / Boats Beached / Life).
// Collections without sections collapse to a single, header-less group — the
// layout is then identical to a plain masonry.
function groupBySection(photos: Photo[]): Group[] {
  const groups: Group[] = [];
  photos.forEach((photo, index) => {
    const last = groups[groups.length - 1];
    if (last && last.section === photo.section) {
      last.items.push({ photo, index });
    } else {
      groups.push({ section: photo.section, items: [{ photo, index }] });
    }
  });
  return groups;
}

export default function PhotoGrid({
  photos,
  email,
}: {
  photos: Photo[];
  email: string;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const groups = groupBySection(photos);

  return (
    <>
      {groups.map((group, gi) => (
        <div key={group.section ?? gi} className={gi > 0 ? "mt-20" : ""}>
          {group.section ? (
            <Reveal as="div" className="mb-8">
              <p className="kicker">{group.section}</p>
              <span className="mt-3 block h-px w-16 bg-ink/20" />
            </Reveal>
          ) : null}
          <div className="protect columns-1 gap-4 sm:columns-2 sm:gap-5 lg:columns-3">
            {group.items.map(({ photo: p, index: gIndex }, i) => (
              <Reveal
                key={p.id}
                as="div"
                delay={Math.min(i, 8) * 50}
                className="mb-4 break-inside-avoid sm:mb-5"
              >
                <button
                  type="button"
                  onClick={() => setIndex(gIndex)}
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
                    <span className="flex items-baseline gap-1.5 font-serif text-base text-ink-soft transition-colors group-hover:text-ink">
                      {p.name}
                      {p.award && (
                        <span
                          aria-label="Award-winning"
                          title="Award-winning"
                          className="shrink-0 font-serif text-lg leading-none text-amber-500"
                        >
                          *
                        </span>
                      )}
                    </span>
                    <span className="kicker shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                      View
                    </span>
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      ))}

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
