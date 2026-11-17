import { Suspense } from "react";
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
export const instant = false;

function SettingsFallback() {
  return (
    <EmptyState
      icon={Settings}
      title="Loading settings…"
      description="Fetching your profile securely."
    />
  );
}

async function SettingsContent() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <EmptyState
        icon={Settings}
        title="Connect Supabase to manage your profile"
        description="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, run the SQL migrations, then sign in."
      />
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <EmptyState
        icon={Settings}
        title="Sign in required"
        description="Your profile and preferences are available after email/password sign-in."
      />
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
      <EmptyState
        icon={Settings}
        title="Profile not found"
        description={
          error?.message ||
          "Your auth user exists but the profiles row is missing. Confirm the signup trigger migration ran successfully."
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">User profile</CardTitle>
          <CardDescription>
            Display name, currency (PKR by default), and optional location.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} email={user.email ?? ""} />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Preferences</CardTitle>
          <CardDescription>
            Bill upload stays optional. Reports never open automatically. Smart
            Recommendations uses live Google Places near your device or optional
            location — no sample stores, no cart or checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Budget alerts and notification preferences can expand later without
            changing your profile currency or location.
          </p>
          <p>
            Account security: email/password only. Sign out from the sidebar
            when you are done.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Settings"
        description="Profile, currency (PKR default), and optional location."
      />
      <Suspense fallback={<SettingsFallback />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
