"use client";

import { useMemo, useState, useTransition, useActionState } from "react";
import Link from "next/link";
import {
  confirmBillScan,
  type ActionState,
} from "@/app/bills/actions";
import type { BillExtraction, BillItemExtraction } from "@/lib/gemini/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { todayIso } from "@/lib/budget-math";
import { compressImageForUpload } from "@/lib/client/compress-image";
import { parseGeminiFailure } from "@/lib/client/gemini-request";

const initial: ActionState = {};

type ScanResponse = {
  ok?: boolean;
  error?: string;
  retryable?: boolean;
  extraction?: BillExtraction;
  model?: string;
};

export function BillScanner({ geminiReady }: { geminiReady: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanRetryable, setScanRetryable] = useState(false);
  const [extraction, setExtraction] = useState<BillExtraction | null>(null);
  const [storeName, setStoreName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(todayIso());
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<BillItemExtraction[]>([]);
  const [preparing, startPrepare] = useTransition();
  const [scanning, startScan] = useTransition();
  const [confirmState, confirmAction, confirming] = useActionState(
    confirmBillScan,
    initial
  );
  const busy = preparing || scanning || confirming;

  function onFileChange(next: File | null) {
    setExtraction(null);
    setScanError(null);
    setScanRetryable(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!next) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    startPrepare(async () => {
      const prepared = await compressImageForUpload(next);
      setFile(prepared);
      if (prepared.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(prepared));
      } else {
        setPreviewUrl(null);
      }
    });
  }

  function applyExtraction(data: BillExtraction) {
    setExtraction(data);
    setStoreName(data.store_name ?? "");
    setPurchaseDate(data.purchase_date || todayIso());
    setTotalAmount(
      data.total_amount != null && data.total_amount > 0
        ? String(data.total_amount)
        : ""
    );
    setNotes(data.notes ?? "");
    setItems(
      data.items.length
        ? data.items.map((item) => ({ ...item }))
        : [
            {
              product_name: "",
              quantity: 1,
              unit_price: null,
              line_total: null,
              discount: null,
              category_suggestion: null,
            },
          ]
    );
  }

  function runScan() {
    if (!file) {
      setScanError("Choose a bill image or PDF first.");
      setScanRetryable(false);
      return;
    }
    setScanError(null);
    setScanRetryable(false);
    startScan(async () => {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/bills/scan", { method: "POST", body });
      const json = (await res.json()) as ScanResponse;
      if (!res.ok || !json.extraction) {
        const failure = parseGeminiFailure(json, "Scan failed.");
        setScanError(failure.error);
        setScanRetryable(failure.retryable || res.status === 503);
        setExtraction(null);
        return;
      }
      applyExtraction(json.extraction);
    });
  }

  function updateItem(index: number, patch: Partial<BillItemExtraction>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  const reviewedExtraction = useMemo(() => {
    if (!extraction) return null;
    return {
      ...extraction,
      store_name: storeName || null,
      purchase_date: purchaseDate || null,
      total_amount: totalAmount ? Number(totalAmount) : null,
      notes: notes || null,
      items: items.filter((i) => i.product_name.trim()),
    } satisfies BillExtraction;
  }, [extraction, storeName, purchaseDate, totalAmount, notes, items]);

  function submitConfirm() {
    if (!file || !reviewedExtraction) return;
    const fd = new FormData();
    fd.set("file", file);
    fd.set("extraction_json", JSON.stringify(reviewedExtraction));
    fd.set(
      "items_json",
      JSON.stringify(items.filter((i) => i.product_name.trim()))
    );
    fd.set("store_name", storeName);
    fd.set("purchase_date", purchaseDate);
    fd.set("total_amount", totalAmount);
    fd.set("notes", notes);
    confirmAction(fd);
  }

  return (
    <div className="space-y-6">
      {!geminiReady ? (
        <p
          className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-foreground ring-1 ring-amber-500/30"
          role="status"
        >
          GEMINI_API_KEY is not set on the server. Bill OCR is unavailable until
          you add it to .env.local and restart. Manual expense entry still works
          on the Expenses page.
        </p>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Upload or capture</CardTitle>
          <CardDescription>
            Bill upload is optional for expense tracking. Review OCR before
            anything is saved as an expense.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bill_file">Bill image or PDF</Label>
              <Input
                id="bill_file"
                type="file"
                accept="image/*,application/pdf"
                disabled={!geminiReady || busy}
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bill_camera">Mobile camera</Label>
              <Input
                id="bill_camera"
                type="file"
                accept="image/*"
                capture="environment"
                disabled={!geminiReady || busy}
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Bill preview"
              className="max-h-64 rounded-xl border border-border object-contain"
            />
          ) : file ? (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              {preparing ? " · compressing…" : ""}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={runScan}
              disabled={!geminiReady || !file || busy}
            >
              {scanning ? "Scanning…" : preparing ? "Preparing…" : "Scan with Gemini"}
            </Button>
            <Button
              type="button"
              variant="outline"
              nativeButton={false}
              render={<Link href="/expenses" />}
            >
              Enter expense manually
            </Button>
          </div>
          {scanError ? (
            <div
              className="space-y-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              <p>{scanError}</p>
              {scanRetryable ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={runScan}
                  disabled={!file || busy}
                >
                  Retry
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {extraction && reviewedExtraction ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              Review before save
            </CardTitle>
            <CardDescription>
              Correct anything OCR got wrong. Confirming stores the bill,
              uploads the original privately, and creates expenses once.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="store_name">Store name</Label>
                <Input
                  id="store_name"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  disabled={confirming}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  disabled={confirming}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_amount">Total (PKR)</Label>
                <Input
                  id="total_amount"
                  type="number"
                  min={0}
                  step="1"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  disabled={confirming}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={confirming}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">Line items</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setItems((prev) => [
                      ...prev,
                      {
                        product_name: "",
                        quantity: 1,
                        unit_price: null,
                        line_total: null,
                        discount: null,
                        category_suggestion: null,
                      },
                    ])
                  }
                >
                  Add line
                </Button>
              </div>
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-2 rounded-xl border border-border p-3 md:grid-cols-6"
                >
                  <Input
                    className="md:col-span-2"
                    placeholder="Product"
                    value={item.product_name}
                    onChange={(e) =>
                      updateItem(index, { product_name: e.target.value })
                    }
                    disabled={confirming}
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity ?? ""}
                    onChange={(e) =>
                      updateItem(index, {
                        quantity: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    disabled={confirming}
                  />
                  <Input
                    type="number"
                    placeholder="Unit"
                    value={item.unit_price ?? ""}
                    onChange={(e) =>
                      updateItem(index, {
                        unit_price: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    disabled={confirming}
                  />
                  <Input
                    type="number"
                    placeholder="Line total"
                    value={item.line_total ?? ""}
                    onChange={(e) =>
                      updateItem(index, {
                        line_total: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    disabled={confirming}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Category"
                      value={item.category_suggestion ?? ""}
                      onChange={(e) =>
                        updateItem(index, {
                          category_suggestion: e.target.value || null,
                        })
                      }
                      disabled={confirming}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setItems((prev) => prev.filter((_, i) => i !== index))
                      }
                      disabled={confirming}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
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
                {confirmState.success}{" "}
                <Link className="underline" href="/bills">
                  Open My Bills
                </Link>
              </p>
            ) : null}

            <Button
              type="button"
              onClick={submitConfirm}
              disabled={!file || confirming}
            >
              {confirming ? "Saving…" : "Confirm and save bill"}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
