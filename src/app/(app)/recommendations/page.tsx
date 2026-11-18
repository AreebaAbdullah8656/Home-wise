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
  getPlacesProvider,
  placesProviderLabel,
  missingGoogleKeyHint,
} from "@/lib/places/config";
import {
  getBillPlaceMatches,
  getDismissedRecommendationKeys,
  getInitialLivePlaces,
  getProfileSearchLocation,
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
      description="Fetching nearby shops for your location."
    />
  );
}

async function RecommendationsContent() {
  const configured = isSupabaseConfigured();
  const provider = getPlacesProvider();
  const providerLabel = placesProviderLabel(provider);
  const user = configured ? await getSessionUser() : null;
  const signedIn = Boolean(user);

  const [saved, savedKeys, dismissedKeys, profileLocation, initialLive, billMatches] =
    signedIn
      ? await Promise.all([
          getSavedRecommendations(),
          getSavedRecommendationKeys(),
          getDismissedRecommendationKeys(),
          getProfileSearchLocation(),
          getInitialLivePlaces(),
          getBillPlaceMatches(),
        ])
      : [
          [],
          new Set<string>(),
          new Set<string>(),
          { label: null, latitude: null, longitude: null },
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
          Nearby stores via {providerLabel}
          {provider === "osm" ? " (default, free)" : " (GOOGLE_MAPS_API_KEY)"}.
          Pakistan radius search only — no sample catalogs or invented prices.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DiscoveryPanel
          provider={provider}
          providerLabel={providerLabel}
          providerHint={
            provider === "osm" ? missingGoogleKeyHint() : undefined
          }
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
        description="Live location-based stores (OpenStreetMap by default) — external links only."
      />
      <Suspense fallback={<Fallback />}>
        <RecommendationsContent />
      </Suspense>
    </div>
  );
}
