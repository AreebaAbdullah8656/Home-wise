import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ProfileForm } from "@/components/auth/profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient, getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Settings"
          description="Profile, currency (default PKR), optional location, and account preferences."
        />
        <EmptyState
          icon={Settings}
          title="Connect Supabase to manage your profile"
          description="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, run the Phase 3 SQL migrations, then sign in."
        />
      </div>
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Settings" description="Sign in to edit your profile." />
        <EmptyState
          icon={Settings}
          title="Sign in required"
          description="Your profile and preferences are available after email/password sign-in."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Settings" />
        <EmptyState
          icon={Settings}
          title="Profile not found"
          description={
            error?.message ||
            "Your auth user exists but the profiles row is missing. Confirm the signup trigger migration ran successfully."
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Settings"
        description="Update your profile. Currency defaults to PKR. Location stays optional."
      />
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">User profile</CardTitle>
          <CardDescription>
            Email/password account only — no Google or magic link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} email={user.email ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
