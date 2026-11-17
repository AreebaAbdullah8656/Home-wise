import { requireGemini, extractJsonText } from "@/lib/gemini/client";
import {
  BILL_CATEGORY_HINTS,
  nlExpenseSchema,
  type NlExpenseSuggestion,
} from "@/lib/gemini/schemas";
import { todayIso } from "@/lib/budget-math";

export async function parseNlExpenseWithGemini(
  text: string,
  today = todayIso()
): Promise<NlExpenseSuggestion> {
  const model = requireGemini();
  const prompt = `You parse household expense notes for HomeWise (Pakistan, PKR).
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
If amount is missing, do not invent one — omit by failing validation only if truly absent; prefer extracting Rs./PKR numbers.
If date is relative (today/yesterday), resolve using today's date.
Do not invent payment methods.`;

  const result = await model.generateContent([{ text: prompt }]);
  const raw = result.response.text();
  const parsed = JSON.parse(extractJsonText(raw)) as unknown;
  return nlExpenseSchema.parse(parsed);
}
