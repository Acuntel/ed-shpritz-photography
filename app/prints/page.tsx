import type { Metadata } from "next";
import { getSite } from "@/lib/data";
import Reveal from "@/components/Reveal";
import InquiryForm from "@/components/InquiryForm";

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
        <div className="mx-auto max-w-xl">
          <Reveal>
            <p className="kicker mb-6 text-center">Inquire about a print</p>
            <InquiryForm
              email={site.contactEmail}
              formEndpoint={site.formEndpoint}
              defaultSubject="Print inquiry"
            />
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
