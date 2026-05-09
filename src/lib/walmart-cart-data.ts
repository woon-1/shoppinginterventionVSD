/**
 * Walmart cart data extraction.
 *
 * Walmart redesigns their cart DOM periodically and uses a mix of
 * `data-testid`, `data-automation-id`, `link-identifier`, and `itemprop`
 * attributes. We probe several selectors per role and accept the first hit.
 * If selectors drift, refining this file is the only place to update.
 */

import { extractCartTotal } from "@/content-scripts/cart-price";

export interface WalmartCartItem {
  name: string;
  price: number | null;
  quantity: number;
  productUrl: string | null;
  imageUrl: string | null;
}

export interface WalmartCartData {
  subtotal: number | null;
  itemCount: number;
  items: WalmartCartItem[];
  currency: string;
}

const ITEM_ROW_SELECTORS = [
  '[data-testid="list-view"] [data-testid="cart-item"]',
  '[data-testid="cart-item"]',
  '[data-automation-id="cart-line-item"]',
  '[data-testid="list-view-cart-item"]',
  '[data-item-id]',
];

const NAME_SELECTORS = [
  '[data-testid="product-title"]',
  '[link-identifier="itemTitles"]',
  '[data-automation-id="product-title"]',
  'a[link-identifier]',
];

const PRICE_SELECTORS = [
  '[data-testid="line-price"]',
  '[data-automation-id="cart-price"]',
  '[itemprop="price"]',
  '[data-testid="list-view-price"]',
  '[class*="line-price"]',
];

const IMAGE_SELECTORS = [
  'img[data-testid="productTileImage"]',
  'img[data-automation-id="product-image"]',
  'img',
];

const QTY_SELECTORS = [
  'input[aria-label*="Quantity" i]',
  '[data-testid="quantity-input"]',
  '[data-automation-id="quantity-stepper"] input',
  '[aria-label*="quantity" i]',
];

function text(el: Element | null | undefined): string {
  return (el?.textContent ?? "").trim();
}

function parsePrice(str: string): number | null {
  if (!str) return null;
  const m = str.match(/[\d,.]+/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function detectCurrencySymbol(): string {
  const sample = (document.body.innerText || "").slice(0, 4000);
  if (sample.includes("$")) return "$";
  if (sample.includes("€")) return "€";
  if (sample.includes("£")) return "£";
  return "$";
}

function firstMatch(container: Element, selectors: string[]): Element | null {
  for (const sel of selectors) {
    const found = container.querySelector(sel);
    if (found) return found;
  }
  return null;
}

function extractQuantity(container: Element): number {
  for (const sel of QTY_SELECTORS) {
    const el = container.querySelector(sel);
    if (!el) continue;
    if (el instanceof HTMLInputElement) {
      const n = parseInt(el.value.match(/\d+/)?.[0] ?? "", 10);
      if (Number.isFinite(n) && n > 0) return n;
    }
    const n = parseInt(text(el).match(/\d+/)?.[0] ?? "", 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  // Fallback: search the row text for "Qty: N"
  const m = text(container).match(/qty[^\d]{0,4}(\d+)/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 1;
}

function extractRows(): Element[] {
  for (const sel of ITEM_ROW_SELECTORS) {
    const rows = Array.from(document.querySelectorAll(sel));
    if (rows.length > 0) return rows;
  }
  return [];
}

export function extractWalmartCartData(): WalmartCartData {
  const result: WalmartCartData = {
    subtotal: extractCartTotal("walmart"),
    itemCount: 0,
    items: [],
    currency: detectCurrencySymbol(),
  };

  const rows = extractRows();

  for (const row of rows) {
    try {
      const name = text(firstMatch(row, NAME_SELECTORS)).slice(0, 120);
      if (!name) continue;

      const priceEl = firstMatch(row, PRICE_SELECTORS);
      const price = parsePrice(text(priceEl));

      const linkEl = row.querySelector(
        'a[link-identifier="itemTitles"], a[href*="/ip/"]'
      ) as HTMLAnchorElement | null;
      const productUrl = linkEl?.href ?? null;

      const imgEl = firstMatch(row, IMAGE_SELECTORS) as HTMLImageElement | null;
      const imageUrl =
        imgEl?.src ??
        imgEl?.getAttribute("data-src") ??
        imgEl?.getAttribute("srcset")?.split(/\s+/)[0] ??
        null;

      const quantity = extractQuantity(row);

      result.items.push({ name, price, quantity, productUrl, imageUrl });
    } catch (err) {
      console.warn("[Pause] walmart row extract error", err);
    }
  }

  result.itemCount =
    result.items.length > 0
      ? result.items.reduce((sum, i) => sum + Math.max(1, i.quantity), 0)
      : rows.length;

  return result;
}

/**
 * Cart contents stream in after navigation; retry a few times before giving
 * up so we don't intervene on an empty-looking page.
 */
export async function extractWalmartCartDataWithRetry(
  maxRetries = 3,
  delayMs = 400
): Promise<WalmartCartData> {
  for (let i = 0; i < maxRetries; i++) {
    const data = extractWalmartCartData();
    if (data.subtotal != null || data.items.length > 0) return data;
    if (i < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  return extractWalmartCartData();
}
