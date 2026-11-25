"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
  resendConfirmationEmail,
  signIn,
  type AuthActionState,
} from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

type LoginFormProps = {
  configured: boolean;
  nextPath?: string;
  initialEmail?: string;
  initialError?: string;
  forceNeedsConfirmation?: boolean;
};

function loginBannerMessage(code: string | undefined): string | null {
  switch (code) {
    case "email_unconfirmed":
      return "Confirm your email before using HomeWise. Check your inbox or resend the confirmation email below.";
    case "confirm_failed":
      return "That confirmation link is invalid or expired. Request a new confirmation email below.";
    case "missing_code":
      return "Missing confirmation code. Open the link from your email, or resend it below.";
    case "config":
      return "Supabase is not configured. Add env vars from .env.example, then restart the dev server.";
    default:
      return null;
  }
}

export function LoginForm({
  configured,
  nextPath = "/dashboard",
  initialEmail = "",
  initialError,
  forceNeedsConfirmation = false,
}: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [resendState, resendAction, resendPending] = useActionState(
    resendConfirmationEmail,
    initialState
  );
  const [email, setEmail] = useState(initialEmail);
  const [needsConfirmation, setNeedsConfirmation] = useState(
    forceNeedsConfirmation
  );

  useEffect(() => {
    if (state.needsConfirmation) {
      setNeedsConfirmation(true);
      if (state.email) setEmail(state.email);
    }
  }, [state.needsConfirmation, state.email]);

  useEffect(() => {
    if (resendState.needsConfirmation) {
      setNeedsConfirmation(true);
      if (resendState.email) setEmail(resendState.email);
    }
  }, [resendState.needsConfirmation, resendState.email]);

  const banner = loginBannerMessage(initialError);
  const showResend = needsConfirmation || forceNeedsConfirmation;

  return (
    <div className="space-y-4">
      {banner ? (
        <p
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {banner}
        </p>
      ) : null}

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
            disabled={pending}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            disabled={pending}
          />
        </div>

        {!configured ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Supabase is not connected yet. Create a{" "}
            <code className="font-mono">.env.local</code> <strong>file</strong>{" "}
            (not a folder) from <code className="font-mono">.env.example</code>,
            add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,
            then restart <code className="font-mono">npm run dev</code>. You can
            still type here; sign-in will work after env is set.
          </p>
        ) : null}

        {state.error ? (
          <p
            className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {showResend ? (
        <form action={resendAction} className="space-y-2">
          <input type="hidden" name="email" value={email} />
          {resendState.error ? (
            <p
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {resendState.error}
            </p>
          ) : null}
          {resendState.success ? (
            <p
              className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
              role="status"
            >
              {resendState.success}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={resendPending || !email}
          >
            {resendPending
              ? "Sending…"
              : "Resend confirmation email"}
          </Button>
        </form>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        Need an account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
