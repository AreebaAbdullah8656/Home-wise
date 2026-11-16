"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthActionState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

type RegisterFormProps = {
  configured: boolean;
};

export function RegisterForm({ configured }: RegisterFormProps) {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          name="display_name"
          autoComplete="name"
          placeholder="Your name"
          disabled={!configured || pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          disabled={!configured || pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          required
          disabled={!configured || pending}
        />
      </div>

      {!configured ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          Supabase env vars are missing. Copy{" "}
          <code className="font-mono">.env.example</code> to{" "}
          <code className="font-mono">.env.local</code>, add your project URL and
          anon key, then restart the dev server.
        </p>
      ) : null}

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground" role="status">
          {state.success}{" "}
          <Link href="/login" className="font-medium underline">
            Go to sign in
          </Link>
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={!configured || pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
