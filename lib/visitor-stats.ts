import { createHash, randomUUID } from "node:crypto";
import { list, put } from "@vercel/blob";

const PREFIX = "visitor-events/";
const STARTED_AT = "2026-09-01";

type VisitorEvent = {
  at: string;
  path: string;
  visitor: string;
  country: string;
};

type NamedCount = { name: string; count: number };

function cleanPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const path = value.split("?")[0].replace(/\/+$/, "") || "/";
  if (!path.startsWith("/") || /^(\/admin|\/api|\/gallery|\/_)/.test(path)) {
    return null;
  }
  return path.slice(0, 240);
}

export async function recordVisitor(input: {
  path: unknown;
  visitor: unknown;
  country: unknown;
}): Promise<void> {
  const path = cleanPath(input.path);
  if (!path || typeof input.visitor !== "string" || input.visitor.length > 100) {
    return;
  }

  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const visitor = createHash("sha256")
    .update(`${day}|${input.visitor}`)
    .digest("hex")
    .slice(0, 24);
  const country =
    typeof input.country === "string" && /^[A-Z]{2}$/.test(input.country)
      ? input.country
      : "";
  const event: VisitorEvent = { at: now.toISOString(), path, visitor, country };

  await put(`${PREFIX}${day}/${randomUUID()}.json`, JSON.stringify(event), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

async function eventsSince(startAt: number): Promise<VisitorEvent[]> {
  const events: VisitorEvent[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, limit: 1000, cursor });
    const eligible = page.blobs.filter((blob) => {
      const day = blob.pathname.slice(PREFIX.length, PREFIX.length + 10);
      return Date.parse(`${day}T00:00:00Z`) >= startAt;
    });
    const loaded = await Promise.all(
      eligible.map(async (blob) => {
        try {
          const response = await fetch(blob.url, { cache: "no-store" });
          return response.ok ? ((await response.json()) as VisitorEvent) : null;
        } catch {
          return null;
        }
      }),
    );
    events.push(
      ...loaded.filter((event): event is VisitorEvent => event !== null),
    );
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return events;
}

function range(events: VisitorEvent[], startAt: number) {
  const rows = events.filter((event) => Date.parse(event.at) >= startAt);
  return {
    visits: new Set(
      rows.map((event) => `${event.at.slice(0, 10)}|${event.visitor}`),
    ).size,
    pageVisits: rows.length,
  };
}

function sortedCounts(values: string[], limit: number): NamedCount[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Array.from(counts, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function visitorStats(collections: {
  slug: string;
  name: string;
}[]) {
  const now = Date.now();
  const day = 86_400_000;
  const startedAt = Date.parse(`${STARTED_AT}T00:00:00Z`);
  const events = await eventsSince(startedAt);
  const monthEvents = events.filter(
    (event) => Date.parse(event.at) >= now - 30 * day,
  );
  const collectionNames = new Map(
    collections.map((collection) => [
      `/collections/${collection.slug}`,
      collection.name,
    ]),
  );
  const collectionCounts = new Map(
    collections.map((collection) => [collection.name, 0]),
  );
  for (const event of monthEvents) {
    const name = collectionNames.get(event.path);
    if (name) {
      collectionCounts.set(name, (collectionCounts.get(name) ?? 0) + 1);
    }
  }
  const topCollections = Array.from(
    collectionCounts,
    ([name, count]) => ({ name, count }),
  ).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const countries = sortedCounts(
    Array.from(
      new Map(
        monthEvents
          .filter((event) => event.country)
          .map((event) => [
            `${event.at.slice(0, 10)}|${event.visitor}|${event.country}`,
            event.country,
          ]),
      ).values(),
    ),
    8,
  );

  return {
    week: range(events, now - 7 * day),
    month: range(events, now - 30 * day),
    allTime: range(events, startedAt),
    topCollections,
    countries,
    trackingSince: STARTED_AT,
  };
}
