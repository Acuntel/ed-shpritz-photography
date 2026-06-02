"use client";

import { useState } from "react";

const field =
  "w-full border border-ink/20 bg-paper-soft px-4 py-3 font-sans text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-ink/60";

type State = "idle" | "sending" | "sent" | "error";

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

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // No form service configured — fall back to the visitor's mail client.
    if (!formEndpoint) {
      const body = `${form.message}\n\n— ${form.name} (${form.email})`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(
        defaultSubject,
      )}&body=${encodeURIComponent(body)}`;
      return;
    }

    setState("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: formEndpoint,
          subject: defaultSubject,
          name: form.name,
          email: form.email,
          message: form.message,
        }),
      });
      setState(res.ok ? "sent" : "error");
      if (res.ok) setForm({ name: "", email: "", message: "" });
    } catch {
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <p className="font-serif text-xl font-light text-ink-soft">
        Thank you — your note is on its way. Ed will be in touch soon.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
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
