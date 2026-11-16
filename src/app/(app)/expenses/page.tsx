import { Suspense } from "react";
import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseList } from "@/components/expenses/expense-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/server";
import { getCategoriesForUser, getExpenses } from "@/lib/finance/queries";

export const metadata: Metadata = { title: "Expenses" };

type ExpensesPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    from?: string;
    to?: string;
  }>;
};

export const instant = false;

function Fallback() {
  return (
    <EmptyState
      icon={Receipt}
      title="Loading expenses…"
      description="Fetching your transaction history."
    />
  );
}

async function ExpensesContent({
  searchParams,
}: {
  searchParams: {
    q?: string;
    category?: string;
    from?: string;
    to?: string;
  };
}) {
  if (!isSupabaseConfigured()) {
    return (
      <EmptyState
        icon={Receipt}
        title="Connect Supabase"
        description="Add your Supabase keys to track expenses."
      />
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <EmptyState
        icon={Receipt}
        title="Sign in required"
        description="Sign in to add and manage expenses. Bill upload is never required."
      />
    );
  }

  const [categories, expenses] = await Promise.all([
    getCategoriesForUser(),
    getExpenses({ limit: 200 }),
  ]);

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Add expense</CardTitle>
          <CardDescription>
            Manual entry only for Phase 4. No receipt upload required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseForm categories={categories} />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Expense history</CardTitle>
          <CardDescription>
            Search, filter, edit, or delete. Duplicates with the same name, amount,
            date, and category are blocked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseList
            expenses={expenses}
            categories={categories}
            initialSearch={searchParams.q ?? ""}
            initialCategoryId={searchParams.category ?? ""}
            initialFrom={searchParams.from ?? ""}
            initialTo={searchParams.to ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Expenses"
        description="Track daily spending without forcing bill uploads."
      />
      <Suspense fallback={<Fallback />}>
        <ExpensesContent searchParams={params} />
      </Suspense>
    </div>
  );
}
