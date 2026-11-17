/**
 * Smoke-test ordered models with a tiny JPEG.
 * Usage: node scripts/test-gemini-resilience.mjs
 */
import { readFileSync } from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

const env = readFileSync(".env.local", "utf8");
function get(key) {
  const m = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) return "";
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const apiKey = get("GEMINI_API_KEY");
const models = (get("GEMINI_MODELS") || "gemini-3.8-flash,gemini-3.1-flash-lite")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (!apiKey) {
  console.error("SKIP: no GEMINI_API_KEY");
  process.exit(2);
}

const jpeg = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=",
  "base64"
);

function isRetryable(error) {
  const msg = String(error?.message ?? error);
  return /503|429|high demand|Service Unavailable|timeout|RESOURCE_EXHAUSTED/i.test(
    msg
  );
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const genAI = new GoogleGenerativeAI(apiKey);
let lastError;

for (const modelName of models) {
  for (let retry = 0; retry <= 2; retry++) {
    const started = Date.now();
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });
      const result = await model.generateContent([
        { text: 'Reply ONLY JSON {"ok":true}' },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: jpeg.toString("base64"),
          },
        },
      ]);
      const durationMs = Date.now() - started;
      console.log(
        `PASS model=${modelName} durationMs=${durationMs} text=${result.response.text().slice(0, 80)}`
      );
      process.exit(0);
    } catch (error) {
      lastError = error;
      const durationMs = Date.now() - started;
      console.warn(
        `FAIL model=${modelName} attempt=${retry + 1} durationMs=${durationMs} ${error.message}`
      );
      if (!isRetryable(error)) {
        process.exit(1);
      }
      if (retry < 2) await sleep(500 * 2 ** retry);
    }
  }
}

console.error("ALL_FAILED", lastError?.message || lastError);
process.exit(1);
