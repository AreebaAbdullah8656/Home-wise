import {
  extractJsonText,
  generateContentResilient,
  type GeminiGenerateResult,
} from "@/lib/gemini/client";
import {
  aiSavingTipsResponseSchema,
  SAVING_TIP_CATEGORIES,
  type AiSavingTipDraft,
} from "@/lib/gemini/schemas";
import type { HouseholdTipAggregates } from "@/lib/tips/aggregates";

export type GenerateSavingTipsResult = {
  tips: AiSavingTipDraft[];
  meta: Omit<GeminiGenerateResult, "text">;
};

/**
 * Personalized saving tips from aggregated household numbers only.
 * Never send raw bills, people names, or free-text notes to the model.
 */
export async function generateSavingTipsWithGemini(
  aggregates: HouseholdTipAggregates
): Promise<GenerateSavingTipsResult> {
  const prompt = `You write practical household saving tips for HomeWise (Pakistan family budget app).

You receive ONLY aggregated numbers. Do not invent store names, product prices, discounts, deals, or delivery claims.
Be honest and actionable. Prefer habits and process over shopping claims.

Aggregates (JSON):
${JSON.stringify(aggregates)}

Return ONLY JSON:
{
  "tips": [
    {
      "category": one of ${SAVING_TIP_CATEGORIES.join(", ")},
      "title": short title,
      "body": 1-2 sentences of practical advice grounded in the aggregates when possible
    }
  ]
}

Rules:
- Return 5 to 7 tips.
- Cover several categories when possible.
- If budget utilization is high, include at least one tip about slowing discretionary spend.
- If grocery pending items or low inventory stock is high, include organization/grocery tips.
- If repeatedPurchaseLabels exist, suggest reducing frequency or checking inventory first — do not invent brands.
- Never mention AI, models, or that you saw JSON.
- Currency for any amounts you reference must be ${aggregates.currency}.`;

  const generated = await generateContentResilient(
    [{ text: prompt }],
    "tips.ai-saving"
  );

  const parsed = JSON.parse(extractJsonText(generated.text)) as unknown;
  const validated = aiSavingTipsResponseSchema.parse(parsed);
  return {
    tips: validated.tips,
    meta: {
      model: generated.model,
      durationMs: generated.durationMs,
      attempts: generated.attempts,
      modelsTried: generated.modelsTried,
    },
  };
}
