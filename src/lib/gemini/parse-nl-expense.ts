import {
  extractJsonText,
  generateContentResilient,
  type GeminiGenerateResult,
} from "@/lib/gemini/client";
import {
  BILL_CATEGORY_HINTS,
  nlExpenseSchema,
  type NlExpenseSuggestion,
} from "@/lib/gemini/schemas";
import { todayIso } from "@/lib/budget-math";

export type NlParseResult = {
  suggestion: NlExpenseSuggestion;
  meta: Omit<GeminiGenerateResult, "text">;
};

export async function parseNlExpenseWithGemini(
  text: string,
  today = todayIso(),
  currency = "PKR"
): Promise<NlParseResult> {
  const code = (currency || "PKR").toUpperCase();
  const prompt = `You parse household expense notes for HomeWise.
The user's active currency is ${code}. Interpret bare amounts as ${code}.
Today's date is ${today}.

User said:
"""
${text}
"""

Return ONLY JSON:
{
  "name": string,
  "amount": number,
  "category_suggestion": string|null,
  "expense_date": "YYYY-MM-DD"|null,
  "payment_method": string|null,
  "notes": string|null,
  "confidence": "high"|"medium"|"low"
}

Category should be one of: ${BILL_CATEGORY_HINTS.join(", ")}.
If amount is missing, do not invent one — omit by failing validation only if truly absent; prefer extracting ${code} amounts.
If date is relative (today/yesterday), resolve using today's date.
Do not invent payment methods.`;

  const generated = await generateContentResilient(
    [{ text: prompt }],
    "expenses.parse-nl"
  );

  const parsed = JSON.parse(extractJsonText(generated.text)) as unknown;
  return {
    suggestion: nlExpenseSchema.parse(parsed),
    meta: {
      model: generated.model,
      durationMs: generated.durationMs,
      attempts: generated.attempts,
      modelsTried: generated.modelsTried,
    },
  };
}
