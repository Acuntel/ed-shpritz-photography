import { NextResponse } from "next/server";
import { loadContent, saveContent, type Content } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — the admin loads the current LIVE content from here (not the bundled
// /data/*.json, which goes stale the moment Ed publishes). Content is public.
export async function GET() {
  const content = await loadContent();
  return NextResponse.json(content, {
    headers: { "Cache-Control": "no-store" },
  });
}

function isContent(x: unknown): x is Content {
  const c = x as Content;
  return (
    !!c &&
    !!c.site &&
    Array.isArray(c.collections) &&
    Array.isArray(c.photos) &&
    Array.isArray(c.galleries)
  );
}

// POST — { passcode, verify?, content? }
//  • verify:true        → just check the passcode (used by the login screen)
//  • content provided   → check the passcode, then publish it live
export async function POST(req: Request) {
  let body: { passcode?: string; verify?: boolean; content?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) {
    return NextResponse.json(
      { error: "The site is not set up to accept changes yet." },
      { status: 500 },
    );
  }
  if (body.passcode !== expected) {
    return NextResponse.json(
      { error: "That password is not right." },
      { status: 401 },
    );
  }

  if (body.verify) {
    return NextResponse.json({ ok: true });
  }

  if (!isContent(body.content)) {
    return NextResponse.json(
      { error: "Your changes could not be read. Please try again." },
      { status: 400 },
    );
  }

  try {
    await saveContent(body.content);
  } catch {
    return NextResponse.json(
      { error: "Could not save to the website. Please try again." },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
