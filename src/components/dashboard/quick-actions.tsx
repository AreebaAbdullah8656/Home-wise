import Link from "next/link";
import {
  PlusCircle,
  Wallet,
  ScanLine,
  FileStack,
  ShoppingCart,
  PiggyBank,
  Home,
  Lightbulb,
  Sparkles,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const actions = [
  { href: "/expenses", label: "Add expense", icon: PlusCircle },
  { href: "/budget", label: "Set monthly budget", icon: Wallet },
  { href: "/scan-bill", label: "Scan a bill", icon: ScanLine },
  { href: "/bills", label: "My bills", icon: FileStack },
  { href: "/savings", label: "Savings & emergency", icon: PiggyBank },
  { href: "/grocery", label: "Add grocery item", icon: ShoppingCart },
  { href: "/inventory", label: "Home inventory", icon: Home },
  { href: "/tips", label: "Saving tips", icon: Lightbulb },
  { href: "/recommendations", label: "Recommendations", icon: Sparkles },
  { href: "/reports", label: "Open reports", icon: BarChart3 },
] as const;

export function QuickActions() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Quick actions</CardTitle>
        <CardDescription>
          Jump into live features. Bill upload is always optional. Reports open
          only when you choose.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="secondary"
              className="gap-2"
              nativeButton={false}
              render={<Link href={action.href} />}
            >
              <Icon className="size-4" aria-hidden />
              {action.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
