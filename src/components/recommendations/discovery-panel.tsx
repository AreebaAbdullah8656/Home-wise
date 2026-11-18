"use client";

import { useCallback, useEffect, useMemo, useState, useActionState } from "react";
import {
  removeSavedRecommendation,
  type ActionState,
} from "@/app/recommendations/actions";
import { PlaceCard } from "@/components/recommendations/place-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LivePlace, LivePlacesResponse } from "@/lib/places/types";
import type {
  BillPlaceMatch,
  PlaceRecommendationPayload,
  SavedRecommendationRow,
} from "@/lib/recommendations/queries";
import { partitionLivePlaces } from "@/lib/places/partition";

const initial: ActionState = {};

type SectionId =
  | "nearby"
  | "best"
  | "free"
  | "online"
  | "price"
  | "from-bills"
  | "saved";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "nearby", label: "Nearby Stores" },
  { id: "best", label: "Best Local Options" },
  { id: "free", label: "Free Home Delivery" },
  { id: "online", label: "Verified Online Stores" },
  { id: "price", label: "Lowest Available Price" },
  { id: "from-bills", label: "From your bills" },
  { id: "saved", label: "Saved" },
];

type LiveApiOk = {
  ok: true;
  places: LivePlace[];
  lastVerifiedAt: string;
  cached: boolean;
  cacheExpiresAt: string | null;
  locationSource: "device" | "profile" | "query";
  locationLabel: string | null;
  provider?: "osm" | "google";
  sections: {
    nearbyStores: LivePlace[];
    bestLocalOptions: LivePlace[];
    freeHomeDelivery: LivePlace[];
    verifiedOnlineStores: LivePlace[];
    lowestAvailablePrice: LivePlace[];
  };
};

type LiveApiErr = {
  ok: false;
  code?: string;
  message: string;
  httpStatus?: number;
  lastVerifiedAt?: string;
  provider?: "osm" | "google";
};

type DiscoveryPanelProps = {
  provider: "osm" | "google";
  providerLabel: string;
  providerHint?: string;
  signedIn: boolean;
  profileLocation: string | null;
  initialLive: LivePlacesResponse;
  saved: SavedRecommendationRow[];
  savedKeys: string[];
  dismissedKeys: string[];
  billMatches: BillPlaceMatch[];
};

export function DiscoveryPanel({
  provider,
  providerLabel,
  providerHint,
  signedIn,
  profileLocation,
  initialLive,
  saved,
  savedKeys,
  dismissedKeys,
  billMatches,
}: DiscoveryPanelProps) {
  const [section, setSection] = useState<SectionId>("nearby");
  const [query, setQuery] = useState("");
  const [live, setLive] = useState<LiveApiOk | LiveApiErr | null>(
    initialLive.ok
      ? {
          ok: true,
          places: initialLive.places,
          lastVerifiedAt: initialLive.lastVerifiedAt,
          cached: initialLive.cached,
          cacheExpiresAt: initialLive.cacheExpiresAt,
          locationSource: initialLive.locationSource,
          locationLabel: initialLive.locationLabel,
          provider: initialLive.provider,
          sections: (() => {
            const p = partitionLivePlaces(initialLive.places);
            return {
              nearbyStores: p.nearby,
              bestLocalOptions: p.bestLocal,
              freeHomeDelivery: p.freeDelivery,
              verifiedOnlineStores: p.verifiedOnline,
              lowestAvailablePrice: p.lowestVerifiedPrice,
            };
          })(),
        }
      : initialLive
  );
  const [loading, setLoading] = useState(false);
  const [geoNote, setGeoNote] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeSavedRecommendation,
    initial
  );

  const savedSet = useMemo(() => new Set(savedKeys), [savedKeys]);
  const dismissedSet = useMemo(() => new Set(dismissedKeys), [dismissedKeys]);

  const filterDismissed = useCallback(
    (list: LivePlace[]) => list.filter((p) => !dismissedSet.has(`place:${p.placeId}`)),
    [dismissedSet]
  );

  const loadLive = useCallback(
    async (opts: {
      lat?: number;
      lng?: number;
      q?: string;
      refresh?: boolean;
    }) => {
      setLoading(true);
      setGeoNote(null);
      try {
        const params = new URLSearchParams();
        if (opts.lat != null && opts.lng != null) {
          params.set("lat", String(opts.lat));
          params.set("lng", String(opts.lng));
        }
        if (opts.q?.trim()) params.set("q", opts.q.trim());
        if (opts.refresh) params.set("refresh", "1");
        const res = await fetch(`/api/recommendations/live?${params}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as LiveApiOk | LiveApiErr;
        setLive(data);
      } catch (error) {
        setLive({
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Failed to refresh live recommendations.",
          lastVerifiedAt: new Date().toISOString(),
          provider,
        });
      } finally {
        setLoading(false);
      }
    },
    [provider]
  );

  // Auto-refresh on mount/revisit; prefer device location when allowed.
  useEffect(() => {
    let cancelled = false;
    if (!navigator.geolocation) {
      setGeoNote(
        profileLocation
          ? "Device geolocation unavailable — using Settings location."
          : "Device geolocation unavailable and no Settings location set."
      );
      void loadLive({ refresh: true });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCoords(next);
        setGeoNote("Using live device location.");
        void loadLive({ ...next, refresh: true });
      },
      () => {
        if (cancelled) return;
        setGeoNote(
          profileLocation
            ? "Location permission declined — using Settings location."
            : "Location permission declined and no Settings location set."
        );
        void loadLive({ refresh: true });
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
    );
    return () => {
      cancelled = true;
    };
  }, [profileLocation, loadLive]);

  const sections = live && live.ok ? live.sections : null;
  const activeProviderLabel =
    live && "provider" in live && live.provider
      ? live.provider === "google"
        ? "Google Places"
        : "OpenStreetMap"
      : providerLabel;
  const listForSection = useMemo(() => {
    if (!sections) return [] as LivePlace[];
    switch (section) {
      case "nearby":
        return filterDismissed(sections.nearbyStores);
      case "best":
        return filterDismissed(sections.bestLocalOptions);
      case "free":
        return filterDismissed(sections.freeHomeDelivery);
      case "online":
        return filterDismissed(sections.verifiedOnlineStores);
      case "price":
        return filterDismissed(sections.lowestAvailablePrice);
      default:
        return [];
    }
  }, [section, sections, filterDismissed]);

  const filteredBillMatches = useMemo(
    () =>
      billMatches.map((m) => ({
        ...m,
        places: m.places.filter(
          (p) => !dismissedSet.has(`place:${p.placeId}`)
        ),
      })),
    [billMatches, dismissedSet]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-accent/40 px-4 py-3 text-sm text-accent-foreground">
        <p className="font-medium">Live data · {activeProviderLabel}</p>
        <p className="mt-1">
          External redirect assistant — no cart, checkout, or payments. Shop
          name, type, address, and map links only. Prices and free delivery are
          never invented.
        </p>
        {providerHint ? (
          <p className="mt-1 text-xs text-muted-foreground">{providerHint}</p>
        ) : null}
        <p className="mt-2 text-xs">
          {geoNote || "Resolving location…"}
          {profileLocation ? ` · Settings location: ${profileLocation}` : ""}
          {live && live.ok
            ? ` · Last verified ${new Date(live.lastVerifiedAt).toLocaleString()}${
                live.cached ? " (short cache)" : ""
              }`
            : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={loading}
          onClick={() =>
            void loadLive({
              ...(coords ?? {}),
              refresh: true,
              q: query || undefined,
            })
          }
        >
          {loading ? "Refreshing…" : "Refresh now"}
        </Button>
        {coords ? (
          <span className="self-center text-xs text-muted-foreground">
            Device coords locked for this session
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-1">
          <Label htmlFor="live_search">Search live places near you</Label>
          <Input
            id="live_search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pharmacy, supermarket, detergent store…"
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            disabled={loading || !query.trim()}
            onClick={() =>
              void loadLive({
                ...(coords ?? {}),
                q: query,
                refresh: true,
              })
            }
          >
            Search
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <Button
            key={s.id}
            type="button"
            size="sm"
            variant={section === s.id ? "default" : "outline"}
            onClick={() => setSection(s.id)}
          >
            {s.label}
            {s.id === "saved" ? ` (${saved.length})` : ""}
            {s.id === "from-bills"
              ? ` (${filteredBillMatches.reduce((n, m) => n + m.places.length, 0)})`
              : ""}
          </Button>
        ))}
      </div>

      {live && !live.ok ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">No live results</p>
          {live.httpStatus != null ? (
            <p className="mt-2 font-mono text-xs text-foreground">
              HTTP {live.httpStatus}
              {live.code ? ` · ${live.code}` : ""}
            </p>
          ) : live.code ? (
            <p className="mt-2 font-mono text-xs text-foreground">{live.code}</p>
          ) : null}
          <p className="mt-2">{live.message}</p>
          <p className="mt-2">
            Tip: allow device location to skip geocoding, or set a clearer city
            in Settings. Sample data is never shown as a fallback.
          </p>
        </div>
      ) : null}

      {section === "from-bills" ? (
        <div className="space-y-4">
          <h2 className="font-heading text-xl">From your bills</h2>
          <p className="text-sm text-muted-foreground">
            Live text search ({activeProviderLabel}) for confirmed bill item
            names near your location. No invented product prices.
          </p>
          {filteredBillMatches.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No live bill matches yet. Confirm bills with item names and set a
              location (device or Settings).
            </p>
          ) : (
            filteredBillMatches.map((match) => (
              <div key={match.billItemId} className="space-y-2">
                <h3 className="font-medium text-foreground">
                  {match.billItemName}
                </h3>
                {match.error ? (
                  <p className="text-sm text-destructive">{match.error}</p>
                ) : null}
                {match.places.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No live places found for this item.
                  </p>
                ) : (
                  <ul className="grid gap-3 lg:grid-cols-2">
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
                )}
              </div>
            ))
          )}
        </div>
      ) : null}

      {section === "saved" ? (
        <div className="space-y-3">
          <h2 className="font-heading text-xl">Saved</h2>
          {removeState.error ? (
            <p className="text-sm text-destructive" role="alert">
              {removeState.error}
            </p>
          ) : null}
          {saved.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Nothing saved yet.
            </p>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {saved.map((row) => {
                const payload = row.payload as PlaceRecommendationPayload | null;
                const place =
                  payload &&
                  typeof payload === "object" &&
                  payload.place &&
                  (payload.place.source === "Google Places" ||
                    payload.place.source === "OpenStreetMap")
                    ? payload.place
                    : null;
                if (!place) {
                  return (
                    <li
                      key={row.id}
                      className="rounded-xl border border-border p-4 text-sm"
                    >
                      <p className="font-medium">{row.title}</p>
                      <p className="text-muted-foreground">
                        Saved entry is not a live OSM/Places record (removed
                        sample payloads are not re-displayed as stores).
                      </p>
                      <form action={removeAction} className="mt-2">
                        <input type="hidden" name="id" value={row.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          disabled={removePending}
                        >
                          Remove
                        </Button>
                      </form>
                    </li>
                  );
                }
                return (
                  <li key={row.id} className="space-y-2">
                    <PlaceCard place={place} signedIn={signedIn} saved />
                    <form action={removeAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        disabled={removePending}
                      >
                        Remove from saved
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {section !== "from-bills" && section !== "saved" && live?.ok ? (
        <div className="space-y-3">
          <h2 className="font-heading text-xl">
            {SECTIONS.find((s) => s.id === section)?.label}
          </h2>
          {section === "free" ? (
            <p className="text-sm text-muted-foreground">
              Free home delivery is listed only when explicitly confirmed.
              {activeProviderLabel} does not confirm free delivery — OSM shows
              “Delivery information unavailable”; Google may note delivery
              exists without verifying it is free.
            </p>
          ) : null}
          {section === "price" ? (
            <p className="text-sm text-muted-foreground">
              {activeProviderLabel} does not provide verified product unit
              prices. HomeWise will not invent prices. This section stays empty
              until a verified price source is connected.
            </p>
          ) : null}
          {section === "best" && provider === "osm" ? (
            <p className="text-sm text-muted-foreground">
              OpenStreetMap shop data has no star ratings — Best Local Options
              stays empty unless a rated Google Places result is used.
            </p>
          ) : null}
          {listForSection.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              {section === "free"
                ? "No free home delivery offers could be verified. Delivery information unavailable for free-delivery claims."
                : section === "price"
                  ? "No verified product prices available."
                  : section === "online"
                    ? `No nearby places with a website tag from ${activeProviderLabel}.`
                    : section === "best"
                      ? "No rated local places in the live result set."
                      : "No nearby stores found for this location."}
            </p>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {listForSection.map((place) => (
                <PlaceCard
                  key={place.placeId}
                  place={place}
                  signedIn={signedIn}
                  saved={savedSet.has(`place:${place.placeId}`)}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
