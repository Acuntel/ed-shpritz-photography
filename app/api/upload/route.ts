import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isValidAdminPasscode } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Issues short-lived Vercel Blob client-upload tokens so Ed's browser streams
// each photograph straight to Blob — no function size limit, and (crucially)
// the bytes are saved the instant he picks the picture, so the browser can
// never "lose" them again. The passcode rides along as clientPayload and is
// checked here before any token is granted.
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        if (!isValidAdminPasscode(clientPayload)) {
          throw new Error(
            "Your admin sign-in expired. Sign out, sign in again, and retry the picture.",
          );
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Nothing to do — the client records the returned URL on the photo.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("Photo upload failed:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Upload failed." },
      { status: 400 },
    );
  }
}
