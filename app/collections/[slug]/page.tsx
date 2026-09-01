import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import {
  getCollection,
  getCollections,
  getPhotos,
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
  const [collection, site, all, photos] = await Promise.all([
    getCollection(params.slug),
    getSite(),
    getCollections(),
    getPhotos(),
  ]);
  if (!collection) notFound();

  const startingIndex = all.findIndex((item) => item.slug === params.slug);
  const sequence = startingIndex >= 0 ? all.slice(startingIndex) : [collection];

  return (
    <article className="pt-28">
      <div className="container-rail">
        <Link
          href="/#collections"
          className="inline-flex items-center gap-2 font-sans text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} /> All collections
        </Link>
      </div>

      {sequence.map((item, position) => {
        const collectionPhotos = photos.filter(
          (photo) => photo.collection === item.slug,
        );

        return (
          <section
            key={item.slug}
            id={`collection-${item.slug}`}
            className={position > 0 ? "mt-28" : ""}
          >
            <header
              className={`container-rail ${
                position > 0 ? "border-t border-ink/10 pt-12" : ""
              }`}
            >
              {position > 0 && <p className="kicker mb-6">Next collection</p>}
              <Reveal className="mt-8 border-b border-ink/10 pb-10">
                {position === 0 ? (
                  <h1 className="font-serif text-5xl font-light text-ink sm:text-6xl">
                    {item.name}
                  </h1>
                ) : (
                  <h2 className="font-serif text-5xl font-light text-ink sm:text-6xl">
                    {item.name}
                  </h2>
                )}
                {item.blurb && (
                  <p className="mt-5 max-w-prose2 font-sans text-base leading-relaxed text-ink-soft">
                    {item.blurb}
                  </p>
                )}
                {item.intro && (
                  <p className="mt-5 max-w-prose2 font-sans text-base italic leading-relaxed text-ink-muted">
                    {item.intro}
                  </p>
                )}
                {position === 0 && (
                  <div className="mt-8 max-w-prose2 border-l border-ink/20 pl-5">
                    <p className="kicker">How to look</p>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-ink-soft">
                      Open each photograph to see its title and description—the
                      words are part of the experience.
                    </p>
                  </div>
                )}
              </Reveal>
            </header>

            <div className="container-rail mt-12">
              {collectionPhotos.length > 0 ? (
                <PhotoGrid photos={collectionPhotos} email={site.contactEmail} />
              ) : (
                <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
                  <p className="kicker">Coming soon</p>
                  <p className="mt-4 max-w-prose2 font-serif text-2xl font-light text-ink-soft">
                    New work for this collection is on its way.
                  </p>
                </div>
              )}
            </div>
          </section>
        );
      })}

      <section className="container-rail mt-28 border-t border-ink/10 pb-8 pt-12">
        <p className="kicker">You’ve reached the final collection</p>
        <Link
          href="/#collections"
          className="mt-5 inline-block font-serif text-2xl text-ink-soft transition-colors hover:text-ink"
        >
          Return to all collections
        </Link>
      </section>
    </article>
  );
}
