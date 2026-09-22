import type { Metadata } from "next";
import { getSite } from "@/lib/data";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Prints",
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
          <a
            href="https://fineartamerica.com/profiles/edward-shpritz/shop"
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-block border-b border-ink/30 pb-2 font-serif text-2xl font-light text-ink transition-colors hover:border-ink"
          >
            Visit my Fine Art America shop
          </a>
          <p className="mx-auto mt-8 max-w-prose2 font-serif text-xl font-light leading-relaxed text-ink-soft">
            If the photograph you want is not there, contact me at{" "}
            <a
              href={`mailto:${site.contactEmail}?subject=${encodeURIComponent(
                "Print inquiry",
              )}`}
              className="border-b border-ink/30 transition-colors hover:border-ink"
            >
              {site.contactEmail}
            </a>
            .
          </p>
        </Reveal>
      </section>
    </article>
  );
}
