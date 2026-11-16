import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Sign in" };

// Uses searchParams for post-login redirect — allow blocking route.
export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") ? params.next : "/dashboard";
  const configured = isSupabaseConfigured();

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Sign in</CardTitle>
        <CardDescription>
          Email and password only. Google and magic link are not offered.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm configured={configured} nextPath={nextPath} />
      </CardContent>
    </Card>
  );
}
