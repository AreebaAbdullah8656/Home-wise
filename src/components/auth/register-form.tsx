"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  resendConfirmationEmail,
  signUp,
  type AuthActionState,
} from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

type RegisterFormProps = {
  configured: boolean;
};

export function RegisterForm({ configured }: RegisterFormProps) {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const [resendState, resendAction, resendPending] = useActionState(
    resendConfirmationEmail,
    initialState
  );

  const emailForResend = state.email || resendState.email || "";

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display_name">Display name</Label>
          <Input
            id="display_name"
            name="display_name"
            autoComplete="name"
            placeholder="Your name"
            disabled={pending || Boolean(state.success)}
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
            disabled={pending || Boolean(state.success)}
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
            disabled={pending || Boolean(state.success)}
          />
        </div>

        {!configured ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Supabase is not connected yet. Create a{" "}
            <code className="font-mono">.env.local</code> <strong>file</strong>{" "}
            (not a folder) from <code className="font-mono">.env.example</code>,
            add your project URL and anon key, then restart the dev server.
            Fields stay editable so you can draft values; account creation needs
            env + migrations.
          </p>
        ) : null}

        {state.error ? (
          <p
            className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {state.error}{" "}
            {/already exists/i.test(state.error) ? (
              <Link href="/login" className="font-medium underline">
                Log in
              </Link>
            ) : null}
          </p>
        ) : null}

        {state.success ? (
          <p
            className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
            role="status"
          >
            {state.success}{" "}
            <Link href="/login" className="font-medium underline">
              Go to sign in
            </Link>
          </p>
        ) : null}

        {!state.success ? (
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account…" : "Create account"}
          </Button>
        ) : null}
      </form>

      {state.success && emailForResend ? (
        <form action={resendAction} className="space-y-2">
          <input type="hidden" name="email" value={emailForResend} />
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
            disabled={resendPending}
          >
            {resendPending
              ? "Sending…"
              : "Resend confirmation email"}
          </Button>
        </form>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
