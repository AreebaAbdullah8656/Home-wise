/**
 * Smoke-test Gemini multimodal with the app's default model.
 * Usage: node scripts/test-gemini-model.mjs
 * Reads GEMINI_API_KEY / GEMINI_MODEL from .env.local (never prints the key).
 */
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

const env = readFileSync(".env.local", "utf8");
function get(key) {
  const m = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) return "";
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const apiKey = get("GEMINI_API_KEY");
const modelName = get("GEMINI_MODEL") || "gemini-3.8-flash";

if (!apiKey) {
  console.error("SKIP: GEMINI_API_KEY not set in .env.local");
  process.exit(2);
}

console.log("model:", modelName, "keyLen:", apiKey.length);

// Minimal 1x1 JPEG (valid image bytes for multimodal probe)
const jpeg = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=",
  "base64"
);

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: modelName,
  generationConfig: {
    temperature: 0.1,
    responseMimeType: "application/json",
  },
});

try {
  const result = await model.generateContent([
    {
      text: 'Reply ONLY with JSON: {"ok":true,"note":"short"}. This is a tiny receipt test image.',
    },
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: jpeg.toString("base64"),
      },
    },
  ]);
  const text = result.response.text();
  console.log("PASS multimodal image:", text.slice(0, 200));
} catch (error) {
  console.error("FAIL:", error?.message || error);
  process.exit(1);
}
