import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sampleSavingSuggestions } from "@/lib/sample-dashboard";

export function SavingSuggestions() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Saving suggestions</CardTitle>
        <CardDescription>
          Short tips only — open Smart Saving Tips for the full library.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
