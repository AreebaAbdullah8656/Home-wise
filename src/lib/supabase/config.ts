export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  // Prefer classic anon key; also accept newer "publishable" naming from Supabase dashboards.
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    "";
  return { url, anonKey };
}

/** True when public Supabase URL + anon key are both set (no secrets required). */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseEnv();
  return Boolean(url && anonKey);
}

/** Safe one-line env diagnostics for server logs (never prints secrets). */
export function getSupabaseEnvDiagnostics() {
  const { url, anonKey } = getSupabaseEnv();
  let host: string | null = null;
  let urlValid = false;
  try {
    if (url) {
      host = new URL(url).host;
      urlValid = true;
    }
  } catch {
    host = "INVALID_URL";
  }
  return {
    configured: Boolean(url && anonKey),
    urlHost: host,
    urlValid,
    keyLen: anonKey.length,
    keyFormat: anonKey.startsWith("sb_publishable")
      ? "sb_publishable"
      : anonKey.startsWith("eyJ")
        ? "jwt_anon"
        : anonKey
          ? "unknown"
          : "missing",
    looksLikePlaceholderHost: Boolean(host && /example\.supabase\.co/i.test(host)),
  };
}
