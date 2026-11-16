import { Suspense } from "react";
import type { Metadata } from "next";
import { ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GroceryForm } from "@/components/grocery/grocery-form";
import { GroceryList } from "@/components/grocery/grocery-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/server";
import {
  computeGroceryTotals,
  getGroceryItems,
} from "@/lib/finance/grocery";

export const metadata: Metadata = { title: "Grocery List" };
export const instant = false;

function Fallback() {
  return (
    <EmptyState
      icon={ShoppingCart}
      title="Loading grocery list…"
      description="Fetching your items."
    />
  );
}

async function GroceryContent() {
  if (!isSupabaseConfigured()) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Connect Supabase"
        description="Add your Supabase keys to manage the grocery list."
      />
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Sign in required"
        description="Sign in to plan groceries and mark purchases."
      />
    );
  }

  const items = await getGroceryItems();
  const totals = computeGroceryTotals(items);

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Add grocery item</CardTitle>
          <CardDescription>
            Set priority and estimated price. Mark purchased later to record one
            expense without duplicates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GroceryForm />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Your list</CardTitle>
          <CardDescription>
            Pending and purchased items with estimated and actual totals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GroceryList items={items} totals={totals} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function GroceryPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Grocery List"
        description="Plan items, priorities, and totals — mark purchased without duplicate expenses."
      />
      <Suspense fallback={<Fallback />}>
        <GroceryContent />
      </Suspense>
    </div>
  );
}
