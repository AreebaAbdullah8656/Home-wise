import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { sampleSavingSuggestions } from "@/lib/sample-dashboard";

/** Small optional dashboard tips only — no link to unfinished Tips section. */
export function SavingSuggestions() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Saving suggestions</CardTitle>
        <CardDescription>
          Short optional tips on the dashboard. Full tip library comes later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {sampleSavingSuggestions.map((tip) => (
            <li
              key={tip}
              className="rounded-xl bg-accent/50 px-4 py-3 text-sm text-accent-foreground ring-1 ring-border/50"
            >
              {tip}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
