// Server-side client for the Umami Cloud stats API (api.umami.is, key auth).
// Used by /api/stats (the admin "Who's looking" tab) and /api/digest (Ed's
// weekly email). Both stay dormant until the env vars below are set.
const API = "https://api.umami.is/v1";

export type RangeStats = { visitors: number; views: number };
export type NamedCount = { name: string; count: number };

export function umamiConfigured(): boolean {
  return !!(process.env.UMAMI_WEBSITE_ID && process.env.UMAMI_API_KEY);
}

async function get(
  path: string,
  params: Record<string, string | number>,
): Promise<unknown> {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  );
  const res = await fetch(
    `${API}/websites/${process.env.UMAMI_WEBSITE_ID}/${path}?${qs}`,
    {
      headers: { "x-umami-api-key": process.env.UMAMI_API_KEY! },
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(`umami ${path} ${res.status}`);
  return res.json();
}

// The stats endpoint has returned both bare numbers and {value} objects across
// API versions — accept either.
function num(x: unknown): number {
  if (typeof x === "object" && x !== null)
    return Number((x as { value?: number }).value ?? 0);
  return Number(x ?? 0);
}

export async function rangeStats(
  startAt: number,
  endAt: number,
): Promise<RangeStats> {
  const s = (await get("stats", { startAt, endAt })) as {
    visitors: unknown;
    pageviews: unknown;
  };
  return { visitors: num(s.visitors), views: num(s.pageviews) };
}

export async function topMetrics(
  type: "url" | "country",
  startAt: number,
  endAt: number,
  limit = 10,
): Promise<NamedCount[]> {
  const rows = (await get("metrics", { type, startAt, endAt, limit })) as {
    x: string | null;
    y: number;
  }[];
  return rows
    .filter((r) => r.x)
    .map((r) => ({ name: r.x as string, count: Number(r.y) }));
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

export function countryNames(rows: NamedCount[]): NamedCount[] {
  const dn = new Intl.DisplayNames(["en"], { type: "region" });
  return rows.map((r) => {
    let name = r.name;
    try {
      name = dn.of(r.name.toUpperCase()) ?? r.name;
    } catch {
      // keep the raw code
    }
    return { name, count: r.count };
  });
}
