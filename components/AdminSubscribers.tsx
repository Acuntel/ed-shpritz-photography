"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Trash2 } from "lucide-react";

type Subscriber = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  source: "website";
};

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function AdminSubscribers({ passcode }: { passcode: string }) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");

  const load = async () => {
    setState("loading");
    try {
      const response = await fetch("/api/subscribers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", passcode }),
      });
      if (!response.ok) throw new Error("failed");
      const result = (await response.json()) as { subscribers: Subscriber[] };
      setSubscribers(result.subscribers);
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    void load();
    // The passcode is the only value that determines which list can be read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passcode]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter((subscriber) =>
      `${subscriber.name} ${subscriber.email}`.toLowerCase().includes(q),
    );
  }, [query, subscribers]);

  const remove = async (subscriber: Subscriber) => {
    const label = subscriber.name || subscriber.email;
    if (!confirm(`Remove ${label} from the list?`)) return;
    const response = await fetch("/api/subscribers/", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode, id: subscriber.id }),
    });
    if (response.ok) {
      setSubscribers((current) => current.filter((item) => item.id !== subscriber.id));
    } else {
      alert("That name could not be removed just now. Please try again.");
    }
  };

  const download = () => {
    const rows = [
      ["Name", "Email", "Joined"],
      ...subscribers.map((subscriber) => [
        subscriber.name,
        subscriber.email,
        new Date(subscriber.joinedAt).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `ed-shpritz-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (state === "loading") {
    return (
      <p className="flex items-center gap-2 font-sans text-sm text-ink-muted">
        <Loader2 size={16} className="animate-spin" /> Loading the list…
      </p>
    );
  }

  if (state === "error") {
    return (
      <div className="font-sans text-sm text-ink-muted">
        <p>The subscriber list could not be loaded just now.</p>
        <button onClick={() => void load()} className="mt-3 underline hover:text-ink">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker">Stay in touch</p>
          <h2 className="mt-2 font-serif text-3xl font-light text-ink">
            {subscribers.length.toLocaleString()} {subscribers.length === 1 ? "subscriber" : "subscribers"}
          </h2>
          <p className="mt-2 max-w-prose2 font-sans text-sm leading-relaxed text-ink-muted">
            People who asked to hear about new photographs, calendars, prints, and occasional promotions.
          </p>
        </div>
        <button
          onClick={download}
          disabled={subscribers.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/25 px-5 py-2.5 font-sans text-sm text-ink transition-colors hover:border-ink disabled:opacity-40"
        >
          <Download size={16} /> Download list
        </button>
      </div>

      {subscribers.length > 0 && (
        <label className="block max-w-sm font-sans text-sm text-ink-soft">
          Find a name or email
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-2 w-full border border-ink/20 bg-paper-soft px-4 py-3 text-ink outline-none focus:border-ink/60"
          />
        </label>
      )}

      {subscribers.length === 0 ? (
        <p className="border-y border-ink/10 py-8 font-sans text-sm text-ink-muted">
          No one has joined yet. New names will appear here automatically.
        </p>
      ) : visible.length === 0 ? (
        <p className="font-sans text-sm text-ink-muted">No matches.</p>
      ) : (
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {visible.map((subscriber) => (
            <li key={subscriber.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-sans text-sm text-ink">{subscriber.name || "Name not given"}</p>
                <a href={`mailto:${subscriber.email}`} className="break-all font-sans text-sm text-ink-muted underline-offset-2 hover:underline">
                  {subscriber.email}
                </a>
              </div>
              <div className="flex items-center justify-between gap-6 sm:justify-end">
                <span className="font-sans text-xs text-ink-faint">
                  Joined {new Date(subscriber.joinedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => void remove(subscriber)}
                  aria-label={`Remove ${subscriber.name || subscriber.email}`}
                  className="inline-flex items-center gap-1.5 font-sans text-xs text-ink-muted hover:text-red-400"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="font-sans text-xs leading-relaxed text-ink-faint">
        This list is private. If someone asks to unsubscribe, remove them here before sending another update.
      </p>
    </div>
  );
}

