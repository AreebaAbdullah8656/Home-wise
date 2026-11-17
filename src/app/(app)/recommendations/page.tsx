import { Suspense } from "react";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DiscoveryPanel } from "@/components/recommendations/discovery-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/server";
import {
  getBillAlternativeSuggestions,
  getDismissedRecommendationKeys,
  getProfileLocation,
  getSavedRecommendationKeys,
  getSavedRecommendations,
} from "@/lib/recommendations/queries";

export const metadata: Metadata = { title: "Smart Recommendations" };
export const instant = false;

function Fallback() {
  return (
    <EmptyState
      icon={Sparkles}
      title="Loading recommendations…"
      description="Preparing sample discovery and any bill matches."
    />
  );
}

async function RecommendationsContent() {
  const configured = isSupabaseConfigured();
  const user = configured ? await getSessionUser() : null;
  const signedIn = Boolean(user);

  const [saved, savedKeys, dismissedKeys, billSuggestions, location] =
    signedIn
      ? await Promise.all([
          getSavedRecommendations(),
          getSavedRecommendationKeys(),
          getDismissedRecommendationKeys(),
          getBillAlternativeSuggestions(),
          getProfileLocation(),
        ])
      : [[], new Set<string>(), new Set<string>(), [], null];

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-xl">
          Smart shopping discovery
        </CardTitle>
        <CardDescription>
          Affordable alternatives and home essentials as a recommendation
          assistant — not a store. Sample catalog only until real APIs are
          connected.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DiscoveryPanel
          signedIn={signedIn}
          location={location}
          saved={saved}
          savedKeys={[...savedKeys]}
          dismissedKeys={[...dismissedKeys]}
          billSuggestions={billSuggestions}
        />
      </CardContent>
    </Card>
  );
}

export default function RecommendationsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Smart Recommendations"
        description="Sample product discovery and optional bill-based alternatives. No cart, checkout, or payments."
      />
      <Suspense fallback={<Fallback />}>
        <RecommendationsContent />
      </Suspense>
    </div>
  );
}
