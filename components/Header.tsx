"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import HomePageName from "@/components/HomePageName";

const links = [
  { href: "/signup", label: "Sign up" },
  { href: "/#collections", label: "Collections" },
  { href: "/bonus", label: "Bonus" },
  { href: "/prints", label: "Prints" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
        scrolled ? "bg-paper/85 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="container-rail flex h-16 items-center justify-between">
        <Link
          href="/"
          className="group flex items-baseline gap-2"
          onClick={() => setOpen(false)}
        >
          <span className="font-serif text-lg tracking-tight text-ink">
            <HomePageName />
          </span>
          <span className="kicker hidden sm:inline">Photography</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-sans text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5 lg:hidden">
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="py-2 font-sans text-sm text-ink-soft transition-colors hover:text-ink"
          >
            Sign up
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            className="text-ink lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {pathname === "/" && (
        <div className="container-rail pb-3 text-center">
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="inline-block py-1 font-sans text-xs leading-relaxed text-ink-soft underline decoration-ink/30 underline-offset-4 transition-colors hover:text-ink"
          >
            Keep in touch—occasional new photographs and updates. Sign up.
          </Link>
        </div>
      )}

      {open && (
        <div id="mobile-navigation" className="border-t border-ink/10 bg-paper/95 backdrop-blur-md lg:hidden">
          <nav className="container-rail flex flex-col py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 font-sans text-base text-ink-soft"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
