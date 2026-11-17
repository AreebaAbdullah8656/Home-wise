import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  isGeminiConfigured,
  missingGeminiMessage,
} from "@/lib/gemini/config";
import { parseBillWithGemini } from "@/lib/gemini/parse-bill";
import { formatAuthError, logAuthFailure } from "@/lib/supabase/errors";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase is not configured." },
        { status: 503 }
      );
    }
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: missingGeminiMessage() },
        { status: 503 }
      );
    }

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Upload a bill image or PDF as form field \"file\"." },
        { status: 400 }
      );
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File must be between 1 byte and 10 MB." },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED.has(mimeType)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Use JPEG, PNG, WebP, HEIC, or PDF.",
        },
        { status: 400 }
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const extraction = await parseBillWithGemini({
      bytes: buffer,
      mimeType,
    });

    // OCR only — never persist expenses here. Client must confirm.
    return NextResponse.json({
      ok: true,
      extraction,
      fileMeta: {
        name: file.name,
        mimeType,
        size: file.size,
      },
    });
  } catch (error) {
    logAuthFailure("api.bills.scan", error);
    const message =
      error instanceof Error && /GEMINI_API_KEY/i.test(error.message)
        ? error.message
        : formatAuthError(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
