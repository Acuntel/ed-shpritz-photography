import type { Metadata } from "next";
import Link from "next/link";
import { getSite } from "@/lib/data";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About",
  description: "A few words from Ed Shpritz, and the idea behind the pictures.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const site = await getSite();

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

      {/* The closing statement — the last page */}
      <section className="container-rail relative mt-28 border-t border-ink/10 pb-20 pt-20">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="font-serif text-4xl font-light leading-snug text-ink sm:text-5xl">
            {site.closing?.headline ?? "We look… but do we see?"}
          </p>
          <p className="mt-10 font-serif text-2xl font-light text-ink-soft sm:text-3xl">
            {site.closing?.thankYou ?? "Thank you for LOOKING."}
          </p>
          <p className="mt-1 font-serif text-2xl font-light text-ink-soft sm:text-3xl">
            {site.closing?.didYouSee ?? "Did you SEE?"}
          </p>
          {site.closing?.awards && (
            <p className="mx-auto mt-12 max-w-prose2 font-sans text-sm leading-relaxed text-ink-muted">
              {site.closing.awards}
            </p>
          )}
        </Reveal>
        {site.cartoon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={site.cartoon}
            alt={`A cartoon of ${site.name}`}
            className="pointer-events-none absolute bottom-4 right-4 w-24 sm:w-32"
          />
        )}
      </section>

      <section className="container-rail mt-24 text-center">
        <p className="font-serif text-2xl font-light text-ink-soft">
          I would enjoy keeping in touch.
        </p>
        <Link
          href="/#stay-in-touch"
          className="mt-5 inline-block rounded-full bg-ink px-7 py-3 font-sans text-sm text-paper transition-colors hover:bg-ink-soft"
        >
          Sign up here
        </Link>
        <div>
          <Link
            href="/#collections"
            className="mt-10 inline-block border-b border-ink/30 pb-1 font-sans text-sm text-ink transition-colors hover:border-ink"
          >
            Back to the collections
          </Link>
        </div>
      </section>
    </article>
  );
}
