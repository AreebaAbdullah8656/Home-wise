import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SAVING_TIPS } from "@/lib/tips/catalog";

const DASHBOARD_TIPS = SAVING_TIPS.slice(0, 3);

/** Small optional dashboard tips — full library lives on Smart Saving Tips. */
export function SavingSuggestions() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Saving suggestions</CardTitle>
        <CardDescription>
          Short optional tips. Open the full library anytime — nothing auto-opens.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {DASHBOARD_TIPS.map((tip) => (
            <li
              key={tip.key}
              className="rounded-xl bg-accent/50 px-4 py-3 text-sm text-accent-foreground ring-1 ring-border/50"
            >
              <p className="font-medium text-foreground">{tip.title}</p>
              <p className="mt-1 text-muted-foreground">{tip.body}</p>
            </li>
          ))}
        </ul>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/tips" />}
        >
          Browse all tips
        </Button>
      </CardContent>
    </Card>
  );
}
