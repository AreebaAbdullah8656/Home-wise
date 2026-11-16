import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SampleBadge } from "@/components/shared/sample-badge";
import { formatPkr } from "@/lib/format";
import { sampleWeeklySnapshot } from "@/lib/sample-dashboard";

export function WeeklySnapshot() {
  const data = sampleWeeklySnapshot;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="font-heading text-xl">Weekly spending snapshot</CardTitle>
          <CardDescription>
            Compact summary only. Reports never open automatically.
          </CardDescription>
        </div>
        <SampleBadge />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-muted/50 px-4 py-4 ring-1 ring-border/60">
          <p className="text-xs text-muted-foreground">{data.weekLabel}</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-sage-deep">
            {formatPkr(data.totalPkr)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{data.note}</p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/reports" />}
        >
          Open Reports when you are ready
        </Button>
      </CardContent>
    </Card>
  );
}
