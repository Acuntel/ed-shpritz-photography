import Link from "next/link";
import type { SiteContent } from "@/lib/types";

export default function Hero({
  site,
  accent,
}: {
  site: SiteContent;
  accent?: string;
}) {
  return (
    <section className="container-rail relative flex min-h-[88vh] items-center pt-16">
      <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="kicker animate-fade-up">{site.name} Photography</p>
          <h1 className="mt-6 animate-fade-up font-serif text-[clamp(2.6rem,7vw,5.4rem)] font-light leading-[0.98] tracking-tight text-ink [animation-delay:80ms]">
            {site.heroLine}
          </h1>
          <p className="mt-7 max-w-prose2 animate-fade-up font-sans text-lg leading-relaxed text-ink-soft [animation-delay:160ms]">
            {site.heroSub}
          </p>
          <div className="mt-10 flex animate-fade-up flex-wrap items-center gap-6 [animation-delay:240ms]">
            <Link
              href="#photographs"
              className="rounded-full bg-ink px-7 py-3 font-sans text-sm text-paper transition-colors hover:bg-ink-soft"
            >
              See the photographs
            </Link>
            <Link
              href="/about"
              className="border-b border-ink/30 pb-1 font-sans text-sm text-ink transition-colors hover:border-ink"
            >
              About Ed
            </Link>
          </div>
        </div>

        {accent && (
          <div className="hidden lg:col-span-5 lg:block">
            <div className="relative ml-auto max-w-sm animate-fade-up [animation-delay:200ms]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={accent}
                alt="A watercolor frame from the collection"
                className="w-full rotate-1 rounded-sm shadow-[0_40px_90px_-50px_rgba(0,0,0,0.5)]"
              />
              <span className="kicker absolute -bottom-7 right-1">
                Less is more
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
