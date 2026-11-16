import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SampleBadge } from "@/components/shared/sample-badge";
import { formatPkr } from "@/lib/format";
import { sampleCategories } from "@/lib/sample-dashboard";

export function BudgetProgress() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="font-heading text-xl">Budget progress</CardTitle>
          <CardDescription>Category-wise limits with empty spend so far.</CardDescription>
        </div>
        <SampleBadge />
      </CardHeader>
      <CardContent className="space-y-5">
        {sampleCategories.map((category) => {
          const percent =
            category.limitPkr === 0
              ? 0
              : Math.round((category.spentPkr / category.limitPkr) * 100);
          return (
            <div key={category.name}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{category.name}</span>
                <span className="text-muted-foreground">
                  {formatPkr(category.spentPkr)} / {formatPkr(category.limitPkr)}
                </span>
              </div>
              <Progress value={percent} aria-label={`${category.name} progress`} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
