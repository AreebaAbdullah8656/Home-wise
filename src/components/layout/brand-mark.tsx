import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm"
        aria-hidden
      >
        HW
      </span>
      {!compact ? (
        <span className="min-w-0">
          <span className="font-heading block text-lg font-semibold leading-tight tracking-tight text-sage-deep">
            HomeWise
          </span>
          <span className="block text-xs text-muted-foreground">
            Smart household budget
          </span>
        </span>
      ) : null}
    </Link>
  );
}
