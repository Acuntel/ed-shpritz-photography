import type { Metadata } from "next";
import Link from "next/link";
import { getSite, getCollections, getPhotos } from "@/lib/data";
import Hero from "@/components/Hero";
import CollectionsIndex from "@/components/CollectionsIndex";
import Edism from "@/components/Edism";
import Reveal from "@/components/Reveal";
import StayInTouch from "@/components/StayInTouch";

// Read Ed's live content from Blob on every request so his published changes
// appear instantly with no rebuild.
export const metadata: Metadata = {
  title: { absolute: "Do You See What I See? — Ed Shpritz Photography" },
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const [site, collections, photos] = await Promise.all([
    getSite(),
    getCollections(),
    getPhotos(),
  ]);

  const homePhotos = photos.map((photo) => ({
    ...photo,
    alt: photo.alt.replace(/\bEdward\b/g, "Ed"),
  }));

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
            Choose a collection. Open each photograph to see its title and
            story—the words are part of the experience.
          </h2>
        </Reveal>
        <CollectionsIndex collections={collections} photos={homePhotos} />
      </section>

      <Edism
        label="Bonus · An Ed’ism"
        quote={
          site.edisms[2] ??
          "Beauty within shines outside; beauty outside only shines."
        }
      />

      {/* About teaser */}
      <section className="container-rail pb-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={site.bio.portrait}
              alt="A portrait of Ed Shpritz"
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
              Read more about Ed
            </Link>
          </Reveal>
        </div>
      </section>

      <StayInTouch />
    </>
  );
}
