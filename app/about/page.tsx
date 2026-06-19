import type { Metadata } from "next";
import Link from "next/link";
import { getSite } from "@/lib/data";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About | Ed Shpritz Photography",
  description: "A few words from Ed Shpritz, and the idea behind the pictures.",
};

export default function AboutPage() {
  const site = getSite();

  return (
    <article className="pt-28">
      <section className="container-rail">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={site.bio.portrait}
              alt={`A portrait of ${site.name}`}
              className="w-full rounded-sm shadow-[0_40px_90px_-55px_rgba(0,0,0,0.5)]"
            />
            <div className="mt-8 flex flex-wrap gap-3">
              {site.concepts.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-ink/15 px-4 py-1.5 font-sans text-xs text-ink-soft"
                >
                  {c}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal className="lg:col-span-7" delay={120}>
            <p className="kicker">{site.bio.heading}</p>
            <h1 className="mt-3 font-serif text-5xl font-light text-ink">
              {site.name} Photography
            </h1>
            <div className="mt-8 space-y-6">
              {site.bio.body.map((para, i) => (
                <p
                  key={i}
                  className="max-w-prose2 font-sans text-lg leading-relaxed text-ink-soft"
                >
                  {para}
                </p>
              ))}
            </div>
            <a
              href={`mailto:${site.contactEmail}`}
              className="mt-10 inline-block rounded-full bg-ink px-7 py-3 font-sans text-sm text-paper transition-colors hover:bg-ink-soft"
            >
              Get in touch
            </a>
          </Reveal>
        </div>
      </section>

      {/* A single current thought */}
      <section className="container-rail relative mt-28 border-t border-ink/10 pb-10 pt-20">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span
            aria-hidden
            className="font-serif text-5xl leading-none text-ink-faint"
          >
            &ldquo;
          </span>
          <p className="mt-2 font-serif text-3xl font-light leading-snug text-ink sm:text-4xl">
            {site.edisms[0] ?? "We look… but do we see?"}
          </p>
        </Reveal>
        {site.cartoon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={site.cartoon}
            alt={`A cartoon of ${site.name}`}
            className="pointer-events-none absolute bottom-2 right-4 w-20 sm:w-28"
          />
        )}
      </section>

      <section className="container-rail mt-24 text-center">
        <Link
          href="/#collections"
          className="border-b border-ink/30 pb-1 font-sans text-sm text-ink transition-colors hover:border-ink"
        >
          Back to the collections
        </Link>
      </section>
    </article>
  );
}
