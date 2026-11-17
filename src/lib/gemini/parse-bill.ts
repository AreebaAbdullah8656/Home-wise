import { requireGemini, extractJsonText } from "@/lib/gemini/client";
import {
  BILL_CATEGORY_HINTS,
  billExtractionSchema,
  type BillExtraction,
} from "@/lib/gemini/schemas";

const BILL_PROMPT = `You are HomeWise OCR for household receipts in Pakistan (PKR common).
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
Never invent discounts or taxes that are not visible.`;

export async function parseBillWithGemini(input: {
  bytes: Uint8Array;
  mimeType: string;
}): Promise<BillExtraction> {
  const model = requireGemini();
  const base64 = Buffer.from(input.bytes).toString("base64");

  const result = await model.generateContent([
    { text: BILL_PROMPT },
    {
      inlineData: {
        mimeType: input.mimeType,
        data: base64,
      },
    },
  ]);

  const text = result.response.text();
  const parsed = JSON.parse(extractJsonText(text)) as unknown;
  return billExtractionSchema.parse(parsed);
}
