import type { User } from "@supabase/supabase-js";

/** True when the auth user has a confirmed email (required for app access). */
export function isEmailConfirmed(user: User | null | undefined): boolean {
  if (!user) return false;
  return Boolean(user.email_confirmed_at);
}
