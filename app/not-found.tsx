import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-rail flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="kicker">Nothing here</p>
      <h1 className="mt-4 font-serif text-5xl font-light text-ink">
        That page wandered off
      </h1>
      <p className="mt-4 max-w-prose2 font-sans text-ink-muted">
        The picture you were looking for is not at this address.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-ink px-7 py-3 font-sans text-sm text-paper transition-colors hover:bg-ink-soft"
      >
        Back home
      </Link>
    </section>
  );
}
