import { del, list, put } from "@vercel/blob";
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
const REPORT_HOUR_UTC = 14;
const RECIPIENT = "cnidr60@gmail.com";
const SENDER = (
  process.env.ED_UPLOADS_URL || "https://ed-uploads.vercel.app"
).replace(/\/+$/, "");

type ReportLock = { duplicate: true } | { duplicate: false; url: string };

// Vercel can occasionally deliver the same cron event more than once. A
// stable weekly Blob pathname makes the send idempotent across deployments and
// server instances. Blob refuses to overwrite an existing pathname by default,
// which also closes the race between simultaneous invocations.
async function claimReport(reportKey: string): Promise<ReportLock> {
  const pathname = `reports/weekly/${reportKey}.json`;
  const exists = async () => {
    const { blobs } = await list({ prefix: pathname, limit: 1 });
    return blobs.some((blob) => blob.pathname === pathname);
  };

  if (await exists()) return { duplicate: true };

  try {
    const lock = await put(
      pathname,
      JSON.stringify({
        claimedAt: new Date().toISOString(),
        recipient: RECIPIENT,
        reportKey,
      }),
      {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json",
        cacheControlMaxAge: 60,
      },
    );
    return { duplicate: false, url: lock.url };
  } catch (error) {
    // If another invocation won the put race, its marker now exists. Any other
    // Blob failure is real and must surface instead of silently skipping mail.
    if (await exists()) return { duplicate: true };
    throw error;
  }
}

function reportPeriod(now: number): { end: number; key: string } {
  const date = new Date(now);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  let monday = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() - daysSinceMonday,
    REPORT_HOUR_UTC,
  );
  if (monday > now) monday -= 7 * DAY;
  return {
    end: monday,
    key: new Date(monday).toISOString().slice(0, 10),
  };
}

// Vercel cron hits this every Monday (vercel.json). It reads the previous
// seven full days of GoatCounter numbers and hands a plain-words summary to
// ed-uploads, which emails Ed from the Gmail account it holds credentials for.
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const adminPasscode = process.env.ADMIN_PASSCODE;
  const url = new URL(req.url);
  const authedByCron =
    !!cronSecret &&
    (req.headers.get("authorization") === `Bearer ${cronSecret}` ||
      url.searchParams.get("key") === cronSecret);
  // This header provides a protected manual recovery path when a report needs
  // to be tested or resent without waiting for the next scheduled invocation.
  const authedByAdmin =
    !!adminPasscode &&
    req.headers.get("x-admin-passcode") === adminPasscode;
  if (!authedByCron && !authedByAdmin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!analyticsConfigured() || !process.env.DIGEST_KEY) {
    return NextResponse.json({ skipped: "analytics not configured" });
  }

  const { end, key: reportKey } = reportPeriod(Date.now());
  const [thisWeek, lastWeek, pages, content] = await Promise.all([
    rangeStats(end - 7 * DAY, end),
    rangeStats(end - 14 * DAY, end - 7 * DAY),
    topMetrics("url", end - 7 * DAY, end, 50),
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
    `• ${thisWeek.visits} counted ${plural(thisWeek.visits, "visit", "visits")} across the website (${thisWeek.pageVisits} page ${plural(thisWeek.pageVisits, "visit", "visits")} in all)`,
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

  if (url.searchParams.get("dry")) {
    return NextResponse.json({
      dry: true,
      recipient: RECIPIENT,
      reportKey,
      window: {
        start: new Date(end - 7 * DAY).toISOString(),
        end: new Date(end).toISOString(),
      },
      text: lines.join("\n"),
    });
  }

  const lock = await claimReport(reportKey);
  if (lock.duplicate) {
    return NextResponse.json({
      skipped: "already sent",
      recipient: RECIPIENT,
      reportKey,
    });
  }

  try {
    const res = await fetch(`${SENDER}/api/digest-send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: process.env.DIGEST_KEY,
        to: RECIPIENT,
        subject: `Your website this week — ${thisWeek.visits} ${plural(thisWeek.visits, "visit", "visits")}`,
        text: lines.join("\n"),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      await del(lock.url).catch(() => undefined);
      return NextResponse.json(
        { error: "send failed", status: res.status },
        { status: 502 },
      );
    }
    return NextResponse.json({
      ok: true,
      recipient: RECIPIENT,
      reportKey,
      visits: thisWeek.visits,
    });
  } catch {
    await del(lock.url).catch(() => undefined);
    return NextResponse.json({ error: "send failed" }, { status: 502 });
  }
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}
