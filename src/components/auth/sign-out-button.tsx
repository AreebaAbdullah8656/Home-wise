"use client";

import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" className={className}>
        Sign out
      </Button>
    </form>
  );
}
