import { NextResponse } from "next/server";
import { recordVisitor } from "@/lib/visitor-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { path?: unknown; visitor?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    await recordVisitor({
      path: body.path,
      visitor: body.visitor,
      country: req.headers.get("x-vercel-ip-country") || "",
    });
  } catch {
    // Visitor counting must never interfere with a visitor enjoying the site.
  }
  return NextResponse.json({ ok: true });
}
