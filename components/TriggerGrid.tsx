import Link from "next/link";
import Reveal from "@/components/Reveal";
import Picture from "@/components/Picture";
import type { Collection, Photo } from "@/lib/types";

export default function TriggerGrid({
  photos,
  collections,
}: {
  photos: Photo[];
  collections: Collection[];
}) {
  const nameFor = (slug: string) =>
    collections.find((c) => c.slug === slug)?.name ?? "";

  return (
    <div className="protect columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
      {photos.map((p, i) => (
        <Reveal
          key={p.id}
          as="div"
          delay={Math.min(i, 10) * 40}
          className="mb-3 break-inside-avoid sm:mb-4"
        >
          <Link
            href={`/collections/${p.collection}/`}
            className="group relative block overflow-hidden bg-paper-soft"
          >
            <Picture
              photo={p}
              variant="tile"
              priority={i < 4}
              className="block h-auto w-full transition-transform duration-[1.4s] ease-gallery group-hover:scale-[1.05]"
            />
            <span className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 via-black/10 to-transparent p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <span className="font-sans text-[10px] uppercase tracking-widest2 text-white/70">
                {nameFor(p.collection)}
              </span>
              <span className="font-serif text-lg leading-tight text-white">
                {p.name}
              </span>
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
