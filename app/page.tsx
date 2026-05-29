import Link from "next/link";
import {
  getSite,
  getCollections,
  getTriggerPhotos,
  getPhotosByCollection,
} from "@/lib/data";
import Hero from "@/components/Hero";
import TriggerGrid from "@/components/TriggerGrid";
import CollectionsIndex from "@/components/CollectionsIndex";
import Edism from "@/components/Edism";
import Reveal from "@/components/Reveal";

export default function Home() {
  const site = getSite();
  const collections = getCollections();
  const triggers = getTriggerPhotos();
  const watercolor = getPhotosByCollection("less-is-more").slice(0, 2);
  const watercolorCover = collections.find(
    (c) => c.slug === "less-is-more",
  )?.cover;

  return (
    <>
      <Hero site={site} accent={watercolorCover} />

      {/* Intro */}
      <section className="container-rail py-24 sm:py-28">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="font-serif text-2xl font-light leading-relaxed text-ink-soft sm:text-3xl">
            {site.intro}
          </p>
        </Reveal>
      </section>

      {/* The 24 trigger photographs */}
      <section id="photographs" className="container-rail scroll-mt-20">
        <Reveal className="mb-12 flex flex-col gap-3 border-b border-ink/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="kicker">{site.heroLine}</p>
            <h2 className="mt-2 font-serif text-4xl font-light text-ink sm:text-5xl">
              The photographs
            </h2>
          </div>
          <p className="max-w-prose2 font-sans text-sm leading-relaxed text-ink-muted">
            Twenty four to begin with. Choose any one and it will open the rest
            of its kind.
          </p>
        </Reveal>
        <TriggerGrid photos={triggers} collections={collections} />
      </section>

      <Edism quote={site.edisms[0] ?? "Less is more."} />

      {/* Less is more feature */}
      <section className="container-rail py-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="kicker">Less is more</p>
            <h2 className="mt-3 font-serif text-4xl font-light leading-tight text-ink sm:text-5xl">
              The quiet ones
            </h2>
            <p className="mt-6 max-w-prose2 font-sans text-base leading-relaxed text-ink-soft">
              {site.lessIsMore}
            </p>
            <Link
              href="/collections/less-is-more/"
              className="mt-8 inline-block border-b border-ink/30 pb-1 font-sans text-sm text-ink transition-colors hover:border-ink"
            >
              See the quiet ones
            </Link>
          </Reveal>
          <div className="grid grid-cols-2 gap-5 lg:col-span-7">
            {watercolor.map((p, i) => (
              <Reveal
                key={p.id}
                delay={i * 120}
                className={i === 1 ? "mt-10" : ""}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt={p.alt}
                  loading="lazy"
                  className="w-full rounded-sm shadow-[0_30px_70px_-50px_rgba(0,0,0,0.5)]"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Collections */}
      <section id="collections" className="container-rail scroll-mt-20 py-28">
        <Reveal className="mb-14 text-center">
          <p className="kicker">Seven ways of looking</p>
          <h2 className="mt-2 font-serif text-4xl font-light text-ink sm:text-5xl">
            Browse by collection
          </h2>
        </Reveal>
        <CollectionsIndex collections={collections} />
      </section>

      <Edism quote={site.edisms[1] ?? "Do you see what I see?"} />

      {/* About teaser */}
      <section className="container-rail pb-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={site.bio.portrait}
              alt={`A portrait of ${site.name}`}
              className="w-full max-w-xs rounded-sm shadow-[0_30px_70px_-50px_rgba(0,0,0,0.5)]"
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
