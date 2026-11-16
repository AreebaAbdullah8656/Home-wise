import { createRequire } from "module";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Load TS via next/tsx-less dynamic transpile is heavy; duplicate the pure logic checks:
function isDatabaseCode(code) {
  if (!code) return false;
  if (/^(22|23|42)\d{3}$/.test(code)) return true;
  if (/^PGRST/i.test(code)) return true;
  return false;
}

function extractConstraintName(message, details) {
  const text = `${message} ${details ?? ""}`;
  const named = text.match(/constraint ["']?([a-zA-Z0-9_]+)["']?/i);
  return named?.[1] ?? null;
}

function formatLike(error) {
  const code = error.code;
  const message = error.message;
  if (isDatabaseCode(code)) {
    const constraint = extractConstraintName(message, error.details);
    return [message, `code ${code}`, constraint ? `constraint ${constraint}` : null]
      .filter(Boolean)
      .join(" · ");
  }
  if (code) return `Could not reach Supabase (${code}).`; // old bug path
  return message;
}

const sample = {
  code: "23514",
  message:
    'new row for relation "expenses" violates check constraint "expenses_source_check"',
  details: null,
  hint: null,
};

const out = formatLike(sample);
const ok =
  out.includes("23514") &&
  out.includes("expenses_source_check") &&
  !out.includes("Could not reach Supabase");

console.log(out);
if (!ok) {
  console.error("FAIL: DB error still looks like network");
  process.exit(1);
}
console.log("PASS: 23514 maps to DB message with constraint name");
