import Link from "next/link";
import Reveal from "@/components/Reveal";
import Picture from "@/components/Picture";
import type { Collection, Photo } from "@/lib/types";

export default function CollectionsIndex({
  collections,
  photos,
}: {
  collections: Collection[];
  photos: Photo[];
}) {
  const coverPhoto = (c: Collection) => photos.find((p) => p.src === c.cover);

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((c, i) => {
        const cover = coverPhoto(c);
        return (
          <Reveal key={c.slug} delay={Math.min(i, 6) * 60}>
            <Link href={`/collections/${c.slug}/`} className="group block">
              <div className="protect aspect-[4/5] overflow-hidden bg-paper-soft">
                {cover ? (
                  <Picture
                    photo={cover}
                    variant="tile"
                    className={`h-full w-full object-cover transition-transform duration-[1.4s] ease-gallery group-hover:scale-105 ${
                      c.slug === "places-and-reflections"
                        ? "object-[68%_center]"
                        : "object-center"
                    }`}
                    style={{ aspectRatio: undefined }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="kicker">Coming soon</span>
                  </div>
                )}
              </div>
              <h3 className="mt-4 font-serif text-2xl text-ink transition-colors group-hover:text-ink-soft">
                {c.name}
              </h3>
              {c.blurb && (
                <p className="mt-2 max-w-prose2 font-sans text-sm leading-relaxed text-ink-muted">
                  {c.blurb}
                </p>
              )}
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
