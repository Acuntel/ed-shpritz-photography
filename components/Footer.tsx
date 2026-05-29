import Link from "next/link";
import { getSite } from "@/lib/data";

export default function Footer() {
  const site = getSite();
  const year = 2026;

  return (
    <footer className="mt-32 border-t border-ink/10">
      <div className="container-rail flex flex-col gap-10 py-16 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-serif text-2xl text-ink">{site.heroLine}</p>
          <p className="mt-3 max-w-prose2 font-sans text-sm leading-relaxed text-ink-muted">
            {site.lessIsMore}
          </p>
        </div>
        <div className="font-sans text-sm text-ink-muted">
          <p>{site.location}</p>
          <a
            href={`mailto:${site.contactEmail}`}
            className="transition-colors hover:text-ink"
          >
            {site.contactEmail}
          </a>
        </div>
      </div>
      <div className="container-rail flex items-center justify-between pb-8 text-[11px] text-ink-faint">
        <span>
          {site.name} Photography, {year}
        </span>
        <Link href="/admin" className="transition-colors hover:text-ink-muted">
          Admin
        </Link>
      </div>
    </footer>
  );
}
