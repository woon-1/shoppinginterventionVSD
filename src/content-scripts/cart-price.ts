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

function extractWalmartCartTotal(): number | null {
  return firstPositivePrice([
    "[data-testid='grand-total']",
    "[data-automation-id='cart-subtotal']",
    "[automation-id='cart-page-summary-subtotal']",
    ".cart-summary-subTotal span",
  ]);
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
