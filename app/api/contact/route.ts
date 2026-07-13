import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Where contact-form messages go. Same pattern as the Paradise Home Design
// site: a free FormSubmit.co inbox, no API key, no SMTP, no domain to verify —
// GoDaddy/Vercel can't block it because it's a plain HTTPS POST. Messages go
// ONLY to Ed — the one-time FormSubmit activation email therefore lands in Ed's
// inbox, and he clicks "Activate Form" once for sends to start working.
const TO = "ed@edshpritzphotography.com";

export async function POST(req: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    message?: string;
    _honey?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const name = (body.name ?? "").toString().trim();
  const email = (body.email ?? "").toString().trim();
  const message = (body.message ?? "").toString().trim();

  // Honeypot — real people never fill this hidden field. Pretend success so
  // bots don't learn they were caught.
  if ((body._honey ?? "").toString().trim()) {
    return NextResponse.json({ ok: true });
  }

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email, and message are required." },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(TO)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // FormSubmit refuses requests without a same-site Origin/Referer
          // ("open this page through a web server"). Required for server-side
          // sends. (Learned on the Paradise Home Design site.)
          Origin: "https://edshpritzphotography.com",
          Referer: "https://edshpritzphotography.com/contact",
        },
        body: JSON.stringify({
          _subject: `New message from your photography website — ${name}`,
          _template: "table",
          _captcha: "false",
          name,
          email,
          message,
        }),
      },
    );
    // FormSubmit returns HTTP 200 even for errors; the real signal is the
    // JSON `success` field. It is "false" until the one-time activation link
    // is clicked, so until then the browser falls back to the mail app.
    const data = (await res.json().catch(() => ({}))) as {
      success?: string | boolean;
    };
    if (String(data.success) === "true") {
      return NextResponse.json({ ok: true });
    }
    throw new Error("FormSubmit not activated or rejected");
  } catch {
    // Let the browser fall back to the visitor's mail app so a message is
    // never simply swallowed.
    return NextResponse.json(
      { error: "Message could not be sent right now." },
      { status: 502 },
    );
  }
}
