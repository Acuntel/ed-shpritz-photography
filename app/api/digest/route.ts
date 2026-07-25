import { NextResponse } from "next/server";
import { loadContent } from "@/lib/content";
import {
  friendlyPages,
  rangeStats,
  topMetrics,
  umamiConfigured,
} from "@/lib/umami";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const SENDER = process.env.ED_UPLOADS_URL || "https://ed-uploads.vercel.app";

// Vercel cron hits this every Monday (vercel.json). It reads the week's Umami
// numbers and hands a plain-words summary to ed-uploads, which emails Ed from
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
  if (!umamiConfigured() || !process.env.DIGEST_KEY) {
    return NextResponse.json({ skipped: "analytics not configured" });
  }

  const now = Date.now();
  const [thisWeek, lastWeek, pages, content] = await Promise.all([
    rangeStats(now - 7 * DAY, now),
    rangeStats(now - 14 * DAY, now - 7 * DAY),
    topMetrics("url", now - 7 * DAY, now, 50),
    loadContent(),
  ]);
  const top = friendlyPages(pages, content.collections).slice(0, 5);

  const lines = [
    "Hello Ed,",
    "",
    "Here is your website's week, in plain numbers:",
    "",
    `• ${thisWeek.visitors} ${plural(thisWeek.visitors, "person", "people")} came to look (${thisWeek.views} ${plural(thisWeek.views, "look", "looks")} in all)`,
    `• The week before it was ${lastWeek.visitors} ${plural(lastWeek.visitors, "person", "people")}`,
  ];
  if (top.length > 0) {
    lines.push("", "What they looked at most:");
    top.forEach((t, i) =>
      lines.push(
        `  ${i + 1}. ${t.name} — ${t.count} ${plural(t.count, "look", "looks")}`,
      ),
    );
  }
  lines.push(
    "",
    'You can see these numbers any day: edshpritzphotography.com/admin → "Who’s looking".',
    "",
    "— Your website, edshpritzphotography.com",
  );

  const res = await fetch(`${SENDER}/api/digest-send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: process.env.DIGEST_KEY,
      subject: `Your website this week — ${thisWeek.visitors} ${plural(thisWeek.visitors, "person", "people")} came to look`,
      text: lines.join("\n"),
    }),
  });
  if (!res.ok) {
    return NextResponse.json({ error: "send failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, visitors: thisWeek.visitors });
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}
