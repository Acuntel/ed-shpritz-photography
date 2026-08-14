import { NextResponse } from "next/server";
import { loadContent } from "@/lib/content";
import {
  analyticsConfigured,
  friendlyPages,
  rangeStats,
  topMetrics,
} from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const SENDER = (
  process.env.ED_UPLOADS_URL || "https://ed-uploads.vercel.app"
).replace(/\/+$/, "");

// Vercel cron hits this every Monday (vercel.json). It reads the week's
// GoatCounter numbers and hands a plain-words summary to ed-uploads, which
// emails Ed from
// the Gmail account it already holds credentials for.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const authed =
    !!secret &&
    (req.headers.get("authorization") === `Bearer ${secret}` ||
      url.searchParams.get("key") === secret);
  if (!authed) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Before analytics is switched on there is nothing to report — succeed
  // quietly so the cron doesn't register failures.
  if (!analyticsConfigured() || !process.env.DIGEST_KEY) {
    return NextResponse.json({ skipped: "analytics not configured" });
  }

  const now = Date.now();
  const [thisWeek, lastWeek, pages, content] = await Promise.all([
    rangeStats(now - 7 * DAY, now),
    rangeStats(now - 14 * DAY, now - 7 * DAY),
    topMetrics("url", now - 7 * DAY, now, 50),
    loadContent(),
  ]);
  const collectionNames = new Set(
    content.collections.map((collection) => collection.name),
  );
  const topCollections = friendlyPages(pages, content.collections)
    .filter((row) => collectionNames.has(row.name))
    .slice(0, 5);

  const lines = [
    "Hello Ed,",
    "",
    "Here is your website's week, in plain numbers:",
    "",
    `• ${thisWeek.visits} counted ${plural(thisWeek.visits, "visit", "visits")} across the website (${thisWeek.views} page ${plural(thisWeek.views, "view", "views")} in all)`,
    `• The week before: ${lastWeek.visits} counted ${plural(lastWeek.visits, "visit", "visits")}`,
  ];
  if (topCollections.length > 0) {
    lines.push("", "Collections visited most:");
    topCollections.forEach((collection, index) =>
      lines.push(
        `  ${index + 1}. ${collection.name} — ${collection.count} ${plural(collection.count, "visit", "visits")}`,
      ),
    );
  }
  lines.push(
    "",
    "These counts are anonymous. One person can create more than one visit by looking at several pages; the website never knows anyone’s name.",
    "",
    'You can see these numbers any day: edshpritzphotography.com/admin → "Who’s looking".',
    "",
    "— Your website, edshpritzphotography.com",
  );

  // ?dry=1 returns the composed email without sending — for safe testing.
  if (url.searchParams.get("dry")) {
    return NextResponse.json({ dry: true, text: lines.join("\n") });
  }

  try {
    const res = await fetch(`${SENDER}/api/digest-send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: process.env.DIGEST_KEY,
        subject: `Your website this week — ${thisWeek.visits} ${plural(thisWeek.visits, "visit", "visits")}`,
        text: lines.join("\n"),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "send failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, visits: thisWeek.visits });
  } catch {
    return NextResponse.json({ error: "send failed" }, { status: 502 });
  }
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}
