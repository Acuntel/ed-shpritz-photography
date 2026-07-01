"use client";

import { useState } from "react";

const field =
  "w-full border border-ink/20 bg-paper-soft px-4 py-3 font-sans text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-ink/60";

type State = "idle" | "sending" | "sent" | "error" | "mailto";

export default function InquiryForm({
  email,
  formEndpoint,
  defaultSubject = "Inquiry from the website",
}: {
  email: string;
  formEndpoint: string;
  defaultSubject?: string;
}) {
  const [state, setState] = useState<State>("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  // Honeypot: hidden from people, catnip for bots. Non-empty → we drop it.
  const [honey, setHoney] = useState("");

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  // Fall back to the visitor's mail app and confirm clearly, so a message is
  // never silently swallowed if the send service is unreachable.
  const mailtoFallback = () => {
    const body = `${form.message}\n\n— ${form.name} (${form.email})`;
    window.open(
      `mailto:${email}?subject=${encodeURIComponent(
        defaultSubject,
      )}&body=${encodeURIComponent(body)}`,
      "_blank",
    );
    setState("mailto");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      // Server-side send via /api/contact (FormSubmit, no key needed).
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          _honey: honey,
        }),
      });
      if (res.ok) {
        setState("sent");
        setForm({ name: "", email: "", message: "" });
      } else {
        mailtoFallback();
      }
    } catch {
      mailtoFallback();
    }
  };

  if (state === "sent") {
    return (
      <p className="font-serif text-xl font-light text-ink-soft">
        Thank you — your note is on its way. Ed will be in touch soon.
      </p>
    );
  }

  if (state === "mailto") {
    return (
      <div className="space-y-3 font-sans text-sm text-ink-soft">
        <p className="font-serif text-xl font-light">
          Your email is ready to send.
        </p>
        <p>
          Your message should have opened in your email app — just press send
          there. If nothing opened, please email Ed directly at{" "}
          <a className="underline hover:text-ink" href={`mailto:${email}`}>
            {email}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={honey}
        onChange={(e) => setHoney(e.target.value)}
        className="hidden"
        aria-hidden="true"
      />
      <input
        required
        className={field}
        placeholder="Your name"
        value={form.name}
        onChange={set("name")}
      />
      <input
        required
        type="email"
        className={field}
        placeholder="Your email"
        value={form.email}
        onChange={set("email")}
      />
      <textarea
        required
        rows={5}
        className={`${field} resize-y`}
        placeholder="Your message"
        value={form.message}
        onChange={set("message")}
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="rounded-full bg-ink px-7 py-3 font-sans text-sm text-paper transition-colors hover:bg-ink-soft disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Send"}
      </button>
      {state === "error" && (
        <p className="font-sans text-sm text-red-400">
          Something went wrong. Please email{" "}
          <a className="underline" href={`mailto:${email}`}>
            {email}
          </a>{" "}
          directly.
        </p>
      )}
    </form>
  );
}
