import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Bonus",
  description: "A little something extra from Ed Shpritz — and a challenge to come.",
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
          <p className="kicker">Ed’ism No. 1</p>
          <span
            aria-hidden
            className="mt-8 block font-serif text-5xl leading-none text-ink-faint"
          >
            &ldquo;
          </span>
          <p className="mt-2 font-serif text-3xl font-light leading-snug text-ink sm:text-4xl">
            I can’t put in words… what words put in me!
          </p>
        </Reveal>
      </section>

      <section className="container-rail pb-20">
        <Reveal className="mx-auto max-w-2xl border-y border-ink/10 py-12 text-center">
          <p className="kicker">Coming soon</p>
          <div className="mt-7 space-y-3 font-serif text-2xl font-light leading-relaxed text-ink-soft sm:text-3xl">
            <p>WE LOOK… but do we SEE?</p>
            <p>WE HEAR… but did you LISTEN?</p>
            <p>WE LIVE…</p>
            <p>Have FUN. LIVE LIFE!</p>
          </div>
          <p className="mt-10 font-sans text-sm font-medium tracking-[0.16em] text-ink">
            WATCH FOR THE COMING CHALLENGE!
          </p>
          <p className="mt-4 font-serif text-2xl font-light leading-relaxed text-ink-soft sm:text-3xl">
            Something FUN is coming. You’ll have to LOOK closely.
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
