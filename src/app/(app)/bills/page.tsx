import { redirect } from "next/navigation";

/** Hidden until bill wallet ships — not reachable from nav. */
export default function BillsPage() {
  redirect("/dashboard");
}
