import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FileStack } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { BillsList } from "@/components/bills/bills-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/server";
import { getBills } from "@/lib/finance/bills";
import {
  getBillPlaceMatches,
  getDismissedRecommendationKeys,
  getSavedRecommendationKeys,
} from "@/lib/recommendations/queries";

export const metadata: Metadata = { title: "My Bills" };
export const instant = false;

function Fallback() {
  return (
    <EmptyState
      icon={FileStack}
      title="Loading bills…"
      description="Fetching your digital bill wallet."
    />
  );
}

async function BillsContent() {
  if (!isSupabaseConfigured()) {
    return (
      <EmptyState
        icon={FileStack}
        title="Connect Supabase"
        description="Add your Supabase keys to view stored bills."
      />
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <EmptyState
        icon={FileStack}
        title="Sign in required"
        description="Sign in to open your private bill wallet."
      />
    );
  }

  const [bills, savedRecKeys, dismissedRecKeys, billMatches] =
    await Promise.all([
      getBills(),
      getSavedRecommendationKeys(),
      getDismissedRecommendationKeys(),
      getBillPlaceMatches(),
    ]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="font-heading text-xl">Confirmed bills</CardTitle>
          <CardDescription>
            Search, open originals, download, or delete. Only your bills via
            RLS + private storage. Optional live store matches appear when you
            open a bill — never auto-applied, never sample data.
          </CardDescription>
        </div>
        <Button nativeButton={false} render={<Link href="/scan-bill" />}>
          Scan a bill
        </Button>
      </CardHeader>
      <CardContent>
        <BillsList
          bills={bills}
          signedIn
          savedRecKeys={[...savedRecKeys]}
          dismissedRecKeys={[...dismissedRecKeys]}
          billMatches={billMatches}
          placesConfigured
        />
      </CardContent>
    </Card>
  );
}

export default function BillsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="My Bills"
        description="Your private digital bill wallet — confirmed scans only."
      />
      <Suspense fallback={<Fallback />}>
        <BillsContent />
      </Suspense>
    </div>
  );
}
