import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getGeminiModelName,
  isGeminiConfigured,
  missingGeminiMessage,
} from "@/lib/gemini/config";
import { formatGeminiError, isGeminiApiError } from "@/lib/gemini/errors";
import { parseNlExpenseWithGemini } from "@/lib/gemini/parse-nl-expense";
import { formatAuthError, logAuthFailure } from "@/lib/supabase/errors";
import { todayIso } from "@/lib/budget-math";

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

    const body = (await request.json().catch(() => null)) as {
      text?: string;
    } | null;
    const text = String(body?.text ?? "").trim();
    if (!text) {
      return NextResponse.json(
        { error: "Enter a natural-language expense description." },
        { status: 400 }
      );
    }
    if (text.length > 2000) {
      return NextResponse.json(
        { error: "Description is too long (max 2000 characters)." },
        { status: 400 }
      );
    }

    const suggestion = await parseNlExpenseWithGemini(text, todayIso());

    // Suggestion only — client must confirm before save.
    return NextResponse.json({ ok: true, suggestion });
  } catch (error) {
    logAuthFailure("api.expenses.parse-nl", error);
    let message: string;
    if (error instanceof Error && /GEMINI_API_KEY/i.test(error.message)) {
      message = error.message;
    } else if (isGeminiApiError(error)) {
      message = formatGeminiError(error);
    } else if (
      error instanceof Error &&
      (/Zod|JSON|Unexpected token/i.test(error.message) ||
        error.name === "ZodError")
    ) {
      message =
        "Could not parse that expense. Try clearer wording (name + amount + date).";
    } else if (error instanceof Error && error.message.trim()) {
      message = formatGeminiError(error);
    } else {
      message = formatAuthError(error);
    }
    return NextResponse.json(
      { error: message, model: getGeminiModelName() },
      { status: 500 }
    );
  }
}
