import { Suspense } from "react";
import type { Metadata } from "next";
import { Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TipsLibrary } from "@/components/tips/tips-library";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/server";
import { SAVING_TIPS } from "@/lib/tips/catalog";
import { getBookmarkedTipKeys } from "@/lib/tips/queries";

export const metadata: Metadata = { title: "Smart Saving Tips" };
export const instant = false;

function Fallback() {
  return (
    <EmptyState
      icon={Lightbulb}
      title="Loading tips…"
      description="Fetching your bookmarked advice."
    />
  );
}

async function TipsContent() {
  const configured = isSupabaseConfigured();
  const user = configured ? await getSessionUser() : null;
  const bookmarked = user
    ? await getBookmarkedTipKeys()
    : new Set<string>();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Tip library</CardTitle>
        <CardDescription>
          Practical advice for groceries, utilities, kitchen, cleaning, DIY,
          organization, and shopping. Bookmark what helps your household.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TipsLibrary
          tips={SAVING_TIPS}
          bookmarkedKeys={[...bookmarked]}
          signedIn={Boolean(user)}
        />
      </CardContent>
    </Card>
  );
}

export default function TipsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Smart Saving Tips"
        description="Actionable household advice you can bookmark — never forced into your workflow."
      />
      <Suspense fallback={<Fallback />}>
        <TipsContent />
      </Suspense>
    </div>
  );
}
