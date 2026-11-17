import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
function get(key) {
  const m = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) return "";
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const key = get("GEMINI_API_KEY");
if (!key) {
  console.error("NO_KEY");
  process.exit(2);
}

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`
);
const json = await res.json();
if (!res.ok) {
  console.error("LIST_FAIL", res.status, json?.error?.message || json);
  process.exit(1);
}

const names = (json.models || [])
  .map((m) => String(m.name || "").replace(/^models\//, ""))
  .filter((n) => /flash/i.test(n))
  .sort();

console.log("--- flash models ---");
for (const n of names) console.log(n);

const wanted = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];
console.log("--- wanted present? ---");
for (const w of wanted) {
  console.log(w, names.includes(w) ? "YES" : "NO");
}
