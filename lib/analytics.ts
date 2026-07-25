// Server-side client for the GoatCounter stats API (token auth, cookieless).
// Used by /api/stats (the admin "Who's looking" tab) and /api/digest (Ed's
// weekly email). Both stay dormant until GC_SITE + GC_TOKEN are set.
//
// GoatCounter has no per-person tracking at all: "visits" are short-lived
// sessions, "views" are pageviews. That's the honest vocabulary the UI uses.

export type RangeStats = { visitors: number; views: number };
export type NamedCount = { name: string; count: number };

export function analyticsConfigured(): boolean {
  return !!(process.env.GC_SITE && process.env.GC_TOKEN);
}

// GoatCounter's start/end are DATETIMES — a bare date parses as midnight, so
// an end of "today" would silently exclude the whole current day. Send full
// RFC3339 timestamps, clamped to now (future ends are rejected).
function ts(ms: number): string {
  return new Date(Math.min(ms, Date.now())).toISOString().slice(0, 19) + "Z";
}

async function get(
  path: string,
  params: Record<string, string | number>,
): Promise<unknown> {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  );
  const res = await fetch(
    `https://${process.env.GC_SITE}.goatcounter.com/api/v0/${path}?${qs}`,
    {
      headers: { Authorization: `Bearer ${process.env.GC_TOKEN}` },
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(`goatcounter ${path} ${res.status}`);
  return res.json();
}

type HitRow = { path: string; title?: string; count: number; event?: boolean };

async function hitRows(startAt: number, endAt: number): Promise<HitRow[]> {
  const r = (await get("stats/hits", {
    start: ts(startAt),
    end: ts(endAt),
    limit: 100,
  })) as { hits: HitRow[] };
  return (r.hits ?? []).filter((h) => !h.event);
}

export async function rangeStats(
  startAt: number,
  endAt: number,
): Promise<RangeStats> {
  const [totals, hits] = await Promise.all([
    get("stats/total", { start: ts(startAt), end: ts(endAt) }) as Promise<{
      total: number;
    }>,
    hitRows(startAt, endAt),
  ]);
  // stats/total.total = pageviews; per-path hit counts = visits.
  const visits = hits.reduce((n, h) => n + (h.count ?? 0), 0);
  return { visitors: visits, views: Number(totals.total ?? 0) };
}

export async function topMetrics(
  type: "url" | "country",
  startAt: number,
  endAt: number,
  limit = 10,
): Promise<NamedCount[]> {
  if (type === "url") {
    const hits = await hitRows(startAt, endAt);
    return hits
      .slice(0, limit)
      .map((h) => ({ name: h.path, count: Number(h.count ?? 0) }));
  }
  const r = (await get("stats/locations", {
    start: ts(startAt),
    end: ts(endAt),
  })) as { stats: { id?: string; name: string; count: number }[] };
  return (r.stats ?? [])
    .slice(0, limit)
    .map((s) => ({ name: s.name, count: Number(s.count ?? 0) }));
}

// Collapse raw URL paths into names Ed recognises. Admin/private/API traffic
// is dropped entirely so his numbers only ever describe the public site.
export function friendlyPages(
  rows: NamedCount[],
  collections: { slug: string; name: string }[],
): NamedCount[] {
  const bySlug = new Map(collections.map((c) => [c.slug, c.name]));
  const FIXED: Record<string, string> = {
    "": "The home page",
    about: "About Ed",
    contact: "Contact",
    prints: "Prints",
  };
  const out = new Map<string, number>();
  for (const { name: url, count } of rows) {
    const path = url.split("?")[0].replace(/^\/+|\/+$/g, "");
    if (/^(admin|gallery|api|_)/.test(path)) continue;
    let label: string | undefined;
    if (path.startsWith("collections/")) {
      label = bySlug.get(path.slice("collections/".length));
    } else {
      label = FIXED[path];
    }
    if (!label) continue;
    out.set(label, (out.get(label) ?? 0) + count);
  }
  return Array.from(out.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// GoatCounter's locations endpoint already returns full names ("United
// States"); this remains for the odd row that is still a bare region code.
export function countryNames(rows: NamedCount[]): NamedCount[] {
  const dn = new Intl.DisplayNames(["en"], { type: "region" });
  return rows.map((r) => {
    let name = r.name;
    if (/^[A-Z]{2}$/.test(name)) {
      try {
        name = dn.of(name) ?? name;
      } catch {
        // keep the raw code
      }
    }
    return { name, count: r.count };
  });
}
