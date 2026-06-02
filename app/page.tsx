import Link from "next/link";
import {
  getSite,
  getCollections,
  getPhotos,
  getTriggerPhotos,
} from "@/lib/data";
import Hero from "@/components/Hero";
import TriggerGrid from "@/components/TriggerGrid";
import CollectionsIndex from "@/components/CollectionsIndex";
import Edism from "@/components/Edism";
import Reveal from "@/components/Reveal";

export default function Home() {
  const site = getSite();
  const collections = getCollections();
  const photos = getPhotos();
  const triggers = getTriggerPhotos();

  return (
    <>
      <Hero site={site} />

      {/* The wall — the images are the menu */}
      <section id="photographs" className="container-rail scroll-mt-20 pt-6">
        <Reveal className="mb-10 text-center">
          <p className="kicker">{site.heroLine}</p>
          <p className="mx-auto mt-3 max-w-prose2 font-serif text-xl font-light leading-relaxed text-ink-soft">
            Choose any picture. It will open the rest of its kind.
          </p>
        </Reveal>
        <TriggerGrid photos={triggers} collections={collections} />
      </section>

      <Edism quote={site.edisms[0] ?? "From light to dark."} />

      {/* Browse by collection */}
      <section id="collections" className="container-rail scroll-mt-20 pb-8">
        <Reveal className="mb-14 text-center">
          <p className="kicker">Eleven ways of looking</p>
          <h2 className="mt-2 font-serif text-4xl font-light text-ink sm:text-5xl">
            Browse by collection
          </h2>
        </Reveal>
        <CollectionsIndex collections={collections} photos={photos} />
      </section>

      <Edism quote={site.edisms[2] ?? "Do you see what I see?"} />

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
              Read more about Ed
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
