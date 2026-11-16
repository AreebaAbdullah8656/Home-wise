import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function ConfigBanner() {
  if (isSupabaseConfigured()) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-border bg-beige/70 px-4 py-3 text-sm text-secondary-foreground shadow-sm">
      <p className="font-medium">Supabase not connected yet</p>
      <p className="mt-1 text-muted-foreground">
        Create <code className="font-mono text-xs">.env.local</code> from{" "}
        <code className="font-mono text-xs">.env.example</code>, paste your project URL and
        anon key, run the SQL migrations in order, then restart the app. Auth and data
        features stay offline until then.{" "}
        <Link href="/login" className="font-medium text-primary underline">
          Open sign in
        </Link>
      </p>
    </div>
  );
}
