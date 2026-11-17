import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getGeminiApiKey,
  getGeminiModelName,
  isGeminiConfigured,
  missingGeminiMessage,
} from "@/lib/gemini/config";

export function requireGemini() {
  if (!isGeminiConfigured()) {
    throw new Error(missingGeminiMessage());
  }
  const genAI = new GoogleGenerativeAI(getGeminiApiKey());
  return genAI.getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });
}

/** Strip markdown fences if the model wraps JSON anyway. */
export function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}
