import type { Metadata } from "next";
import { getSite } from "@/lib/data";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Chicago fine art photographer EDward Shpritz.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const site = await getSite();

  return (
    <article className="pt-28">
      <section className="container-rail">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="kicker">Say hello</p>
          <h1 className="mt-3 font-serif text-5xl font-light text-ink">
            Contact
          </h1>
          <p className="mx-auto mt-6 max-w-prose2 font-sans text-base leading-relaxed text-ink-soft">
            Questions about a picture, a print, or anything else — email EDward
            directly.
          </p>
          <a
            href={`mailto:${site.contactEmail}`}
            className="mt-10 inline-block break-all border-b border-ink/30 pb-2 font-serif text-2xl font-light text-ink transition-colors hover:border-ink sm:text-3xl"
          >
            {site.contactEmail}
          </a>
          <p className="mt-4 font-sans text-sm text-ink-muted">
            Tapping the address opens your mail app — or copy it into any
            email.
          </p>
          <p className="mt-10 font-sans text-sm text-ink-muted">
            {site.location}
          </p>
        </Reveal>
      </section>
    </article>
  );
}
