import { NextResponse } from "next/server";
import { loadContent } from "@/lib/content";
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

// POST { passcode } → the numbers behind the admin "Who's looking" tab.
export async function POST(req: Request) {
  let body: { passcode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSCODE;
  if (!expected || body.passcode !== expected) {
    return NextResponse.json(
      { error: "That password is not right." },
      { status: 401 },
    );
  }

  if (!analyticsConfigured()) {
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }

  try {
    const now = Date.now();
    const [week, month, allTime, pages, countries, content] =
      await Promise.all([
        rangeStats(now - 7 * DAY, now),
        rangeStats(now - 30 * DAY, now),
        rangeStats(LAUNCH, now),
        topMetrics("url", now - 30 * DAY, now, 50),
        topMetrics("country", now - 30 * DAY, now, 12),
        loadContent(),
      ]);
    return NextResponse.json(
      {
        week,
        month,
        allTime,
        topPages: friendlyPages(pages, content.collections).slice(0, 8),
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
