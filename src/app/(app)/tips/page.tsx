import { Suspense } from "react";
import type { Metadata } from "next";
import { Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TipsLibrary } from "@/components/tips/tips-library";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isGeminiConfigured } from "@/lib/gemini/config";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/server";
import {
  SAVING_TIPS,
  TIP_CATEGORIES,
  type Tip,
  type TipCategory,
} from "@/lib/tips/catalog";
import { getAiSavingTipsForPage } from "@/lib/tips/ai-tips";
import {
  getBookmarkedTipKeys,
  getBookmarkedTips,
} from "@/lib/tips/queries";

export const metadata: Metadata = { title: "Smart Saving Tips" };
export const instant = false;

function Fallback() {
  return (
    <EmptyState
      icon={Lightbulb}
      title="Loading tips…"
      description="Fetching your bookmarked advice."
    />
  );
}

function isTipCategory(value: string | null | undefined): value is TipCategory {
  return Boolean(value && (TIP_CATEGORIES as string[]).includes(value));
}

async function TipsContent() {
  const configured = isSupabaseConfigured();
  const user = configured ? await getSessionUser() : null;
  const geminiReady = isGeminiConfigured();

  const [bookmarked, bookmarkRows, aiStatus] = user
    ? await Promise.all([
        getBookmarkedTipKeys(),
        getBookmarkedTips(),
        getAiSavingTipsForPage(),
      ])
    : [new Set<string>(), [], null];

  const curated: Tip[] = SAVING_TIPS.map((tip) => ({
    ...tip,
    source: "curated" as const,
  }));
  const aiTips = aiStatus?.tips ?? [];
  const tips = [...aiTips, ...curated];

  const tipKeys = new Set(tips.map((t) => t.key));
  const orphanBookmarks: Tip[] = bookmarkRows
    .filter((row) => !tipKeys.has(row.tip_key))
    .map((row) => ({
      key: row.tip_key,
      title: row.tip_title,
      body: row.tip_body?.trim() || "Previously bookmarked tip.",
      category: isTipCategory(row.tip_category)
        ? row.tip_category
        : "Organization",
      source: row.tip_key.startsWith("ai-") ? ("ai" as const) : ("curated" as const),
    }));

  const notice =
    aiStatus?.notice ||
    (!user
      ? null
      : !geminiReady
        ? "GEMINI_API_KEY is not set — showing curated tips only."
        : aiTips.length === 0
          ? "Personalized tips are unavailable right now — showing curated tips."
          : null);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Tip library</CardTitle>
        <CardDescription>
          Practical advice for groceries, utilities, kitchen, cleaning, DIY,
          organization, and shopping. Personalized tips use aggregated spending
          patterns only — never raw bills.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TipsLibrary
          tips={tips}
          bookmarkedKeys={[...bookmarked]}
          orphanBookmarks={orphanBookmarks}
          signedIn={Boolean(user)}
          aiGeneratedAt={aiStatus?.generatedAt ?? null}
          aiNotice={notice}
          refreshRemainingToday={aiStatus?.refreshRemainingToday ?? 0}
          geminiReady={geminiReady}
        />
      </CardContent>
    </Card>
  );
}

export default function TipsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Smart Saving Tips"
        description="Curated household advice plus optional AI tips from your spending patterns — bookmark what helps."
      />
      <Suspense fallback={<Fallback />}>
        <TipsContent />
      </Suspense>
    </div>
  );
}
