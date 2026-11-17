"use client";

import { useState, useTransition, useActionState } from "react";
import {
  confirmNlExpense,
  type ActionState,
} from "@/app/expenses/nl-actions";
import type { NlExpenseSuggestion } from "@/lib/gemini/schemas";
import type { CategoryRow } from "@/lib/finance/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { todayIso } from "@/lib/budget-math";

const initial: ActionState = {};

const PAYMENT_METHODS = [
  "Cash",
  "JazzCash",
  "EasyPaisa",
  "Card",
  "Bank transfer",
  "Other",
] as const;

type NlExpenseEntryProps = {
  categories: CategoryRow[];
  geminiReady: boolean;
};

export function NlExpenseEntry({
  categories,
  geminiReady,
}: NlExpenseEntryProps) {
  const [text, setText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<NlExpenseSuggestion | null>(
    null
  );
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayIso());
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [parsing, startParse] = useTransition();
  const [confirmState, confirmAction, confirming] = useActionState(
    confirmNlExpense,
    initial
  );

  function matchCategory(suggestionName: string | null | undefined) {
    if (!suggestionName) return "";
    const needle = suggestionName.toLowerCase();
    const exact = categories.find((c) => c.name.toLowerCase() === needle);
    if (exact) return exact.id;
    const partial = categories.find(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        needle.includes(c.name.toLowerCase())
    );
    return partial?.id ?? "";
  }

  function runParse() {
    if (!text.trim()) {
      setParseError("Type an expense description first.");
      return;
    }
    setParseError(null);
    startParse(async () => {
      const res = await fetch("/api/expenses/parse-nl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = (await res.json()) as {
        error?: string;
        suggestion?: NlExpenseSuggestion;
      };
      if (!res.ok || !json.suggestion) {
        setSuggestion(null);
        setParseError(json.error || "Could not parse that expense.");
        return;
      }
      const s = json.suggestion;
      setSuggestion(s);
      setName(s.name);
      setAmount(String(s.amount));
      setCategoryId(matchCategory(s.category_suggestion));
      setExpenseDate(s.expense_date || todayIso());
      setPaymentMethod(s.payment_method ?? "");
      setNotes(s.notes ?? text);
    });
  }

  function submitConfirm() {
    const fd = new FormData();
    fd.set("name", name);
    fd.set("amount", amount);
    fd.set("category_id", categoryId);
    fd.set("expense_date", expenseDate);
    fd.set("payment_method", paymentMethod);
    fd.set("notes", notes);
    confirmAction(fd);
  }

  return (
    <div className="space-y-4">
      {!geminiReady ? (
        <p
          className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm ring-1 ring-amber-500/30"
          role="status"
        >
          GEMINI_API_KEY is missing — natural-language entry is unavailable.
          Use the manual form below instead.
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="nl_text">Describe the expense</Label>
        <Textarea
          id="nl_text"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='e.g. "Bought groceries for Rs. 2500 today."'
          disabled={!geminiReady || parsing || confirming}
        />
      </div>
      <Button
        type="button"
        onClick={runParse}
        disabled={!geminiReady || parsing || confirming}
      >
        {parsing ? "Parsing…" : "Suggest with Gemini"}
      </Button>
      {parseError ? (
        <p
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {parseError}
        </p>
      ) : null}

      {suggestion ? (
        <div className="space-y-4 rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">
            Review the suggestion
            {suggestion.confidence
              ? ` (confidence: ${suggestion.confidence})`
              : ""}
            , then confirm to save. Nothing is saved until you confirm.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nl_name">Expense name</Label>
              <Input
                id="nl_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={confirming}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nl_amount">Amount (PKR)</Label>
              <Input
                id="nl_amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={confirming}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nl_date">Date</Label>
              <Input
                id="nl_date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                disabled={confirming}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nl_category">Category</Label>
              <select
                id="nl_category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={confirming}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">Uncategorized</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nl_payment">Payment method</Label>
              <select
                id="nl_payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={confirming}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">Select</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nl_notes">Notes</Label>
              <Textarea
                id="nl_notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={confirming}
              />
            </div>
          </div>

          {confirmState.error ? (
            <p
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {confirmState.error}
            </p>
          ) : null}
          {confirmState.success ? (
            <p
              className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
              role="status"
            >
              {confirmState.success}
            </p>
          ) : null}

          <Button
            type="button"
            onClick={submitConfirm}
            disabled={confirming}
          >
            {confirming ? "Saving…" : "Confirm and save expense"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
