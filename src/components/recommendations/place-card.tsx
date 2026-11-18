"use client";

import { useActionState } from "react";
import {
  dismissRecommendation,
  saveRecommendation,
  type ActionState,
} from "@/app/recommendations/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatPlaceTypeLabel,
  googleMapsSearchUrl,
  hasUsablePlaceName,
} from "@/lib/places/maps-search";
import type { LivePlace } from "@/lib/places/types";

const initial: ActionState = {};

type PlaceCardProps = {
  place: LivePlace;
  signedIn: boolean;
  saved?: boolean;
  kind?: "live_place" | "bill_place_match";
  billItemId?: string;
  billItemName?: string;
  /** User city / Settings location when place has no coordinates. */
  fallbackCity?: string | null;
};

export function PlaceCard({
  place,
  signedIn,
  saved = false,
  kind = "live_place",
  billItemId,
  billItemName,
  fallbackCity = null,
}: PlaceCardProps) {
  const [saveState, saveAction, savePending] = useActionState(
    saveRecommendation,
    initial
  );
  const [dismissState, dismissAction, dismissPending] = useActionState(
    dismissRecommendation,
    initial
  );
  const state = saveState.success || saveState.error ? saveState : dismissState;
  const pending = savePending || dismissPending;
  const placeJson = JSON.stringify(place);

  if (!hasUsablePlaceName(place.name)) return null;

  const typeLabel = formatPlaceTypeLabel(place.primaryType);
  const mapsHref = googleMapsSearchUrl({
    name: place.name,
    location: place.location,
    fallbackCity,
  });

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      {mapsHref ? (
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group block space-y-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-lg text-foreground group-hover:underline">
              {place.name.trim()}
            </h3>
            {typeLabel ? (
              <span className="text-xs text-muted-foreground">{typeLabel}</span>
            ) : null}
            {saved ? <Badge variant="secondary">Saved</Badge> : null}
          </div>
        </a>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-lg text-foreground">
            {place.name.trim()}
          </h3>
          {typeLabel ? (
            <span className="text-xs text-muted-foreground">{typeLabel}</span>
          ) : null}
          {saved ? <Badge variant="secondary">Saved</Badge> : null}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {mapsHref ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            Open in Google Maps
          </Button>
        ) : null}
        {signedIn ? (
          <>
            <form action={saveAction}>
              <input type="hidden" name="place_json" value={placeJson} />
              <input type="hidden" name="kind" value={kind} />
              {billItemId ? (
                <input type="hidden" name="bill_item_id" value={billItemId} />
              ) : null}
              {billItemName ? (
                <input
                  type="hidden"
                  name="bill_item_name"
                  value={billItemName}
                />
              ) : null}
              <Button type="submit" size="sm" disabled={pending || saved}>
                {saved ? "Saved" : savePending ? "Saving…" : "Save"}
              </Button>
            </form>
            <form action={dismissAction}>
              <input type="hidden" name="place_json" value={placeJson} />
              <input type="hidden" name="kind" value={kind} />
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                disabled={pending}
              >
                {dismissPending ? "…" : "Dismiss"}
              </Button>
            </form>
          </>
        ) : null}
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm" role="status">
          {state.success}
        </p>
      ) : null}
    </li>
  );
}
