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
import { parseNlExpenseWithGemini } from "@/lib/gemini/parse-nl-expense";
import { formatAuthError, logAuthFailure } from "@/lib/supabase/errors";
import { todayIso } from "@/lib/budget-math";

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

    const body = (await request.json().catch(() => null)) as {
      text?: string;
    } | null;
    const text = String(body?.text ?? "").trim();
    if (!text) {
      return NextResponse.json(
        {
          error: "Enter a natural-language expense description.",
          retryable: false,
        },
        { status: 400 }
      );
    }
    if (text.length > 2000) {
      return NextResponse.json(
        {
          error: "Description is too long (max 2000 characters).",
          retryable: false,
        },
        { status: 400 }
      );
    }

    const { suggestion, meta } = await parseNlExpenseWithGemini(
      text,
      todayIso()
    );

    // Suggestion only — client must confirm before save.
    return NextResponse.json({
      ok: true,
      suggestion,
      model: meta.model,
      durationMs: meta.durationMs,
      attempts: meta.attempts,
      modelsTried: meta.modelsTried,
    });
  } catch (error) {
    logAuthFailure("api.expenses.parse-nl", error);
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
    } else if (
      error instanceof Error &&
      (/Zod|JSON|Unexpected token/i.test(error.message) ||
        error.name === "ZodError")
    ) {
      message =
        "Could not parse that expense. Try clearer wording (name + amount + date).";
    } else if (error instanceof Error && error.message.trim()) {
      message = error.message;
    } else if (isGeminiApiError(error)) {
      message = formatGeminiError(error);
    } else {
      message = formatAuthError(error);
    }

    const retryable =
      isRetryableGeminiError(error) ||
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
