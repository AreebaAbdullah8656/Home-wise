import { getSupabaseEnv } from "@/lib/supabase/config";

type CauseLike = {
  name?: string;
  message?: string;
  code?: string;
  errno?: string | number;
  syscall?: string;
  hostname?: string;
  cause?: unknown;
};

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
    });
    current = err.cause;
  }
  return chain;
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
    causes: collectCauses(error),
  });
}

/** Turn opaque "fetch failed" into an actionable message when possible. */
export function formatAuthError(error: unknown): string {
  const chain = collectCauses(error);
  const topMessage =
    (error && typeof error === "object" && "message" in error
      ? String((error as { message?: string }).message ?? "")
      : String(error ?? "")) || "Authentication request failed.";

  const codes = chain
    .map((c) => c.code)
    .filter((c): c is string => Boolean(c));
  const hostnames = chain
    .map((c) => c.hostname)
    .filter((h): h is string => Boolean(h));

  if (/fetch failed/i.test(topMessage) || codes.length > 0) {
    if (codes.includes("ENOTFOUND") || codes.includes("EAI_AGAIN")) {
      const host = hostnames[0] ?? "your Supabase host";
      return `Could not resolve Supabase host (${host}). Check NEXT_PUBLIC_SUPABASE_URL in .env.local and your DNS, then restart npm run dev.`;
    }
    if (codes.includes("ECONNREFUSED")) {
      return "Connection refused talking to Supabase. Confirm the project URL is correct and the project is not paused.";
    }
    if (codes.includes("CERT_HAS_EXPIRED") || codes.includes("UNABLE_TO_VERIFY_LEAF_SIGNATURE")) {
      return "TLS certificate error reaching Supabase. Check system time/proxy settings.";
    }
    if (codes.includes("ETIMEDOUT") || codes.includes("ABORT_ERR")) {
      return "Timed out reaching Supabase. Check network/firewall access to *.supabase.co.";
    }
    if (hostnames.some((h) => /example\.supabase\.co/i.test(h))) {
      return "NEXT_PUBLIC_SUPABASE_URL is still set to example.supabase.co (often from a leftover shell env). Clear that override, keep the real URL in .env.local, and restart npm run dev.";
    }

    const detail = [codes.join(","), hostnames[0]].filter(Boolean).join(" @ ");
    return detail
      ? `Could not reach Supabase (${detail}). Verify .env.local URL/key and restart the dev server.`
      : "Could not reach Supabase (fetch failed). Verify NEXT_PUBLIC_SUPABASE_URL in .env.local is correct, that no shell env overrides it, and restart npm run dev.";
  }

  return topMessage;
}
