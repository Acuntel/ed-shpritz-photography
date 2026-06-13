import Link from "next/link";
import type { SiteContent } from "@/lib/types";

export default function Hero({ site }: { site: SiteContent }) {
  return (
    <section className="container-rail relative flex min-h-[78vh] flex-col items-center justify-center pt-16 text-center">
      <p className="kicker animate-fade-up">{site.name} Photography</p>
      <h1 className="mt-6 animate-fade-up font-serif text-[clamp(2.6rem,8vw,6rem)] font-light leading-[0.98] tracking-tight text-ink [animation-delay:80ms]">
        {site.heroLine}
      </h1>
      <p className="mt-6 animate-fade-up font-serif text-xl font-light italic text-ink-soft [animation-delay:160ms] sm:text-2xl">
        {site.tagline}
      </p>
      <p className="mt-7 max-w-prose2 animate-fade-up font-sans text-base leading-relaxed text-ink-muted [animation-delay:240ms]">
        {site.heroSub}
      </p>
      <Link
        href="#collections"
        className="mt-12 animate-fade-up font-sans text-[11px] uppercase tracking-widest2 text-ink-muted transition-colors hover:text-ink [animation-delay:320ms]"
      >
        Begin ↓
      </Link>
    </section>
  );
}
