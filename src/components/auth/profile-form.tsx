"use client";

import { useActionState } from "react";
import { updateProfile, type AuthActionState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/types/database";

const initialState: AuthActionState = {};

const CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED", "SAR", "INR"] as const;

type ProfileFormProps = {
  profile: Profile;
  email: string;
};

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const currentCurrency = (profile.currency || "PKR").toUpperCase();
  const currencyOptions = CURRENCIES.includes(
    currentCurrency as (typeof CURRENCIES)[number]
  )
    ? CURRENCIES
    : ([currentCurrency, ...CURRENCIES] as string[]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled readOnly />
        <p className="text-xs text-muted-foreground">
          Email/password account only — no Google or magic link in v1.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={profile.display_name ?? ""}
          autoComplete="name"
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <select
          id="currency"
          name="currency"
          defaultValue={currentCurrency || "PKR"}
          disabled={pending}
          className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {currencyOptions.map((code) => (
            <option key={code} value={code}>
              {code}
              {code === "PKR" ? " (default)" : ""}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Defaults to PKR. Change anytime — amounts stay numeric in the database.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location (optional)</Label>
        <Input
          id="location"
          name="location"
          defaultValue={profile.location ?? ""}
          placeholder="e.g. Wapda Town, Gujranwala"
          disabled={pending}
        />
        <input
          type="hidden"
          name="location_lat"
          defaultValue={
            profile.location_lat != null ? String(profile.location_lat) : ""
          }
        />
        <input
          type="hidden"
          name="location_lng"
          defaultValue={
            profile.location_lng != null ? String(profile.location_lng) : ""
          }
        />
        <p className="text-xs text-muted-foreground">
          Optional Pakistan city/area. Confirm exact coords from Smart
          Recommendations area picker to search nearby shops.
          {profile.location_lat != null && profile.location_lng != null
            ? ` Saved point: ${profile.location_lat.toFixed(5)}, ${profile.location_lng.toFixed(5)}.`
            : ""}
        </p>
      </div>

      {state.error ? (
        <p
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
          role="status"
        >
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
