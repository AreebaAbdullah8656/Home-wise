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
  isGooglePlacesConfigured,
  missingPlacesMessage,
} from "@/lib/places/config";
import {
  getBillPlaceMatches,
  getDismissedRecommendationKeys,
  getInitialLivePlaces,
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
      title="Loading live recommendations…"
      description="Fetching Google Places near your location."
    />
  );
}

async function RecommendationsContent() {
  const configured = isSupabaseConfigured();
  const placesConfigured = isGooglePlacesConfigured();
  const user = configured ? await getSessionUser() : null;
  const signedIn = Boolean(user);

  const [saved, savedKeys, dismissedKeys, profileLocation, initialLive, billMatches] =
    signedIn
      ? await Promise.all([
          getSavedRecommendations(),
          getSavedRecommendationKeys(),
          getDismissedRecommendationKeys(),
          getProfileLocation(),
          getInitialLivePlaces(),
          placesConfigured ? getBillPlaceMatches() : Promise.resolve([]),
        ])
      : [
          [],
          new Set<string>(),
          new Set<string>(),
          null,
          await getInitialLivePlaces(),
          [],
        ];

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-xl">
          Live shopping discovery
        </CardTitle>
        <CardDescription>
          Nearby stores from Google Places. No sample catalogs, no invented
          prices, no cart or checkout.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DiscoveryPanel
          placesConfigured={placesConfigured}
          missingKeyMessage={missingPlacesMessage()}
          signedIn={signedIn}
          profileLocation={profileLocation}
          initialLive={initialLive}
          saved={saved}
          savedKeys={[...savedKeys]}
          dismissedKeys={[...dismissedKeys]}
          billMatches={billMatches}
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
        description="Live location-based stores via Google Places — external links only."
      />
      <Suspense fallback={<Fallback />}>
        <RecommendationsContent />
      </Suspense>
    </div>
  );
}
