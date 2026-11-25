import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getGeminiModels,
  isGeminiConfigured,
  missingGeminiMessage,
} from "@/lib/gemini/config";
import {
  formatGeminiError,
  isGeminiApiError,
  isRetryableGeminiError,
} from "@/lib/gemini/errors";
import { parseBillWithGemini } from "@/lib/gemini/parse-bill";
import { getActiveCurrencyForAi } from "@/lib/currency/input";
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
        { error: "Supabase is not configured.", retryable: false },
        { status: 503 }
      );
    }
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: missingGeminiMessage(), retryable: false },
        { status: 503 }
      );
    }

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in required.", retryable: false },
        { status: 401 }
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: 'Upload a bill image or PDF as form field "file".',
          retryable: false,
        },
        { status: 400 }
      );
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          error: "File must be between 1 byte and 10 MB.",
          retryable: false,
        },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED.has(mimeType)) {
      return NextResponse.json(
        {
          error: "Unsupported file type. Use JPEG, PNG, WebP, HEIC, or PDF.",
          retryable: false,
        },
        { status: 400 }
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const currency = await getActiveCurrencyForAi();
    const { extraction, meta } = await parseBillWithGemini({
      bytes: buffer,
      mimeType,
      currency,
    });

    // OCR only — never persist expenses here. Client must confirm.
    return NextResponse.json({
      ok: true,
      extraction,
      model: meta.model,
      durationMs: meta.durationMs,
      attempts: meta.attempts,
      modelsTried: meta.modelsTried,
      fileMeta: {
        name: file.name,
        mimeType,
        size: file.size,
      },
    });
  } catch (error) {
    logAuthFailure("api.bills.scan", error);
    const modelsTried =
      error &&
      typeof error === "object" &&
      "modelsTried" in error &&
      Array.isArray((error as { modelsTried?: string[] }).modelsTried)
        ? (error as { modelsTried: string[] }).modelsTried
        : getGeminiModels();

    let message: string;
    if (error instanceof Error && /GEMINI_API_KEY/i.test(error.message)) {
      message = error.message;
    } else if (error instanceof Error && error.message.trim()) {
      message = error.message;
    } else if (isGeminiApiError(error)) {
      message = formatGeminiError(error);
    } else {
      message = formatAuthError(error);
    }

    const retryable = isRetryableGeminiError(error) ||
      (error instanceof Error &&
        /All Gemini models failed|timed out|503|429|high demand/i.test(
          error.message
        ));

    return NextResponse.json(
      {
        error: message,
        retryable,
        modelsTried,
        models: getGeminiModels(),
      },
      { status: retryable ? 503 : 500 }
    );
  }
}
