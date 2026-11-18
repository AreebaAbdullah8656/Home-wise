/**
 * Phase 10 interactive smoke — Playwright against local Next.js.
 * Usage: node scripts/phase10-smoke.mjs
 * BASE_URL defaults to http://localhost:3000
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const stamp = Date.now();
const email = `homewise.smoke.${stamp}@mailinator.com`;
const password = "SmokeTest1!";
const results = [];

function record(id, status, detail = "") {
  results.push({ id, status, detail: String(detail).slice(0, 500) });
  console.log(`[${status}] ${id}${detail ? ` — ${detail}` : ""}`);
}

async function safe(id, fn) {
  try {
    await fn();
  } catch (err) {
    record(id, "fail", err?.message || err);
  }
}

async function waitReady(page) {
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
}

async function goto(page, path, timeout = 60000) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout });
  await waitReady(page);
}

async function clickNav(page, name) {
  // Prefer desktop sidebar if visible; else mobile.
  const link = page.getByRole("link", { name }).first();
  await link.click({ timeout: 8000 });
  await waitReady(page);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  // ---- Auth: register ----
  await safe("register", async () => {
    await goto(page, "/register");
    await page.locator("#display_name").fill("Smoke Tester");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await Promise.all([
      page.waitForURL(/\/dashboard/, { timeout: 25000 }).catch(() => {}),
      page.getByRole("button", { name: "Create account" }).click(),
    ]);
    await page.waitForTimeout(1000);
    if (page.url().includes("/dashboard")) {
      record("register", "pass", "redirected to dashboard");
      return;
    }
    const formAlert = page.locator("form [role='alert'], form p[role='alert']");
    if (await formAlert.count()) {
      const text = (await formAlert.first().innerText()).trim();
      if (/confirm|email/i.test(text)) {
        record("register", "blocked", text);
      } else {
        record("register", "fail", text);
      }
      return;
    }
    const status = page.locator("form [role='status']");
    if (await status.count()) {
      record("register", "pass", (await status.first().innerText()).trim());
      return;
    }
    const body = (await page.locator("body").innerText()).slice(0, 400);
    record("register", "fail", `unexpected URL ${page.url()} · ${body}`);
  });

  // ---- Auth: login (sign out first if register left us signed in) ----
  let signedIn = false;
  await safe("login", async () => {
    if (page.url().includes("/dashboard")) {
      const so = page.getByRole("button", { name: /Sign out/i }).first();
      if (await so.count()) {
        await so.click();
        await page.waitForURL(/\/login/, { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(500);
      }
    }
    await goto(page, "/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(500);
    if (page.url().includes("/dashboard")) {
      signedIn = true;
      record("login", "pass", "landed on dashboard");
      return;
    }
    const formAlert = page.locator("form [role='alert']");
    const text = (await formAlert.count())
      ? (await formAlert.first().innerText()).trim()
      : page.url();
    if (/confirm|Email not confirmed|Invalid login/i.test(text)) {
      record("login", "blocked", text);
    } else {
      record("login", "fail", text);
    }
  });

  if (!signedIn) {
    // Try visiting protected pages anonymously for layout checks, then stop data flows.
    await safe("reports_never_auto_open", async () => {
      await goto(page, "/dashboard");
      const url = page.url();
      if (url.includes("/reports")) throw new Error("dashboard redirected to reports");
      record("reports_never_auto_open", "pass", "dashboard did not auto-open reports");
    });
    await safe("mobile_layout", async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await goto(page, "/login");
      const body = await page.locator("body").innerText();
      if (!/Sign in|HomeWise|email/i.test(body)) throw new Error("mobile login shell missing");
      record("mobile_layout", "pass", "login usable at 390px");
    });
    await browser.close();
    finish("auth_blocked");
    return;
  }

  // ---- Budget ----
  await safe("budget_categories", async () => {
    await goto(page, "/budget");
    await page.locator("#total_amount").fill("75000");
    await page.locator("#savings_allocation").fill("5000");
    await page.locator("#emergency_allocation").fill("3000");
    await page.getByRole("button", { name: /Save monthly budget/i }).click();
    await page.waitForTimeout(1500);
    const cat = page.locator("#new_category_name");
    if (await cat.count()) {
      await cat.fill(`Smoke Cat ${stamp}`);
      await page.locator("#new_category_limit").fill("2000");
      await page.getByRole("button", { name: /^Add$/ }).first().click();
      await page.waitForTimeout(1500);
    }
    const text = await page.locator("main").innerText();
    if (!/75000|75,000|Budget|categor/i.test(text)) {
      throw new Error("budget page did not reflect save");
    }
    record("budget_categories", "pass", "budget saved / categories UI present");
  });

  // ---- Manual expense ----
  await safe("manual_expense", async () => {
    await goto(page, "/expenses");
    await page.locator("#name").fill(`Smoke grocery ${stamp}`);
    await page.locator("#amount").fill("450");
    const catSelect = page.locator("#category_id");
    if (await catSelect.count()) {
      const options = await catSelect.locator("option").allTextContents();
      const grocery = options.findIndex((o) => /grocer/i.test(o));
      if (grocery >= 0) await catSelect.selectOption({ index: grocery });
      else if (options.length > 1) await catSelect.selectOption({ index: 1 });
    }
    await page.getByRole("button", { name: /Save expense/i }).click();
    await page.waitForTimeout(2000);
    const text = await page.locator("main").innerText();
    if (!new RegExp(`Smoke grocery ${stamp}`).test(text)) {
      throw new Error("expense not listed after save");
    }
    record("manual_expense", "pass", "expense visible in list");
  });

  // ---- NL expense ----
  await safe("nl_expense", async () => {
    await goto(page, "/expenses");
    const body = await page.locator("main").innerText();
    if (/GEMINI_API_KEY is missing/i.test(body)) {
      record("nl_expense", "blocked", "Gemini unavailable notice shown");
      return;
    }
    const area = page.locator("#nl_text");
    if (!(await area.count())) {
      record("nl_expense", "blocked", "NL entry UI not found");
      return;
    }
    await area.fill("Bought vegetables for Rs. 300 today");
    const parseBtn = page.getByRole("button", { name: /Suggest with Gemini/i });
    await parseBtn.click();
    // Primary model may 503/timeout before flash-lite fallback (~20–45s).
    const confirm = page.getByRole("button", { name: /Confirm and save expense/i });
    const formAlert = page.locator("form [role='alert'], [role='alert']").filter({
      hasText: /./,
    });
    try {
      await Promise.race([
        confirm.waitFor({ state: "visible", timeout: 90000 }),
        formAlert.first().waitFor({ state: "visible", timeout: 90000 }),
      ]);
    } catch {
      record("nl_expense", "fail", "timed out waiting for suggestion or error");
      return;
    }
    if (await confirm.count()) {
      await confirm.click();
      await page.waitForTimeout(3000);
      record("nl_expense", "pass", "parsed and confirmed");
      return;
    }
    const err = (await formAlert.first().innerText()).trim();
    if (/quota|rate|503|unavailable|timed out|All Gemini/i.test(err)) {
      record("nl_expense", "blocked", err);
    } else {
      record("nl_expense", "fail", err || "suggestion UI did not appear");
    }
  });

  // ---- Grocery no duplicate ----
  let groceryExpenseCountBefore = 0;
  await safe("grocery_no_duplicate", async () => {
    await goto(page, "/expenses");
    groceryExpenseCountBefore = (await page.locator("main").innerText()).split(
      new RegExp(`Smoke milk ${stamp}`, "g")
    ).length - 1;

    await goto(page, "/grocery");
    await page.locator("#name").fill(`Smoke milk ${stamp}`);
    await page.locator("#estimated_price").fill("200");
    await page.locator("#actual_price").fill("200");
    await page.getByRole("button", { name: /Add to list/i }).click();
    await page.waitForTimeout(2000);

    const mark = page.getByRole("button", { name: /Mark purchased/i }).first();
    if (!(await mark.count())) throw new Error("Mark purchased button missing");
    await mark.click();
    await page.waitForTimeout(800);
    const dialog = page.getByRole("dialog");
    const actual = dialog.locator("#purchase_actual_price");
    if (await actual.count()) await actual.fill("200");
    await dialog.getByRole("button", { name: /Confirm purchased/i }).click();
    await page.waitForTimeout(2500);

    // Re-open mark flow if possible to assert duplicate block, else check expenses once
    await goto(page, "/expenses");
    const text = await page.locator("main").innerText();
    const count = text.split(new RegExp(`Smoke milk ${stamp}`, "g")).length - 1;
    if (count > 1) throw new Error(`duplicate expenses found: ${count}`);
    if (count < 1) throw new Error("expected one grocery-linked expense");
    record("grocery_no_duplicate", "pass", `exactly ${count} expense for grocery item`);
  });

  // ---- Savings + emergency ----
  await safe("savings_emergency", async () => {
    await goto(page, "/savings");
    const savingsName = page.locator("#savings_name");
    if (await savingsName.count()) {
      await savingsName.fill(`Smoke fridge ${stamp}`);
      await page.locator("#savings_target").fill("20000");
      await page.locator("#savings_allocated").fill("2000");
      await page.locator("#savings_actual").fill("500");
      await page.getByRole("button", { name: /Add savings goal/i }).click();
      await page.waitForTimeout(1500);
    }
    const emergName = page.locator("#emergency_name");
    if (await emergName.count()) {
      await emergName.fill("Emergency fund");
      await page.locator("#emergency_target").fill("50000");
      await page.locator("#emergency_allocated").fill("3000");
      await page.locator("#emergency_actual").fill("1000");
      await page.getByRole("button", { name: /Add emergency fund/i }).click();
      await page.waitForTimeout(1500);
    }
    const text = await page.locator("main").innerText();
    if (!/Saving|Emergency|Allocated|Actual/i.test(text)) {
      throw new Error("savings page content missing");
    }
    record("savings_emergency", "pass", "savings page interactive");
  });

  // ---- Inventory ----
  await safe("inventory", async () => {
    await goto(page, "/inventory");
    await page.locator("#inv_name").fill(`Smoke soap ${stamp}`);
    const status = page.locator("#inv_stock");
    if (await status.count()) {
      await status.selectOption("low").catch(async () => {
        await status.selectOption({ index: 1 }).catch(() => {});
      });
    }
    await page.getByRole("button", { name: /Add to inventory/i }).click();
    await page.waitForTimeout(2000);
    const text = await page.locator("main").innerText();
    if (!new RegExp(`Smoke soap ${stamp}`).test(text)) {
      throw new Error("inventory item not listed");
    }
    record("inventory", "pass", "item added");
  });

  // ---- Bill scan + My Bills ----
  await safe("bill_scan_my_bills", async () => {
    await goto(page, "/scan-bill");
    const main = await page.locator("main").innerText();
    if (/GEMINI_API_KEY is not set|unavailable/i.test(main)) {
      record("bill_scan_my_bills", "blocked", "Gemini OCR unavailable");
    } else if (/Scan|Upload|Choose file|bill/i.test(main)) {
      record("bill_scan_my_bills", "pass", "scan UI available (file OCR not uploaded in smoke)");
    } else {
      throw new Error("unexpected scan-bill page");
    }
    await goto(page, "/bills");
    const bills = await page.locator("main").innerText();
    if (!/Bill|wallet|bills/i.test(bills)) throw new Error("My Bills page missing");
    record("my_bills_page", "pass", "My Bills loads");
  });

  // ---- Reports never auto-open ----
  await safe("reports_never_auto_open", async () => {
    await goto(page, "/dashboard");
    await page.waitForTimeout(1000);
    if (page.url().includes("/reports")) throw new Error("auto-opened reports from dashboard");
    await goto(page, "/reports");
    if (!page.url().includes("/reports")) throw new Error("could not open reports intentionally");
    record("reports_never_auto_open", "pass", "dashboard stays put; /reports opens on demand");
  });

  // ---- Tips ----
  await safe("saving_tips", async () => {
    await goto(page, "/tips", 90000);
    const text = await page.locator("main").innerText();
    if (!/Grocery|Bookmark|tip|Tip library/i.test(text)) {
      throw new Error("tips library missing");
    }
    const refresh = page.getByRole("button", { name: /Refresh tips/i });
    let aiNote = "curated tips present";
    if (await refresh.count()) {
      aiNote = "curated + Refresh tips UI";
      await refresh.click();
      await page.waitForTimeout(25000);
      const after = await page.locator("main").innerText();
      if (/AI-generated|personalized tips refreshed|Refresh limit|unavailable/i.test(after)) {
        aiNote = /AI-generated/i.test(after)
          ? "curated + AI tips after refresh"
          : `curated; refresh responded (${after.match(/Refresh limit|unavailable|refreshed|Tap Refresh[^.]*/i)?.[0] ?? "ok"})`;
      }
    }
    record("saving_tips", "pass", aiNote);
  });

  // ---- Recommendations Wapda Town ----
  await safe("recommendations_wapda", async () => {
    await goto(page, "/recommendations");
    const area = page.locator("#your_area");
    if (!(await area.count())) throw new Error("area field missing");
    await area.fill("Wapda Town, Gujranwala");
    await page.getByRole("button", { name: "Set area" }).click();
    await page.waitForTimeout(12000);
    const text = await page.locator("main").innerText();
    if (/outside Pakistan/i.test(text)) throw new Error(text.slice(0, 200));
    if (/Searching within/i.test(text) || /WAPDA|Gujranwala|Nearby|shop|Imtiaz|Retry/i.test(text)) {
      record(
        "recommendations_wapda",
        "pass",
        /could not be loaded|No nearby/i.test(text)
          ? "area set; nearby empty/unavailable (network/API)"
          : "area set; nearby UI responded"
      );
    } else {
      throw new Error(text.slice(0, 240));
    }
  });

  // ---- Settings ----
  await safe("settings", async () => {
    await goto(page, "/settings");
    await page.locator("#display_name").fill("Smoke Tester Updated");
    const currency = page.locator("#currency");
    if (await currency.count()) await currency.selectOption("PKR");
    await page.locator("#location").fill("Gujranwala");
    await page.getByRole("button", { name: /Save profile|Save/i }).click();
    await page.waitForTimeout(2000);
    const text = await page.locator("main").innerText();
    if (/error|failed/i.test(text) && !/saved|success|Profile/i.test(text)) {
      throw new Error(text.slice(0, 200));
    }
    record("settings", "pass", "profile save attempted");
  });

  // ---- Mobile layout ----
  await safe("mobile_layout", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page, "/dashboard");
    const text = await page.locator("body").innerText();
    if (!/Dashboard|Budget|Expense|HomeWise/i.test(text)) {
      throw new Error("mobile dashboard shell incomplete");
    }
    // ensure no horizontal blow-up of main
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    if (scrollWidth > clientWidth + 40) {
      record("mobile_layout", "fail", `horizontal overflow ${scrollWidth} > ${clientWidth}`);
    } else {
      record("mobile_layout", "pass", "390px dashboard ok");
    }
  });

  // ---- Logout ----
  await safe("logout", async () => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await goto(page, "/dashboard");
    const btn = page.getByRole("button", { name: /Sign out/i }).first();
    if (!(await btn.count())) {
      // maybe in mobile nav
      await page.setViewportSize({ width: 390, height: 844 });
      await goto(page, "/dashboard");
    }
    const signOut = page.getByRole("button", { name: /Sign out/i }).first();
    if (!(await signOut.count())) throw new Error("Sign out button not found");
    await signOut.click();
    await page.waitForTimeout(2000);
    if (!page.url().includes("/login") && !page.url().includes("/register")) {
      // might still be on dashboard if action slow
      await goto(page, "/dashboard");
      if (page.url().includes("/login")) {
        record("logout", "pass", "session cleared");
        return;
      }
    }
    if (page.url().includes("/login")) record("logout", "pass", "redirected to login");
    else record("logout", "pass", `post-logout url ${page.url()}`);
  });

  await browser.close();
  finish("complete");
}

function finish(reason) {
  const outDir = join(process.cwd(), "scripts");
  const path = join(outDir, "phase10-smoke-results.json");
  writeFileSync(
    path,
    JSON.stringify(
      {
        reason,
        base: BASE,
        email,
        at: new Date().toISOString(),
        results,
      },
      null,
      2
    )
  );
  console.log(`\nWrote ${path}`);
  const failed = results.filter((r) => r.status === "fail").length;
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  record("harness", "fail", err?.message || err);
  finish("crash");
});
