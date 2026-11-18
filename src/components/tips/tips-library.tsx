"use client";

import { useMemo, useState, useActionState } from "react";
import {
  refreshPersonalizedTips,
  toggleTipBookmark,
  type ActionState,
} from "@/app/tips/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TIP_CATEGORIES,
  type Tip,
  type TipCategory,
} from "@/lib/tips/catalog";

const initial: ActionState = {};

type TipsLibraryProps = {
  tips: Tip[];
  bookmarkedKeys: string[];
  orphanBookmarks?: Tip[];
  signedIn: boolean;
  aiGeneratedAt?: string | null;
  aiNotice?: string | null;
  refreshRemainingToday?: number;
  geminiReady?: boolean;
};

export function TipsLibrary({
  tips,
  bookmarkedKeys,
  orphanBookmarks = [],
  signedIn,
  aiGeneratedAt = null,
  aiNotice = null,
  refreshRemainingToday = 0,
  geminiReady = false,
}: TipsLibraryProps) {
  const [category, setCategory] = useState<TipCategory | "all" | "bookmarked">(
    "all"
  );
  const [bookmarks, setBookmarks] = useState(() => new Set(bookmarkedKeys));
  const [state, action, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await toggleTipBookmark(prev, formData);
      const key = String(formData.get("tip_key") ?? "");
      if (!result.error && key) {
        setBookmarks((prevSet) => {
          const next = new Set(prevSet);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return next;
        });
      }
      return result;
    },
    initial
  );
  const [refreshState, refreshAction, refreshPending] = useActionState(
    refreshPersonalizedTips,
    initial
  );

  const visible = useMemo(() => {
    if (category === "bookmarked") {
      const fromLibrary = tips.filter((t) => bookmarks.has(t.key));
      const known = new Set(fromLibrary.map((t) => t.key));
      const orphans = orphanBookmarks.filter(
        (t) => bookmarks.has(t.key) && !known.has(t.key)
      );
      return [...fromLibrary, ...orphans];
    }
    if (category === "all") return tips;
    return tips.filter((t) => t.category === category);
  }, [tips, category, bookmarks, orphanBookmarks]);

  const aiCount = tips.filter((t) => t.source === "ai").length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-accent/40 px-4 py-3 text-sm text-accent-foreground">
        <p>
          Curated household tips stay available as a baseline.
          {aiCount > 0
            ? ` ${aiCount} personalized tip${aiCount === 1 ? "" : "s"} labeled AI-generated.`
            : " Personalized tips appear when Gemini is configured and you are signed in."}
        </p>
        {aiGeneratedAt ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Last personalized refresh{" "}
            {new Date(aiGeneratedAt).toLocaleString()}. Auto-refresh at most
            once per week.
          </p>
        ) : null}
        {aiNotice ? (
          <p className="mt-1 text-xs text-muted-foreground">{aiNotice}</p>
        ) : null}
        {signedIn ? (
          <form action={refreshAction} className="mt-3">
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              disabled={
                refreshPending || !geminiReady || refreshRemainingToday <= 0
              }
            >
              {refreshPending
                ? "Refreshing…"
                : `Refresh tips (${refreshRemainingToday} left today)`}
            </Button>
          </form>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Sign in for personalized tips based on your spending patterns.
          </p>
        )}
        {refreshState.error ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {refreshState.error}
          </p>
        ) : null}
        {refreshState.success ? (
          <p className="mt-2 text-sm" role="status">
            {refreshState.success}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={category === "all" ? "default" : "outline"}
          onClick={() => setCategory("all")}
        >
          All
        </Button>
        <Button
          type="button"
          size="sm"
          variant={category === "bookmarked" ? "default" : "outline"}
          onClick={() => setCategory("bookmarked")}
        >
          Bookmarked ({bookmarks.size})
        </Button>
        {TIP_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            type="button"
            size="sm"
            variant={category === cat ? "default" : "outline"}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {state.error ? (
        <p
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
          role="status"
        >
          {state.success}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No tips in this view.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {visible.map((tip) => {
            const bookmarked = bookmarks.has(tip.key);
            return (
              <li
                key={tip.key}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{tip.category}</Badge>
                    {tip.source === "ai" ? (
                      <Badge variant="secondary">AI-generated</Badge>
                    ) : null}
                    {bookmarked ? (
                      <Badge variant="secondary">Bookmarked</Badge>
                    ) : null}
                  </div>
                  <h3 className="font-heading text-lg text-foreground">
                    {tip.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{tip.body}</p>
                </div>
                {signedIn ? (
                  <form action={action}>
                    <input type="hidden" name="tip_key" value={tip.key} />
                    <input type="hidden" name="tip_title" value={tip.title} />
                    <input type="hidden" name="tip_body" value={tip.body} />
                    <input
                      type="hidden"
                      name="tip_category"
                      value={tip.category}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant={bookmarked ? "secondary" : "outline"}
                      disabled={pending}
                    >
                      {bookmarked ? "Remove bookmark" : "Bookmark"}
                    </Button>
                  </form>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Sign in to bookmark tips.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
