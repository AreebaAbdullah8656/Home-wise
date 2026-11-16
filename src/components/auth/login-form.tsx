"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthActionState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

type LoginFormProps = {
  configured: boolean;
  nextPath?: string;
};

export function LoginForm({ configured, nextPath = "/dashboard" }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
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
          autoComplete="current-password"
          placeholder="••••••••"
          required
          disabled={!configured || pending}
        />
      </div>

      {!configured ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          Supabase env vars are missing. Copy{" "}
          <code className="font-mono">.env.example</code> to{" "}
          <code className="font-mono">.env.local</code>, add your project URL and
          anon key, then restart <code className="font-mono">npm run dev</code>.
        </p>
      ) : null}

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={!configured || pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Need an account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
