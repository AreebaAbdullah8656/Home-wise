import { redirect } from "next/navigation";

/** Hidden until bill OCR ships — not reachable from nav. */
export default function ScanBillPage() {
  redirect("/dashboard");
}
