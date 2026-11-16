import Link from "next/link";
import { Receipt } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export function RecentTransactions() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Recent transactions</CardTitle>
        <CardDescription>
          Latest expenses with name, category, amount, date, and payment method.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description="When you add expenses (manually or after confirming a scanned bill), they will show up here. Nothing is invented for you."
        >
          <Button nativeButton={false} render={<Link href="/expenses" />}>
            Go to Expenses
          </Button>
        </EmptyState>
      </CardContent>
    </Card>
  );
}
