import { Suspense } from "react";
import type { Metadata } from "next";
import { PiggyBank } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SavingsOverviewCards } from "@/components/savings/savings-overview";
import { FundForm } from "@/components/savings/fund-form";
import { FundList } from "@/components/savings/fund-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/server";
import { getSavingsPageData } from "@/lib/finance/savings";
import {
  createEmergencyFund,
  createSavingsGoal,
  deleteEmergencyFund,
  deleteSavingsGoal,
  updateEmergencyFund,
  updateSavingsGoal,
} from "@/app/savings/actions";

export const metadata: Metadata = { title: "Savings & Emergency" };
export const instant = false;

function Fallback() {
  return (
    <EmptyState
      icon={PiggyBank}
      title="Loading savings…"
      description="Fetching goals and emergency funds."
    />
  );
}

async function SavingsContent() {
  if (!isSupabaseConfigured()) {
    return (
      <EmptyState
        icon={PiggyBank}
        title="Connect Supabase"
        description="Add your Supabase keys to manage savings."
      />
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <EmptyState
        icon={PiggyBank}
        title="Sign in required"
        description="Sign in to track allocated vs actual savings."
      />
    );
  }

  const { goals, funds, overview } = await getSavingsPageData();

  return (
    <div className="space-y-6">
      <SavingsOverviewCards overview={overview} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Add savings goal</CardTitle>
            <CardDescription>
              Track allocated vs actual. Never counted as an expense.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FundForm
              kind="savings"
              createAction={createSavingsGoal}
              updateAction={updateSavingsGoal}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              Add emergency fund
            </CardTitle>
            <CardDescription>
              Separate from monthly spending and from savings goals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FundForm
              kind="emergency"
              createAction={createEmergencyFund}
              updateAction={updateEmergencyFund}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Savings goals</CardTitle>
          <CardDescription>Edit or delete goals anytime.</CardDescription>
        </CardHeader>
        <CardContent>
          <FundList
            kind="savings"
            items={goals}
            createAction={createSavingsGoal}
            updateAction={updateSavingsGoal}
            deleteAction={deleteSavingsGoal}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Emergency funds</CardTitle>
          <CardDescription>
            Keep emergency actuals distinct from expenses and grocery spend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FundList
            kind="emergency"
            items={funds}
            createAction={createEmergencyFund}
            updateAction={updateEmergencyFund}
            deleteAction={deleteEmergencyFund}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SavingsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Savings & Emergency"
        description="Allocated vs actual — never double-counted as expenses."
      />
      <Suspense fallback={<Fallback />}>
        <SavingsContent />
      </Suspense>
    </div>
  );
}
