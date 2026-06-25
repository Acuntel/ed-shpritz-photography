import Link from "next/link";
import { getSite } from "@/lib/data";

export default async function Footer() {
  const site = await getSite();
  const year = 2026;

  return (
    <footer className="mt-32 border-t border-ink/10">
      <div className="container-rail flex flex-col gap-10 py-16 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-serif text-2xl text-ink">
            {site.name} Photography
          </p>
          <p className="mt-1 font-serif text-lg font-light italic text-ink-soft">
            {site.tagline}
          </p>
          <div className="mt-5 flex gap-5 font-sans text-sm text-ink-muted">
            <Link href="/prints" className="transition-colors hover:text-ink">
              Prints
            </Link>
            <Link href="/about" className="transition-colors hover:text-ink">
              About
            </Link>
            <Link href="/contact" className="transition-colors hover:text-ink">
              Contact
            </Link>
          </div>
        </div>
        <div className="font-sans text-sm text-ink-muted sm:text-right">
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
