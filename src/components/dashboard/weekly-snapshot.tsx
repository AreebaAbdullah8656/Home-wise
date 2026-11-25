"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMoney } from "@/lib/currency/provider";

type WeeklySnapshotProps = {
  weekTotal: number;
};

export function WeeklySnapshot({ weekTotal }: WeeklySnapshotProps) {
  const { format } = useMoney();
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Weekly spending snapshot</CardTitle>
        <CardDescription>
          Compact summary only. Reports never open automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-muted/50 px-4 py-4 ring-1 ring-border/60">
          <p className="text-xs text-muted-foreground">This week (Mon–today)</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-sage-deep">
            {format(weekTotal)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Detailed charts stay on Reports — open them only when you want.
          </p>
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
