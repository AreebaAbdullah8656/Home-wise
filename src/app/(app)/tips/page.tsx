import { redirect } from "next/navigation";

/** Hidden until Smart Saving Tips ships — not reachable from nav. */
export default function TipsPage() {
  redirect("/dashboard");
}
