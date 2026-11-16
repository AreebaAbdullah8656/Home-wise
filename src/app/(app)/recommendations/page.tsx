import { redirect } from "next/navigation";

/** Hidden until recommendations ship — not reachable from nav. */
export default function RecommendationsPage() {
  redirect("/dashboard");
}
