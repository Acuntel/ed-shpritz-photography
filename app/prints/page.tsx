import type { Metadata } from "next";
import { getSite } from "@/lib/data";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Prints | Ed Shpritz Photography",
  description:
    "Archival, signed fine art prints by Chicago photographer Ed Shpritz, available on request.",
};

export const dynamic = "force-dynamic";

export default async function PrintsPage() {
  const site = await getSite();

  return (
    <article className="pt-28">
      <section className="container-rail">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="kicker">Take one home</p>
          <h1 className="mt-3 font-serif text-5xl font-light text-ink sm:text-6xl">
            Prints
          </h1>
          <p className="mx-auto mt-8 max-w-prose2 font-serif text-2xl font-light leading-relaxed text-ink-soft">
            {site.prints.statement}
          </p>
        </Reveal>
      </section>

      <section className="container-rail mt-16">
        <div className="mx-auto max-w-xl text-center">
          <Reveal>
            <p className="kicker mb-6">Inquire about a print</p>
            <a
              href={`mailto:${site.contactEmail}?subject=${encodeURIComponent(
                "Print inquiry",
              )}`}
              className="inline-block break-all border-b border-ink/30 pb-2 font-serif text-2xl font-light text-ink transition-colors hover:border-ink"
            >
              {site.contactEmail}
            </a>
            <p className="mt-4 font-sans text-sm text-ink-muted">
              Email Ed the picture&apos;s name and where it will live — he will
              take it from there.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container-rail mt-20 text-center">
        <p className="font-sans text-sm text-ink-faint">
          Sizes and pricing are arranged on request, one picture at a time.
        </p>
      </section>
    </article>
  );
}
