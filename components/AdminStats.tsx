"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type Range = { visits: number; pageVisits: number };
type NamedCount = { name: string; count: number };
type Stats = {
  week: Range;
  month: Range;
  allTime: Range;
  topCollections: NamedCount[];
  countries: NamedCount[];
};

function visits(n: number): string {
  return `${n.toLocaleString()} ${n === 1 ? "visit" : "visits"}`;
}

function pageVisits(n: number): string {
  return `${n.toLocaleString()} page ${n === 1 ? "visit" : "visits"}`;
}

function Tile({ label, range }: { label: string; range: Range }) {
  return (
    <div className="border border-ink/10 p-6">
      <p className="kicker">{label}</p>
      <p className="mt-3 font-serif text-5xl font-light text-ink">
        {range.visits.toLocaleString()}
      </p>
      <p className="mt-1 font-sans text-sm text-ink-muted">
        {range.visits === 1 ? "visit" : "visits"} · {pageVisits(range.pageVisits)}
      </p>
    </div>
  );
}

function CountList({ title, rows }: { title: string; rows: NamedCount[] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <p className="kicker mb-4">{title}</p>
      <ul className="divide-y divide-ink/10 border-y border-ink/10">
        {rows.map((r) => (
          <li
            key={r.name}
            className="flex items-baseline justify-between gap-4 py-3"
          >
            <span className="font-sans text-sm text-ink">{r.name}</span>
            <span className="shrink-0 font-sans text-sm text-ink-muted">
              {visits(r.count)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// The "Who's looking" tab: Ed's visit numbers in plain words. Read-only —
// nothing here touches his photographs or publishes anything.
export default function AdminStats({ passcode }: { passcode: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "off" | "error">(
    "loading",
  );

  useEffect(() => {
    fetch("/api/stats/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    })
      .then(async (r) => {
        if (r.status === 503) return setState("off");
        if (!r.ok) throw new Error("failed");
        setStats((await r.json()) as Stats);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [passcode]);

  if (state === "loading") {
    return (
      <p className="flex items-center gap-2 font-sans text-sm text-ink-muted">
        <Loader2 size={16} className="animate-spin" /> Counting website
        visits...
      </p>
    );
  }
  if (state === "off") {
    return (
      <p className="max-w-prose2 font-sans text-sm leading-relaxed text-ink-muted">
        Counting has not been switched on yet. Once it is, this page fills with
        real numbers — how many visits there were and which collections were
        viewed.
      </p>
    );
  }
  if (state === "error" || !stats) {
    return (
      <p className="max-w-prose2 font-sans text-sm leading-relaxed text-ink-muted">
        The numbers could not be fetched just now. Check your internet and try
        this tab again in a moment.
      </p>
    );
  }

  return (
    <div className="max-w-3xl space-y-12">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tile label="This week" range={stats.week} />
        <Tile label="This month" range={stats.month} />
        <Tile label="All time" range={stats.allTime} />
      </div>

      <CountList
        title="Collections visited most (last 30 days)"
        rows={stats.topCollections}
      />
      <CountList title="Where they are" rows={stats.countries} />

      <p className="font-sans text-xs leading-relaxed text-ink-faint">
        These counts are anonymous. One person can create more than one visit by
        looking at several pages; the website never knows anyone&apos;s name.
        Your own visits from this device are not counted.
      </p>
    </div>
  );
}
