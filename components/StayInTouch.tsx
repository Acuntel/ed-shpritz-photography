"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type State = "idle" | "saving" | "done" | "error";

export default function StayInTouch() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setState("saving");
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/subscribers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          consent: form.get("consent") === "yes",
          website: form.get("website"),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        alreadyJoined?: boolean;
      };
      if (!response.ok) throw new Error(result.error || "Please try again.");
      setState("done");
      setMessage(
        result.alreadyJoined
          ? "You’re already on the list—nothing else to do."
          : "Thank you. I’ll keep you posted when there’s something new.",
      );
      formElement.reset();
    } catch (error) {
      setState("error");
      setMessage((error as Error).message);
    }
  };

  return (
    <section id="stay-in-touch" className="container-rail scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl border-y border-ink/15 py-12 text-center sm:py-16">
        <p className="kicker">Stay in touch</p>
        <h2 className="mx-auto mt-3 max-w-2xl font-serif text-3xl font-light leading-snug text-ink sm:text-4xl">
          A new photograph. A recent trip. Maybe the annual calendar.
        </h2>
        <p className="mx-auto mt-5 max-w-prose2 font-sans text-base leading-relaxed text-ink-soft">
          I don’t send often—only when I have something worth sharing, like new
          pictures from Spain, a calendar, prints, or an occasional special offer.
        </p>

        {state === "done" ? (
          <p className="mx-auto mt-9 max-w-xl border border-wash-600/50 bg-paper-soft px-6 py-5 font-sans text-sm text-ink">
            {message}
          </p>
        ) : (
          <form onSubmit={submit} className="mx-auto mt-9 max-w-2xl text-left">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="font-sans text-sm text-ink-soft">
                Name <span className="text-ink-faint">(optional)</span>
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  maxLength={80}
                  className="mt-2 w-full border border-ink/20 bg-paper-soft px-4 py-3 text-ink outline-none transition-colors focus:border-ink/60"
                />
              </label>
              <label className="font-sans text-sm text-ink-soft">
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  className="mt-2 w-full border border-ink/20 bg-paper-soft px-4 py-3 text-ink outline-none transition-colors focus:border-ink/60"
                />
              </label>
            </div>

            <label className="sr-only" aria-hidden="true">
              Website
              <input name="website" type="text" tabIndex={-1} autoComplete="off" />
            </label>

            <label className="mt-5 flex items-start gap-3 font-sans text-sm leading-relaxed text-ink-soft">
              <input
                name="consent"
                type="checkbox"
                value="yes"
                required
                className="mt-1 h-4 w-4 shrink-0 accent-wash-400"
              />
              <span>
                Yes, I’d like occasional email updates from Ed Shpritz Photography.
              </span>
            </label>

            {state === "error" && (
              <p role="alert" className="mt-4 font-sans text-sm text-red-400">
                {message}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-lg font-sans text-xs leading-relaxed text-ink-muted">
                Your name and email stay private. I don’t sell or share them, and
                you can unsubscribe anytime. <Link href="/privacy" className="underline hover:text-ink">Privacy note</Link>
              </p>
              <button
                type="submit"
                disabled={state === "saving"}
                className="shrink-0 rounded-full bg-ink px-7 py-3 font-sans text-sm text-paper transition-colors hover:bg-ink-soft disabled:opacity-60"
              >
                {state === "saving" ? "Saving…" : "Keep me posted"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
