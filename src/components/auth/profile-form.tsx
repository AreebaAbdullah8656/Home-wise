"use client";

import { useActionState } from "react";
import { updateProfile, type AuthActionState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/types/database";

const initialState: AuthActionState = {};

type ProfileFormProps = {
  profile: Profile;
  email: string;
};

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled readOnly />
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
        <Input
          id="currency"
          name="currency"
          defaultValue={profile.currency || "PKR"}
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">Default is PKR (SPEC §17).</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location (optional)</Label>
        <Input
          id="location"
          name="location"
          defaultValue={profile.location ?? ""}
          placeholder="City"
          disabled={pending}
        />
      </div>

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
