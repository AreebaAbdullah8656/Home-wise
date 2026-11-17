"use client";

import { useMemo, useState, useActionState, useTransition } from "react";
import {
  deleteBill,
  getBillDownloadUrl,
  type ActionState,
} from "@/app/bills/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPkr } from "@/lib/format";
import { toNumber } from "@/lib/budget-math";
import type { BillWithItems } from "@/lib/finance/bills";
import { BillItemSuggestions } from "@/components/recommendations/bill-item-suggestions";
import type { BillPlaceMatch } from "@/lib/recommendations/queries";

const initial: ActionState = {};

type BillsListProps = {
  bills: BillWithItems[];
  signedIn?: boolean;
  savedRecKeys?: string[];
  dismissedRecKeys?: string[];
  billMatches?: BillPlaceMatch[];
  placesConfigured?: boolean;
};

export function BillsList({
  bills,
  signedIn = false,
  savedRecKeys = [],
  dismissedRecKeys = [],
  billMatches = [],
  placesConfigured = false,
}: BillsListProps) {
  const [search, setSearch] = useState("");
  const [store, setStore] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [viewing, setViewing] = useState<BillWithItems | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingUrl, startUrl] = useTransition();
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteBill,
    initial
  );

  const filtered = useMemo(() => {
    return bills.filter((bill) => {
      if (
        search &&
        !(bill.store_name ?? "").toLowerCase().includes(search.toLowerCase()) &&
        !(bill.notes ?? "").toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (
        store &&
        !(bill.store_name ?? "").toLowerCase().includes(store.toLowerCase())
      ) {
        return false;
      }
      if (from && bill.purchase_date && bill.purchase_date < from) return false;
      if (to && bill.purchase_date && bill.purchase_date > to) return false;
      return true;
    });
  }, [bills, search, store, from, to]);

  function openBill(bill: BillWithItems) {
    setViewing(bill);
    setPreviewUrl(null);
    setActionError(null);
    if (!bill.storage_path) return;
    startUrl(async () => {
      const result = await getBillDownloadUrl(bill.id);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      setPreviewUrl(result.url ?? null);
    });
  }

  function downloadBill(bill: BillWithItems) {
    setActionError(null);
    startUrl(async () => {
      const result = await getBillDownloadUrl(bill.id);
      if (result.error || !result.url) {
        setActionError(result.error || "Download unavailable.");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="bill_search">Search</Label>
          <Input
            id="bill_search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Store or notes"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="bill_store">Store filter</Label>
          <Input
            id="bill_store"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="Store name"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="bill_from">From</Label>
            <Input
              id="bill_from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bill_to">To</Label>
            <Input
              id="bill_to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {(deleteState.error || actionError) && (
        <p
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {deleteState.error || actionError}
        </p>
      )}
      {deleteState.success ? (
        <p
          className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
          role="status"
        >
          {deleteState.success}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No confirmed bills yet. Scan a bill and confirm it first.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {filtered.map((bill) => (
            <li
              key={bill.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">
                    {bill.store_name || "Untitled store"}
                  </p>
                  <Badge variant="secondary">{bill.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {bill.purchase_date || "No date"}
                  {bill.total_amount != null
                    ? ` · ${formatPkr(toNumber(bill.total_amount))}`
                    : ""}
                  {` · ${bill.bill_items?.length ?? 0} items`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openBill(bill)}
                  disabled={pendingUrl}
                >
                  Open
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => downloadBill(bill)}
                  disabled={pendingUrl || !bill.storage_path}
                >
                  Download
                </Button>
                <form action={deleteAction}>
                  <input type="hidden" name="id" value={bill.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    disabled={deletePending}
                  >
                    Delete
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(open) => {
          if (!open) {
            setViewing(null);
            setPreviewUrl(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {viewing?.store_name || "Bill"} — {viewing?.purchase_date}
            </DialogTitle>
            <DialogDescription>
              Original file and extracted items. Private storage only.
            </DialogDescription>
          </DialogHeader>
          {viewing ? (
            <div className="space-y-4">
              {previewUrl ? (
                viewing.mime_type === "application/pdf" ? (
                  <iframe
                    title="Bill PDF"
                    src={previewUrl}
                    className="h-80 w-full rounded-xl border border-border"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Original bill"
                    className="max-h-80 w-full rounded-xl border border-border object-contain"
                  />
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  {pendingUrl
                    ? "Loading original…"
                    : "No preview available for this bill."}
                </p>
              )}
              <ul className="space-y-2 text-sm">
                {(viewing.bill_items ?? []).map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
                  >
                    <span>
                      {item.product_name}
                      {item.category_suggestion
                        ? ` · ${item.category_suggestion}`
                        : ""}
                    </span>
                    <span className="text-muted-foreground">
                      {item.line_total != null
                        ? formatPkr(toNumber(item.line_total))
                        : "—"}
                    </span>
                  </li>
                ))}
              </ul>
              <BillItemSuggestions
                matches={billMatches.filter((m) =>
                  (viewing.bill_items ?? []).some((item) => item.id === m.billItemId)
                )}
                signedIn={signedIn}
                savedKeys={savedRecKeys}
                dismissedKeys={dismissedRecKeys}
                placesConfigured={placesConfigured}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
