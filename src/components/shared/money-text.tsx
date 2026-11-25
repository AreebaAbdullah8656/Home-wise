"use client";

import { useMoney } from "@/lib/currency/provider";

/** Client money display that converts stored → active currency. */
export function MoneyText({
  amount,
  className,
}: {
  amount: number | null | undefined;
  className?: string;
}) {
  const { format } = useMoney();
  return <span className={className}>{format(amount)}</span>;
}
