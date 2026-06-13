import type { Metadata } from "next";
import { getSite } from "@/lib/data";
import Reveal from "@/components/Reveal";
import InquiryForm from "@/components/InquiryForm";

export const metadata: Metadata = {
  title: "Contact | Ed Shpritz Photography",
  description: "Get in touch with Chicago fine art photographer Ed Shpritz.",
};

export default function ContactPage() {
  const site = getSite();

  return (
    <article className="pt-28">
      <section className="container-rail">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="kicker">Say hello</p>
            <h1 className="mt-3 font-serif text-5xl font-light text-ink">
              Contact
            </h1>
            <p className="mt-6 max-w-prose2 font-sans text-base leading-relaxed text-ink-soft">
              Questions about a picture, a print, or anything else — write to
              Ed.
            </p>
            <a
              href={`mailto:${site.contactEmail}`}
              className="mt-6 inline-block border-b border-ink/30 pb-1 font-sans text-sm text-ink transition-colors hover:border-ink"
            >
              {site.contactEmail}
            </a>
            <p className="mt-2 font-sans text-sm text-ink-muted">
              {site.location}
            </p>
          </Reveal>

          <Reveal className="lg:col-span-7" delay={120}>
            <InquiryForm
              email={site.contactEmail}
              formEndpoint={site.formEndpoint}
              defaultSubject="Message from edshpritzphotography.com"
            />
          </Reveal>
        </div>
      </section>
    </article>
  );
}
