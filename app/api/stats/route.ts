import { NextResponse } from "next/server";
import { isValidAdminPasscode } from "@/lib/admin-auth";
import { loadContent } from "@/lib/content";
import { visitorStats } from "@/lib/visitor-stats";
import {
  analyticsConfigured,
  countryNames,
  friendlyPages,
  rangeStats,
  topMetrics,
} from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 86_400_000;
// Nothing was counted before the site launched, so "all time" starts here.
const LAUNCH = Date.UTC(2026, 5, 1);

// POST { passcode } → the numbers behind the admin Visitor report tab.
export async function POST(req: Request) {
  let body: { passcode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  if (!isValidAdminPasscode(body.passcode)) {
    return NextResponse.json(
      { error: "That password is not right." },
      { status: 401 },
    );
  }


  try {
    const now = Date.now();
    const content = await loadContent();
    if (!analyticsConfigured()) {
      const local = await visitorStats(content.collections);
      return NextResponse.json(
        { ...local, countries: countryNames(local.countries) },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const [week, month, allTime, pages, countries] =
      await Promise.all([
        rangeStats(now - 7 * DAY, now),
        rangeStats(now - 30 * DAY, now),
        rangeStats(LAUNCH, now),
        topMetrics("url", now - 30 * DAY, now, 50),
        topMetrics("country", now - 30 * DAY, now, 12),
      ]);
    const collectionNames = new Set(
      content.collections.map((collection) => collection.name),
    );
    const topCollections = friendlyPages(pages, content.collections)
      .filter((row) => collectionNames.has(row.name))
      .slice(0, 8);

    return NextResponse.json(
      {
        week,
        month,
        allTime,
        topCollections,
        countries: countryNames(countries).slice(0, 8),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "The numbers could not be fetched right now." },
      { status: 502 },
    );
  }
}
