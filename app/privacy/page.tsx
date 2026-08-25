import type { Metadata } from "next";
import Link from "next/link";
import { getSite } from "@/lib/data";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy information for Ed Shpritz Photography.",
};

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const site = await getSite();

  return (
    <article className="pt-28">
      <section className="container-rail">
        <div className="mx-auto max-w-2xl">
          <p className="kicker">A simple promise</p>
          <h1 className="mt-3 font-serif text-5xl font-light text-ink">Privacy</h1>

          <div className="mt-9 space-y-8 font-sans text-base leading-relaxed text-ink-soft">
            <section>
              <h2 className="font-serif text-2xl font-light text-ink">Stay in touch</h2>
              <p className="mt-3">
                If you join my email list, I keep the name you provide and your email address. I use them only for occasional photography news—new work, recent trips, calendars, prints, or special offers.
              </p>
              <p className="mt-3">
                I do not sell your information or share it with anyone for marketing. The list is kept privately and is available only through my website’s Admin area.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-light text-ink">Leaving the list</h2>
              <p className="mt-3">
                You can leave at any time. Reply “unsubscribe” to any update, or email me at{" "}
                <a href={`mailto:${site.contactEmail}`} className="text-ink underline underline-offset-4">
                  {site.contactEmail}
                </a>
                . I’ll remove your information from the list.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-light text-ink">Website visits</h2>
              <p className="mt-3">
                The website keeps anonymous counts of visits, pages viewed, and general country information. Those counts do not tell me your name or email address.
              </p>
            </section>
          </div>

          <Link href="/" className="mt-12 inline-block border-b border-ink/30 pb-1 font-sans text-sm text-ink hover:border-ink">
            Back to the photographs
          </Link>
        </div>
      </section>
    </article>
  );
}

