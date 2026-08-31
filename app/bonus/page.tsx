import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Bonus",
  description: "Ed’isms — a little something extra from Ed Shpritz.",
};

export default function BonusPage() {
  return (
    <main className="pt-28">
      <section className="container-rail">
        <Reveal className="border-b border-ink/10 pb-12 text-center">
          <p className="kicker">A little something extra</p>
          <h1 className="mt-3 font-serif text-5xl font-light text-ink sm:text-6xl">
            Bonus
          </h1>
        </Reveal>
      </section>

      <section className="container-rail py-20 sm:py-28">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="kicker">Ed’ism No. 1 · Life’s Return</p>
          <span
            aria-hidden
            className="mt-8 block font-serif text-5xl leading-none text-ink-faint"
          >
            &ldquo;
          </span>
          <p className="mt-2 font-serif text-3xl font-light leading-snug text-ink sm:text-4xl">
            Nature wakes… color returns… life begins anew.
          </p>
        </Reveal>
      </section>

      <section className="container-rail text-center">
        <Link
          href="/#collections"
          className="inline-block border-b border-ink/30 pb-1 font-sans text-sm text-ink transition-colors hover:border-ink"
        >
          Back to the collections
        </Link>
      </section>
    </main>
  );
}
