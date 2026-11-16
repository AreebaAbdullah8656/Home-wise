import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

type FeaturePlaceholderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  phaseNote: string;
};

export function FeaturePlaceholder({
  title,
  description,
  icon,
  emptyTitle,
  emptyDescription,
  phaseNote,
}: FeaturePlaceholderProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState icon={icon} title={emptyTitle} description={emptyDescription}>
        <p className="text-xs text-muted-foreground">{phaseNote}</p>
      </EmptyState>
    </div>
  );
}
