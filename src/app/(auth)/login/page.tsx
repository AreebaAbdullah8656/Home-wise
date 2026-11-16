import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Sign in</CardTitle>
        <CardDescription>
          Email and password only. Full Supabase authentication connects in Phase 3.
          Google and magic link are not offered.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            disabled
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
            disabled
          />
        </div>
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          Form is a UI placeholder for Phase 2. Submitting is disabled until Phase 3.
        </p>
        <Button className="w-full" disabled>
          Sign in (coming in Phase 3)
        </Button>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Need an account?{" "}
        <Link href="/register" className="ml-1 font-medium text-primary hover:underline">
          Register
        </Link>
      </CardFooter>
    </Card>
  );
}
