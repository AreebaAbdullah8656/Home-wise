import { redirect } from "next/navigation";

/** Hidden until inventory ships — not reachable from nav. */
export default function InventoryPage() {
  redirect("/dashboard");
}
