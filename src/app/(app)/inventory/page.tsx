import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Home, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { InventoryList } from "@/components/inventory/inventory-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/server";
import {
  getInventoryItems,
  lowStockItems,
} from "@/lib/finance/inventory";

export const metadata: Metadata = { title: "Home Inventory" };
export const instant = false;

function Fallback() {
  return (
    <EmptyState
      icon={Home}
      title="Loading inventory…"
      description="Fetching household stock."
    />
  );
}

async function InventoryContent() {
  if (!isSupabaseConfigured()) {
    return (
      <EmptyState
        icon={Home}
        title="Connect Supabase"
        description="Add your Supabase keys to manage inventory."
      />
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <EmptyState
        icon={Home}
        title="Sign in required"
        description="Sign in to track household inventory."
      />
    );
  }

  const items = await getInventoryItems();
  const low = lowStockItems(items);

  return (
    <div className="space-y-6">
      {low.length > 0 ? (
        <Card className="border-amber-500/40 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2 text-xl">
              <AlertTriangle className="size-5 text-amber-600" aria-hidden />
              Low-stock reminders
            </CardTitle>
            <CardDescription>
              {low.length} item{low.length === 1 ? "" : "s"} marked low or out.
              Add them to your grocery list without creating duplicates.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <ul className="flex flex-wrap gap-2 text-sm">
              {low.slice(0, 8).map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-foreground ring-1 ring-amber-500/30"
                >
                  {item.name} ({item.stock_status})
                </li>
              ))}
              {low.length > 8 ? (
                <li className="text-muted-foreground">+{low.length - 8} more</li>
              ) : null}
            </ul>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/grocery" />}
            >
              Open grocery list
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Add inventory item</CardTitle>
          <CardDescription>
            Kitchen, cleaning, bathroom, and other household stock.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryForm />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Your inventory</CardTitle>
          <CardDescription>
            Filter by category or low stock. Add to grocery once per pending
            name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryList items={items} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Home Inventory"
        description="Track stock, get low-stock reminders, and restock via grocery."
      />
      <Suspense fallback={<Fallback />}>
        <InventoryContent />
      </Suspense>
    </div>
  );
}
