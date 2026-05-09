import type { WishlistItem } from "@/lib/types";
import { extractPrice } from "./utils";

function text(el: Element | null): string {
  return el?.textContent?.trim() ?? "";
}

function firstPositivePrice(selectors: string[]): number | null {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    const p = extractPrice(text(el));
    if (p > 0 && p < 500_000) return p;
  }
  return null;
}

function extractAmazonCartTotal(): number | null {
  const direct = firstPositivePrice([
    "#sc-subtotal-amount-buybox .a-price .a-offscreen",
    "#sc-subtotal-amount-buybox .a-price-whole",
    "#sc-subtotal .a-price .a-offscreen",
    "#sc-active-cart .sc-subtotal .a-price .a-offscreen",
    "[data-feature-id='subtotal'] .a-price .a-offscreen",
    "#subtotal .a-price .a-offscreen",
    "#subtotal #sc-subtotal .a-price .a-offscreen",
    ".sws-subtotal .a-price .a-offscreen",
  ]);
  if (direct != null) return direct;

  const wide = document.querySelectorAll(
    ".sc-subtotal, [data-testid='cart-summary-subtotal'], #cart-subtotal"
  );
  for (const node of wide) {
    const p = extractPrice(text(node));
    if (p > 0 && p < 500_000) return p;
  }

  return null;
}

function extractEbayCartTotal(): number | null {
  return firstPositivePrice([
    ".cart-summary-subtotal .cart-summary-value",
    "[data-test-id='SUBTOTAL']",
    ".summary-subtotal",
    ".font-bold[data-test-id='subtotal-label'] + span",
    "[class*='subtotal'] span",
  ]);
}

function extractEtsyCartTotal(): number | null {
  return firstPositivePrice([
    "[data-listing-cart-summary-subtotal] strong",
    "[data-region='cart-summary'] strong",
    ".wt-text-title-02.wt-text-right strong",
    "[data-selector='cart-summary-subtotal']",
  ]);
}

function extractTargetCartTotal(): number | null {
  return firstPositivePrice([
    "[data-test='cart-summary-subtotal']",
    "[data-test='cartSummaryTotal']",
    "[data-test='cart-page-summary-subtotal']",
    "[data-test='slot-summary-subtotal-value']",
  ]);
}

/**
 * Walk siblings/descendants of a labeled element looking for a price-shaped
 * string. Used as a fallback when Walmart's structured selectors miss.
 */
function priceNearLabel(labelRegex: RegExp): number | null {
  const candidates = document.querySelectorAll<HTMLElement>(
    "div, span, p, dt, dd, li"
  );
  for (const el of candidates) {
    const t = (el.textContent || "").trim();
    if (!labelRegex.test(t)) continue;
    if (t.length > 80) continue; // keep label search tight
    // Try sibling first, then parent's other children.
    const sibs: Element[] = [];
    if (el.nextElementSibling) sibs.push(el.nextElementSibling);
    if (el.parentElement) {
      for (const child of Array.from(el.parentElement.children)) {
        if (child !== el) sibs.push(child);
      }
    }
    for (const s of sibs) {
      const p = extractPrice(text(s));
      if (p > 0 && p < 500_000) return p;
    }
    // Otherwise look inside the label container itself.
    const inner = extractPrice(t);
    if (inner > 0 && inner < 500_000) return inner;
  }
  return null;
}

function extractWalmartCartTotal(): number | null {
  // Try structured selectors first. Walmart uses bare data-automation-id
  // values (the checkout button is `data-automation-id="checkout"`, not
  // `checkout-btn`) — so we try short forms here too.
  const direct = firstPositivePrice([
    "[data-automation-id='subtotal']",
    "[data-automation-id='estimated-total']",
    "[data-automation-id='grand-total']",
    "[data-automation-id='cart-subtotal']",
    "[data-testid='subtotal']",
    "[data-testid='grand-total']",
    "[data-testid='estimated-total']",
    "[automation-id='cart-page-summary-subtotal']",
    ".cart-summary-subTotal span",
  ]);
  if (direct != null) return direct;

  // Text-content fallback: find a label like "Estimated total" / "Subtotal"
  // and read the price next to it. Estimated total is preferred — it's the
  // post-savings, pre-tax number Walmart shows next to the checkout button.
  return (
    priceNearLabel(/^estimated\s+total\b/i) ??
    priceNearLabel(/^subtotal\b/i) ??
    priceNearLabel(/^total\b/i)
  );
}

export function extractCartTotal(
  website: WishlistItem["website"]
): number | null {
  switch (website) {
    case "amazon":
      return extractAmazonCartTotal();
    case "ebay":
      return extractEbayCartTotal();
    case "etsy":
      return extractEtsyCartTotal();
    case "target":
      return extractTargetCartTotal();
    case "walmart":
      return extractWalmartCartTotal();
    default:
      return null;
  }
}
