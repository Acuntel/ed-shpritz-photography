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
  const currentIndex = all.findIndex((item) => item.slug === params.slug);
  const nextCollection =
    currentIndex >= 0 && currentIndex < all.length - 1
      ? all[currentIndex + 1]
      : undefined;

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
              {params.slug === "do-you-see-what-i-see"
                ? "Look first. Each cloud has a number and a HINT. Open the photograph when you are ready to see what I see."
                : "Open each photograph to see its title and description—the words are part of the experience."}
            </p>
          </div>
        </Reveal>
      </header>

      <section className="container-rail mt-12">
        {photos.length > 0 ? (
          <PhotoGrid
            photos={photos}
            email={site.contactEmail}
            endTargetId="after-collection"
            revealAnswers={params.slug === "do-you-see-what-i-see"}
          />
        ) : (
          <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
            <p className="kicker">Coming soon</p>
            <p className="mt-4 max-w-prose2 font-serif text-2xl font-light text-ink-soft">
              New work for this collection is on its way.
            </p>
          </div>
        )}
      </section>

      <section
        id="after-collection"
        className="container-rail mt-24 scroll-mt-24 border-t border-ink/10 pt-12"
      >
        <p className="kicker mb-6">Where would you like to look next?</p>
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-10">
          {nextCollection && (
            <Link
              href={`/collections/${nextCollection.slug}/`}
              className="font-serif text-2xl text-ink transition-colors hover:text-ink-soft"
            >
              Next collection: {nextCollection.name}
            </Link>
          )}
          <Link
            href="/#collections"
            className="border-b border-ink/30 pb-1 font-sans text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            All collections
          </Link>
        </div>
      </section>
    </article>
  );
}
