import { Badge } from "@/components/ui/badge";
import { SAMPLE_LABEL } from "@/lib/sample-dashboard";

export function SampleBadge() {
  return (
    <Badge
      variant="secondary"
      className="border border-border bg-beige/80 font-normal text-secondary-foreground"
    >
      {SAMPLE_LABEL}
    </Badge>
  );
}
