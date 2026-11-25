import {
  extractJsonText,
  generateContentResilient,
  type GeminiGenerateResult,
} from "@/lib/gemini/client";
import {
  BILL_CATEGORY_HINTS,
  billExtractionSchema,
  type BillExtraction,
} from "@/lib/gemini/schemas";

function buildBillPrompt(currency: string) {
  const code = (currency || "PKR").toUpperCase();
  return `You are HomeWise OCR for household receipts.
The user's active currency is ${code}. Prefer interpreting amounts as ${code} when symbols are missing or ambiguous.

Extract structured data from this bill image or PDF.

Return ONLY JSON matching:
{
  "store_name": string|null,
  "purchase_date": "YYYY-MM-DD"|null,
  "currency": string|null,
  "subtotal": number|null,
  "discounts_total": number|null,
  "taxes_total": number|null,
  "total_amount": number|null,
  "notes": string|null,
  "items": [
    {
      "product_name": string,
      "quantity": number|null,
      "unit_price": number|null,
      "line_total": number|null,
      "discount": number|null,
      "category_suggestion": string|null
    }
  ]
}

Category suggestions should be one of: ${BILL_CATEGORY_HINTS.join(", ")}.
If a field is unclear, use null. Do not invent prices. Amounts are numbers without currency symbols.
Never invent discounts or taxes that are not visible.
Set "currency" to ${code} when the receipt does not clearly show another currency.`;
}

export type BillParseResult = {
  extraction: BillExtraction;
  meta: Omit<GeminiGenerateResult, "text">;
};

export async function parseBillWithGemini(input: {
  bytes: Uint8Array;
  mimeType: string;
  currency?: string;
}): Promise<BillParseResult> {
  const base64 = Buffer.from(input.bytes).toString("base64");
  const prompt = buildBillPrompt(input.currency ?? "PKR");

  const generated = await generateContentResilient(
    [
      { text: prompt },
      {
        inlineData: {
          mimeType: input.mimeType,
          data: base64,
        },
      },
    ],
    "bills.scan"
  );

  const parsed = JSON.parse(extractJsonText(generated.text)) as unknown;
  return {
    extraction: billExtractionSchema.parse(parsed),
    meta: {
      model: generated.model,
      durationMs: generated.durationMs,
      attempts: generated.attempts,
      modelsTried: generated.modelsTried,
    },
  };
}
