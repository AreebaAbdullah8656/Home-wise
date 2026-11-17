"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PlaceCard } from "@/components/recommendations/place-card";
import { Button } from "@/components/ui/button";
import type { BillPlaceMatch } from "@/lib/recommendations/queries";

type BillItemSuggestionsProps = {
  matches: BillPlaceMatch[];
  signedIn: boolean;
  savedKeys?: string[];
  dismissedKeys?: string[];
  placesConfigured: boolean;
};

/**
 * Optional live Places matches for confirmed bill items.
 * Collapsed until the user expands — never invents prices.
 */
export function BillItemSuggestions({
  matches,
  signedIn,
  savedKeys = [],
  dismissedKeys = [],
  placesConfigured,
}: BillItemSuggestionsProps) {
  const [open, setOpen] = useState(false);
  const savedSet = useMemo(() => new Set(savedKeys), [savedKeys]);
  const dismissedSet = useMemo(() => new Set(dismissedKeys), [dismissedKeys]);

  const visible = useMemo(
    () =>
      matches
        .map((m) => ({
          ...m,
          places: m.places.filter(
            (p) => !dismissedSet.has(`place:${p.placeId}`)
          ),
        }))
        .filter((m) => m.places.length > 0 || m.error),
    [matches, dismissedSet]
  );

  const placeCount = visible.reduce((n, m) => n + m.places.length, 0);

  if (!placesConfigured) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        Live store suggestions need GOOGLE_MAPS_API_KEY. No sample alternatives
        are shown.
      </div>
    );
  }

  if (visible.length === 0) return null;

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          Optional live store matches
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOpen((v) => !v)}
        >
          {open
            ? "Hide suggestions"
            : `Show suggestions (${placeCount || visible.length})`}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Google Places text search for confirmed line items near your location.
        No invented product prices. Expand only if you want to see them.
      </p>
      {open ? (
        <div className="space-y-4">
          {visible.map((match) => (
            <div key={match.billItemId} className="space-y-2">
              <p className="text-sm font-medium">{match.billItemName}</p>
              {match.error ? (
                <p className="text-sm text-destructive">{match.error}</p>
              ) : null}
              <ul className="grid gap-3">
                {match.places.map((place) => (
                  <PlaceCard
                    key={`${match.billItemId}-${place.placeId}`}
                    place={place}
                    signedIn={signedIn}
                    saved={savedSet.has(`place:${place.placeId}`)}
                    kind="bill_place_match"
                    billItemId={match.billItemId}
                    billItemName={match.billItemName}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
      <Button
        size="sm"
        variant="ghost"
        nativeButton={false}
        render={<Link href="/recommendations" />}
      >
        Open Smart Recommendations
      </Button>
    </div>
  );
}
