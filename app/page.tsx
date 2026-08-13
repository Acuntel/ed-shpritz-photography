import Link from "next/link";
import { getSite, getCollections, getPhotos } from "@/lib/data";
import Hero from "@/components/Hero";
import CollectionsIndex from "@/components/CollectionsIndex";
import Edism from "@/components/Edism";
import Reveal from "@/components/Reveal";

// Read Edward's live content from Blob on every request so his published changes
// appear instantly with no rebuild.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [site, collections, photos] = await Promise.all([
    getSite(),
    getCollections(),
    getPhotos(),
  ]);

  return (
    <>
      <Hero site={site} />

      {/* Browse by collection — one cover each, the image is the door */}
      <section
        id="collections"
        className="container-rail scroll-mt-20 pt-6 pb-8"
      >
        <Reveal className="mb-14 text-center">
          <p className="kicker">The collections</p>
          <h2 className="mx-auto mt-3 max-w-prose2 font-serif text-3xl font-light leading-snug text-ink sm:text-4xl">
            Choose a picture. It opens the rest of its kind.
          </h2>
        </Reveal>
        <CollectionsIndex collections={collections} photos={photos} />
      </section>

      <Edism quote={site.edisms[0] ?? "We look… but do we see?"} />

      {/* About teaser */}
      <section className="container-rail pb-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={site.bio.portrait}
              alt={`A portrait of ${site.name}`}
              loading="lazy"
              className="w-full max-w-xs rounded-sm shadow-[0_30px_70px_-50px_rgba(0,0,0,0.8)]"
            />
          </Reveal>
          <Reveal className="lg:col-span-8" delay={120}>
            <p className="kicker">{site.bio.heading}</p>
            <p className="mt-4 max-w-prose2 font-serif text-2xl font-light leading-relaxed text-ink-soft">
              {site.bio.body[0]}
            </p>
            <Link
              href="/about"
              className="mt-8 inline-block border-b border-ink/30 pb-1 font-sans text-sm text-ink transition-colors hover:border-ink"
            >
              Read more about Edward
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
