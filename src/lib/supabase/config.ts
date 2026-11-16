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
