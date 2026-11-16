import { redirect } from "next/navigation";

/** Hidden until savings UI ships — not reachable from nav. */
export default function SavingsPage() {
  redirect("/dashboard");
}
