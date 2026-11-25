"use client";

import { useActionState } from "react";
import { updateProfile, type AuthActionState } from "@/app/auth/actions";
import {
  permanentlyConvertCurrency,
  reversePermanentConvert,
  type CurrencyActionState,
} from "@/app/currency/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMoney } from "@/lib/currency/provider";
import { SUPPORTED_CURRENCIES } from "@/lib/currency/types";
import { formatRelativeTime } from "@/lib/format";
import type { Profile } from "@/types/database";

const initialState: AuthActionState = {};
const initialCurrencyState: CurrencyActionState = {};

type ProfileFormProps = {
  profile: Profile;
  email: string;
  hasReversibleConvert?: boolean;
};

export function ProfileForm({
  profile,
  email,
  hasReversibleConvert = false,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const [convertState, convertAction, converting] = useActionState(
    permanentlyConvertCurrency,
    initialCurrencyState
  );
  const [reverseState, reverseAction, reversing] = useActionState(
    reversePermanentConvert,
    initialCurrencyState
  );
  const money = useMoney();
  const currentCurrency = (profile.currency || "PKR").toUpperCase();
  const amountCurrency = (
    profile.amount_currency ||
    currentCurrency
  ).toUpperCase();
  const currencyOptions = SUPPORTED_CURRENCIES.includes(
    currentCurrency as (typeof SUPPORTED_CURRENCIES)[number]
  )
    ? SUPPORTED_CURRENCIES
    : ([currentCurrency, ...SUPPORTED_CURRENCIES] as string[]);

  const usdToPkr = money.usdToPkr;
  const rateUpdated = money.quote?.fetchedAt;

  return (
    <div className="space-y-8">
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
          <Label htmlFor="currency">Display currency</Label>
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
            Changing display currency converts{" "}
            <strong>all money on screen</strong> at the live rate. Stored
            originals stay in {amountCurrency} until you permanently convert.
          </p>
          {usdToPkr != null ? (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              Rate: 1 USD = {usdToPkr.toLocaleString("en", { maximumFractionDigits: 4 })}{" "}
              PKR, updated {formatRelativeTime(rateUpdated)}
              {money.quote?.stale ? " (cached — live fetch failed)" : ""}.
            </p>
          ) : (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              Rate: unavailable until a live or cached quote is loaded. HomeWise
              never invents a rate.
            </p>
          )}
          {amountCurrency !== currentCurrency ? (
            <p className="text-xs text-muted-foreground">
              Showing {currentCurrency} (stored as {amountCurrency}). Display
              factor: 1 {amountCurrency} = {money.rateToDisplay.toFixed(6)}{" "}
              {currentCurrency}.
            </p>
          ) : null}
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
            Optional Pakistan city/area. Setting your area in Smart
            Recommendations saves coordinates here automatically.
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

      <div className="space-y-3 border-t border-border pt-6">
        <h3 className="font-heading text-base font-semibold">
          Permanent convert (optional)
        </h3>
        <p className="text-xs text-muted-foreground">
          Rewrites every stored money field into your active display currency and
          keeps a snapshot so reverse restores exact originals (PKR→USD→PKR does
          not compound rounding when you reverse). Prefer display-only changes
          for everyday use.
        </p>

        {amountCurrency !== currentCurrency ? (
          <form action={convertAction} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="confirm">
                Type CONVERT to rewrite {amountCurrency} → {currentCurrency}
              </Label>
              <Input
                id="confirm"
                name="confirm"
                placeholder="CONVERT"
                autoComplete="off"
                disabled={converting}
              />
            </div>
            {convertState.error ? (
              <p
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {convertState.error}
              </p>
            ) : null}
            {convertState.success ? (
              <p
                className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
                role="status"
              >
                {convertState.success}
              </p>
            ) : null}
            <Button type="submit" variant="destructive" disabled={converting}>
              {converting ? "Converting…" : "Permanently convert stored amounts"}
            </Button>
          </form>
        ) : (
          <p className="text-xs text-muted-foreground">
            Stored amounts already match display currency ({amountCurrency}).
            Change display currency first if you want a permanent rewrite.
          </p>
        )}

        {hasReversibleConvert || reverseState.success ? (
          <form action={reverseAction} className="space-y-2">
            {reverseState.error ? (
              <p
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {reverseState.error}
              </p>
            ) : null}
            {reverseState.success ? (
              <p
                className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
                role="status"
              >
                {reverseState.success}
              </p>
            ) : null}
            <Button type="submit" variant="outline" disabled={reversing}>
              {reversing ? "Reversing…" : "Reverse last permanent convert"}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
