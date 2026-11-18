"use client";

import { useActionState } from "react";
import {
  dismissRecommendation,
  saveRecommendation,
  type ActionState,
} from "@/app/recommendations/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LivePlace } from "@/lib/places/types";

const initial: ActionState = {};

type PlaceCardProps = {
  place: LivePlace;
  signedIn: boolean;
  saved?: boolean;
  kind?: "live_place" | "bill_place_match";
  billItemId?: string;
  billItemName?: string;
};

export function PlaceCard({
  place,
  signedIn,
  saved = false,
  kind = "live_place",
  billItemId,
  billItemName,
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

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Live · {place.source}</Badge>
        {place.primaryType ? (
          <Badge variant="outline">{place.primaryType.replace(/_/g, " ")}</Badge>
        ) : null}
        {saved ? <Badge variant="secondary">Saved</Badge> : null}
      </div>

      <div className="space-y-1">
        <h3 className="font-heading text-lg text-foreground">{place.name}</h3>
        {place.address ? (
          <p className="text-sm text-muted-foreground">{place.address}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Address unavailable</p>
        )}
      </div>

      {billItemName ? (
        <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          Matched from your bill item:{" "}
          <span className="text-foreground">{billItemName}</span>
        </p>
      ) : null}

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Rating</dt>
          <dd className="text-foreground">
            {place.rating != null
              ? `${place.rating.toFixed(1)}${
                  place.userRatingCount != null
                    ? ` (${place.userRatingCount})`
                    : ""
                }`
              : "Not available"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Delivery</dt>
          <dd className="text-foreground">{place.delivery.label}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Delivery detail</dt>
          <dd className="text-foreground">{place.delivery.detail}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Product price</dt>
          <dd className="text-foreground">
            Not available from {place.source} (not invented)
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Source</dt>
          <dd className="text-foreground">
            {place.source}
            {place.attributions.length
              ? ` · ${place.attributions.join(", ")}`
              : ""}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Last verified</dt>
          <dd className="text-foreground">
            {new Date(place.lastVerifiedAt).toLocaleString()}
          </dd>
        </div>
      </dl>

      <p className="text-xs text-muted-foreground">
        External links only — HomeWise has no cart, checkout, or payments. Free
        home delivery is shown only when explicitly confirmed (Places does not
        confirm free delivery).
      </p>

      <div className="flex flex-wrap gap-2">
        {place.mapsUrl ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <a
                href={place.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            {place.source === "OpenStreetMap"
              ? "OpenStreetMap"
              : "Maps / directions"}
          </Button>
        ) : null}
        {place.websiteUrl ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <a
                href={place.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            Store website
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
        ) : (
          <p className="text-xs text-muted-foreground">
            Sign in to save or dismiss.
          </p>
        )}
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
