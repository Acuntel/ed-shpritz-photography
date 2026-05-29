import Link from "next/link";
import Reveal from "@/components/Reveal";
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
    <div className="columns-2 gap-4 sm:columns-3 sm:gap-5 lg:columns-4">
      {photos.map((p, i) => (
        <Reveal
          key={p.id}
          as="div"
          delay={Math.min(i, 10) * 45}
          className="mb-4 break-inside-avoid sm:mb-5"
        >
          <Link
            href={`/collections/${p.collection}/`}
            className="group relative block overflow-hidden bg-paper-soft"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.src}
              alt={p.alt}
              loading="lazy"
              className="block h-auto w-full transition-transform duration-[1.2s] ease-gallery group-hover:scale-[1.04]"
            />
            <span className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/55 via-ink/0 to-ink/0 p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <span className="font-sans text-[10px] uppercase tracking-widest2 text-paper/80">
                {nameFor(p.collection)}
              </span>
              <span className="font-serif text-lg leading-tight text-paper">
                {p.name}
              </span>
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
