import { NextResponse } from "next/server";
import {
  addSubscriber,
  listSubscribers,
  removeSubscriber,
} from "@/lib/subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isAdmin(passcode: unknown): boolean {
  return (
    typeof passcode === "string" &&
    !!process.env.ADMIN_PASSCODE &&
    passcode === process.env.ADMIN_PASSCODE
  );
}

export async function POST(req: Request) {
  let body: {
    action?: string;
    passcode?: string;
    name?: string;
    email?: string;
    consent?: boolean;
    website?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Please try again." }, { status: 400 });
  }

  if (body.action === "list") {
    if (!isAdmin(body.passcode)) {
      return NextResponse.json({ error: "Not allowed." }, { status: 401 });
    }
    try {
      const subscribers = await listSubscribers();
      return NextResponse.json(
        {
          subscribers: subscribers.map(({ unsubscribeToken: _token, ...s }) => s),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch {
      return NextResponse.json(
        { error: "The subscriber list could not be loaded just now." },
        { status: 502 },
      );
    }
  }

  // Quietly accept the hidden spam-trap field without storing anything.
  if (body.website) return NextResponse.json({ ok: true });

  const name = typeof body.name === "string" ? body.name.slice(0, 80) : "";
  const email = typeof body.email === "string" ? body.email.slice(0, 254) : "";
  if (!body.consent || !EMAIL.test(email.trim())) {
    return NextResponse.json(
      { error: "Please enter a valid email and check the permission box." },
      { status: 400 },
    );
  }

  try {
    const { alreadyJoined } = await addSubscriber({ name, email });
    return NextResponse.json({ ok: true, alreadyJoined });
  } catch {
    return NextResponse.json(
      { error: "Your email could not be saved just now. Please try again." },
      { status: 502 },
    );
  }
}

export async function DELETE(req: Request) {
  let body: { passcode?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (!isAdmin(body.passcode)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  }
  if (!body.id) {
    return NextResponse.json({ error: "Subscriber not found." }, { status: 400 });
  }

  try {
    const removed = await removeSubscriber(body.id);
    return NextResponse.json({ ok: true, removed });
  } catch {
    return NextResponse.json(
      { error: "That name could not be removed just now." },
      { status: 502 },
    );
  }
}

