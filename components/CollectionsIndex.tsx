import Link from "next/link";
import Reveal from "@/components/Reveal";
import type { Collection } from "@/lib/types";

export default function CollectionsIndex({
  collections,
}: {
  collections: Collection[];
}) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((c, i) => (
        <Reveal key={c.slug} delay={Math.min(i, 6) * 60}>
          <Link href={`/collections/${c.slug}/`} className="group block">
            <div className="aspect-[4/5] overflow-hidden bg-paper-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.cover}
                alt={`Cover for the ${c.name} collection`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1.4s] ease-gallery group-hover:scale-105"
              />
            </div>
            <p className="kicker mt-4">{c.kicker}</p>
            <h3 className="mt-1 font-serif text-2xl text-ink transition-colors group-hover:text-ink-soft">
              {c.name}
            </h3>
            <p className="mt-2 max-w-prose2 font-sans text-sm leading-relaxed text-ink-muted">
              {c.blurb}
            </p>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
