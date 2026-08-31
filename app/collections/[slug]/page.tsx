import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import {
  getCollections,
  getCollection,
  getPhotosByCollection,
  getSite,
} from "@/lib/data";
import PhotoGrid from "@/components/PhotoGrid";
import Reveal from "@/components/Reveal";

// Rendered on demand from Ed's live Blob content, so a collection he adds (or
// reorders) appears immediately without a rebuild.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const c = await getCollection(params.slug);
  if (!c) return { title: "Collection" };
  // Bare name only — the root layout's title template appends the brand.
  return {
    title: c.name,
    description: c.blurb || c.intro,
    openGraph: {
      title: c.name,
      description: c.blurb || c.intro || undefined,
      images: c.cover ? [c.cover] : undefined,
    },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: { slug: string };
}) {
  const collection = await getCollection(params.slug);
  if (!collection) notFound();

  const [photos, site, all] = await Promise.all([
    getPhotosByCollection(params.slug),
    getSite(),
    getCollections(),
  ]);
  const others = all.filter((c) => c.slug !== params.slug);

  return (
    <article className="pt-28">
      <header className="container-rail">
        <Link
          href="/#collections"
          className="inline-flex items-center gap-2 font-sans text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} /> All collections
        </Link>
        <Reveal className="mt-8 border-b border-ink/10 pb-10">
          <h1 className="font-serif text-5xl font-light text-ink sm:text-6xl">
            {collection.name}
          </h1>
          {collection.blurb && (
            <p className="mt-5 max-w-prose2 font-sans text-base leading-relaxed text-ink-soft">
              {collection.blurb}
            </p>
          )}
          {collection.intro && (
            <p className="mt-5 max-w-prose2 font-sans text-base italic leading-relaxed text-ink-muted">
              {collection.intro}
            </p>
          )}
          <div className="mt-8 max-w-prose2 border-l border-ink/20 pl-5">
            <p className="kicker">How to look</p>
            <p className="mt-3 font-sans text-sm leading-relaxed text-ink-soft">
              Open each photograph to see its title and description—the words
              are part of the experience.
            </p>
          </div>
        </Reveal>
      </header>

      <section className="container-rail mt-12">
        {photos.length > 0 ? (
          <PhotoGrid photos={photos} email={site.contactEmail} />
        ) : (
          <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
            <p className="kicker">Coming soon</p>
            <p className="mt-4 max-w-prose2 font-serif text-2xl font-light text-ink-soft">
              New work for this collection is on its way.
            </p>
          </div>
        )}
      </section>

      <section className="container-rail mt-24 border-t border-ink/10 pt-12">
        <p className="kicker mb-6">Keep looking</p>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {others.map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}/`}
              className="font-serif text-xl text-ink-soft transition-colors hover:text-ink"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
