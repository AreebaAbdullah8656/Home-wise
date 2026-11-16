import { getSupabaseEnv } from "@/lib/supabase/config";

type CauseLike = {
  name?: string;
  message?: string;
  code?: string;
  errno?: string | number;
  syscall?: string;
  hostname?: string;
  details?: string;
  hint?: string;
  cause?: unknown;
};

const NETWORK_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "EPIPE",
  "ETIMEDOUT",
  "ABORT_ERR",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
  "UND_ERR_SOCKET",
  "CERT_HAS_EXPIRED",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
]);

/** Postgres / PostgREST codes that are application/data errors, not network. */
function isDatabaseCode(code: string | undefined): boolean {
  if (!code) return false;
  // Postgres SQLSTATE classes: 23xxx integrity, 42xxx syntax/access, 22xxx data
  if (/^(22|23|42)\d{3}$/.test(code)) return true;
  // PostgREST / Supabase API codes
  if (/^PGRST/i.test(code)) return true;
  if (/^4\d{2}$/.test(code)) return true; // HTTP-ish from some clients
  return false;
}

function collectCauses(error: unknown): CauseLike[] {
  const chain: CauseLike[] = [];
  let current: unknown = error;
  const seen = new Set<unknown>();
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const err = current as CauseLike & { message?: string };
    chain.push({
      name: err.name,
      message: err.message,
      code: err.code,
      errno: err.errno,
      syscall: err.syscall,
      hostname: err.hostname,
      details:
        "details" in err && err.details != null ? String(err.details) : undefined,
      hint: "hint" in err && err.hint != null ? String(err.hint) : undefined,
    });
    current = err.cause;
  }
  return chain;
}

function pickDbFields(error: unknown): {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
} {
  const chain = collectCauses(error);
  const withCode = chain.find((c) => c.code);
  const top =
    error && typeof error === "object"
      ? (error as {
          code?: string;
          message?: string;
          details?: string;
          hint?: string;
        })
      : {};

  const message =
    (typeof top.message === "string" && top.message) ||
    withCode?.message ||
    (typeof error === "string" ? error : "") ||
    "Database request failed.";

  return {
    code: top.code ?? withCode?.code,
    message,
    details: top.details ?? withCode?.details,
    hint: top.hint ?? withCode?.hint,
  };
}

/** Extract constraint name from Postgres check/unique violation messages. */
function extractConstraintName(message: string, details?: string): string | null {
  const text = `${message} ${details ?? ""}`;
  const named = text.match(
    /constraint ["']?([a-zA-Z0-9_]+)["']?/i
  );
  if (named?.[1]) return named[1];
  const violates = text.match(
    /violates check constraint ["']?([a-zA-Z0-9_]+)["']?/i
  );
  return violates?.[1] ?? null;
}

/** Log auth/network failures with env shape only (never full secrets). */
export function logAuthFailure(scope: string, error: unknown) {
  const { url, anonKey } = getSupabaseEnv();
  let host: string | null = null;
  try {
    host = url ? new URL(url).host : null;
  } catch {
    host = "INVALID_URL";
  }

  const db = pickDbFields(error);
  console.error(`[HomeWise auth:${scope}]`, {
    urlHost: host,
    urlLen: url.length,
    keyLen: anonKey.length,
    keyFormat: anonKey.startsWith("sb_publishable")
      ? "sb_publishable"
      : anonKey.startsWith("eyJ")
        ? "jwt_anon"
        : anonKey
          ? "unknown"
          : "missing",
    dbCode: db.code,
    dbMessage: db.message,
    causes: collectCauses(error),
  });
}

/**
 * Human-readable error for Supabase/PostgREST/Postgres failures.
 * DB integrity errors keep code + constraint; only real network failures
 * say "Could not reach Supabase".
 */
export function formatAuthError(error: unknown): string {
  const chain = collectCauses(error);
  const db = pickDbFields(error);
  const codes = chain
    .map((c) => c.code)
    .filter((c): c is string => Boolean(c));
  const hostnames = chain
    .map((c) => c.hostname)
    .filter((h): h is string => Boolean(h));

  // Prefer explicit database / API error reporting (e.g. 23514 check_violation)
  if (isDatabaseCode(db.code) || codes.some(isDatabaseCode)) {
    const code = db.code ?? codes.find(isDatabaseCode) ?? "db";
    const constraint = extractConstraintName(db.message, db.details);
    const parts = [
      db.message.replace(/\s+/g, " ").trim(),
      `code ${code}`,
      constraint ? `constraint ${constraint}` : null,
      db.hint ? `hint: ${db.hint}` : null,
    ].filter(Boolean);
    return parts.join(" · ");
  }

  const topMessage = db.message || "Authentication request failed.";
  const networkCodes = codes.filter((c) => NETWORK_CODES.has(c));
  const looksLikeFetch =
    /fetch failed/i.test(topMessage) ||
    /Failed to fetch/i.test(topMessage) ||
    /NetworkError/i.test(topMessage);

  if (looksLikeFetch || networkCodes.length > 0) {
    if (networkCodes.includes("ENOTFOUND") || networkCodes.includes("EAI_AGAIN")) {
      const host = hostnames[0] ?? "your Supabase host";
      return `Could not resolve Supabase host (${host}). Check NEXT_PUBLIC_SUPABASE_URL in .env.local and your DNS, then restart npm run dev.`;
    }
    if (networkCodes.includes("ECONNREFUSED")) {
      return "Connection refused talking to Supabase. Confirm the project URL is correct and the project is not paused.";
    }
    if (
      networkCodes.includes("CERT_HAS_EXPIRED") ||
      networkCodes.includes("UNABLE_TO_VERIFY_LEAF_SIGNATURE")
    ) {
      return "TLS certificate error reaching Supabase. Check system time/proxy settings.";
    }
    if (
      networkCodes.includes("ETIMEDOUT") ||
      networkCodes.includes("ABORT_ERR") ||
      networkCodes.some((c) => c.startsWith("UND_ERR_"))
    ) {
      return "Timed out reaching Supabase. Check network/firewall access to *.supabase.co.";
    }
    if (hostnames.some((h) => /example\.supabase\.co/i.test(h))) {
      return "NEXT_PUBLIC_SUPABASE_URL is still set to example.supabase.co (often from a leftover shell env). Clear that override, keep the real URL in .env.local, and restart npm run dev.";
    }

    const detail = [networkCodes.join(",") || "fetch failed", hostnames[0]]
      .filter(Boolean)
      .join(" @ ");
    return `Could not reach Supabase (${detail}). Verify .env.local URL/key and restart the dev server.`;
  }

  return topMessage;
}
