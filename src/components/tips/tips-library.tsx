"use client";

import { useMemo, useState, useActionState } from "react";
import {
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
  signedIn: boolean;
};

export function TipsLibrary({
  tips,
  bookmarkedKeys,
  signedIn,
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

  const visible = useMemo(() => {
    if (category === "bookmarked") {
      return tips.filter((t) => bookmarks.has(t.key));
    }
    if (category === "all") return tips;
    return tips.filter((t) => t.category === category);
  }, [tips, category, bookmarks]);

  return (
    <div className="space-y-4">
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
