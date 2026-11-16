import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/register-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  const configured = isSupabaseConfigured();

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Create account</CardTitle>
        <CardDescription>
          Email and password registration. Your profile and default categories are
          created automatically after signup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm configured={configured} />
      </CardContent>
    </Card>
  );
}
