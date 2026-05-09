// Walmart content script.
//
// Two responsibilities:
//   1. Inject the "Add to Wishlist" button on product pages (route observer).
//   2. Intercept the user's commit click — Continue to checkout, Place order —
//      and mount the cart intervention BEFORE Walmart's own navigation runs.
//      After the user picks Continue, replay the original click so Walmart's
//      flow proceeds untouched.
//
// We deliberately don't mount on cart-page load anymore — viewing the cart
// isn't a commitment to buy. Friction belongs at the moment of decision.

import {
  attachRouteObserver,
  extractCurrency,
  extractPrice,
  injectButton,
  injectReflectionPrompt,
  ProductData,
} from "./utils";
import { detectCartCheckoutContext } from "./cart-detection";
import {
  isHostInterventionDeferred,
  mountCartIntervention,
} from "./cart-intervention-ui";
import { extractWalmartCartDataWithRetry } from "@/lib/walmart-cart-data";

/* ---------- Product page: wishlist button ---------- */

function extractWalmartProduct(): ProductData | null {
  try {
    const nameEl = document.querySelector(
      "h1, [data-testid='product-title'], .product-name"
    );
    const name = nameEl?.textContent?.trim();
    if (!name) return null;

    let priceEl: Element | null = document.querySelector(
      "[data-testid='product-price'], .price, [class*='Price']"
    );
    let priceText = priceEl?.textContent?.trim() || "";

    if (!priceText) {
      const allPrices = document.querySelectorAll(
        "[data-testid*='price'], span[aria-label*='Price']"
      );
      if (allPrices.length > 0) {
        priceText = allPrices[0].textContent?.trim() || "";
      }
    }

    const price = extractPrice(priceText);
    const currency = extractCurrency(priceText);

    const imageEl = document.querySelector(
      "img[alt*='product'], [role='img'] img, .product-image img"
    ) as HTMLImageElement;
    const imageUrl = imageEl?.src;

    const url = window.location.href;

    return {
      name,
      price,
      currency,
      url,
      imageUrl: imageUrl || undefined,
    };
  } catch (error) {
    console.error("[Pause] Error extracting Walmart product:", error);
    return null;
  }
}

function initWalmartWishlistButton() {
  try {
    let container = document.querySelector(
      "[data-testid='product-actions'], [class*='ProductActions'], main"
    ) as HTMLElement;

    if (!container) {
      const priceSection = document.querySelector("[data-testid*='price']");
      if (priceSection?.parentElement) {
        container = priceSection.parentElement;
      } else {
        return;
      }
    }

    injectButton(container, "walmart", extractWalmartProduct);
    void injectReflectionPrompt("walmart", extractWalmartProduct);
  } catch (error) {
    console.error("[Pause] Error initializing Walmart wishlist button:", error);
  }
}

function tickWalmart(): boolean {
  const ctx = detectCartCheckoutContext("walmart", window.location.href);
  // On cart/checkout pages we wait for the user to click commit.
  if (ctx.active) return true;
  if (!document.querySelector("[data-pause-wishlist-button]")) {
    initWalmartWishlistButton();
  }
  return Boolean(document.querySelector("[data-pause-wishlist-button]"));
}

/* ---------- Commit click intercept ---------- */

/**
 * Attribute selectors for Walmart's commit-to-buy buttons. Walmart redesigns
 * cart/checkout periodically — when a redesign breaks the structured match,
 * the text-content fallback below should still catch the click.
 */
const COMMIT_SELECTORS = [
  // Cart page commit button — confirmed live (Walmart 2026):
  // <button data-automation-id="checkout" id="Continue to checkout button">
  'button[data-automation-id="checkout"]',
  // Checkout page place-order button — best guess matching the cart pattern,
  // refine if interception misses on the review page.
  'button[data-automation-id="place-order"]',
  'button[data-automation-id="placeOrder"]',
  // Older / alternate conventions kept as fallback in case Walmart redesigns.
  '[link-identifier="checkoutBtn"]',
  '[link-identifier="placeOrderBtn"]',
  '[data-testid="continue-to-checkout"]',
  '[data-testid="place-order-button"]',
  'button[aria-label*="continue to checkout" i]',
  'button[aria-label*="place order" i]',
];

/**
 * Visible-text fallback. Specific patterns — "Continue" alone doesn't match
 * (that's mid-cart navigation, not commit-to-buy), and "Skip to Checkout"
 * doesn't either since it lacks "continue".
 */
const COMMIT_TEXT_PATTERNS = [
  /\bcontinue\s+to\s+checkout\b/i,
  /\bplace\s+(your\s+)?order\b/i,
];

function isClickableButton(el: Element): boolean {
  if (el instanceof HTMLButtonElement) return true;
  if (el instanceof HTMLInputElement) {
    return el.type === "submit" || el.type === "button";
  }
  if (el instanceof HTMLAnchorElement) return true;
  const role = el.getAttribute("role");
  return role === "button" || role === "link";
}

function findByText(start: Element): HTMLElement | null {
  let cur: Element | null = start;
  // Walk up at most 6 ancestors to find a button-ish element whose text
  // matches a commit pattern. Bounded so we don't accidentally bubble all the
  // way to <body>.
  for (let depth = 0; cur && depth < 6; depth++) {
    if (isClickableButton(cur)) {
      const text = (cur.textContent ?? "").trim();
      if (text && COMMIT_TEXT_PATTERNS.some((re) => re.test(text))) {
        return cur as HTMLElement;
      }
    }
    cur = cur.parentElement;
  }
  return null;
}

function findCommitButton(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  for (const sel of COMMIT_SELECTORS) {
    const match = target.closest(sel);
    if (match) return match as HTMLElement;
  }
  return findByText(target);
}

async function mountInterventionForCommit(button: HTMLElement) {
  if (document.querySelector("[data-pause-cart-host]")) return;

  const resume = () => {
    // Programmatic .click() fires with isTrusted=false, so our own listener
    // will skip it and Walmart's natural form/route handler runs.
    button.click();
  };

  const ctx = detectCartCheckoutContext("walmart", window.location.href);

  try {
    const cartData = await extractWalmartCartDataWithRetry();
    void mountCartIntervention("walmart", ctx.active ? ctx.kind : "checkout", {
      items: cartData.items.map((i) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      onContinue: resume,
    });
  } catch (err) {
    console.warn(
      "[Pause] failed to mount intervention; releasing checkout",
      err
    );
    // Don't trap the user — release the click if intervention setup fails.
    resume();
  }
}

function setupCommitIntercept() {
  document.addEventListener(
    "click",
    (e) => {
      // Only user-initiated clicks; our own resume click() reports isTrusted=false.
      if (!e.isTrusted) return;
      const button = findCommitButton(e.target);
      if (!button) {
        // Diagnostic: when the user clicks a button-ish element that we DIDN'T
        // recognize, dump its attributes so we can refine selectors. Cheap to
        // leave in until the click intercept is proven stable in the wild.
        if (e.target instanceof Element) {
          const nearby = e.target.closest("button, a, [role='button']");
          if (nearby) {
            console.log("[Pause] click (no commit match)", {
              tag: nearby.tagName,
              dataAutomationId: nearby.getAttribute("data-automation-id"),
              dataTestid: nearby.getAttribute("data-testid"),
              linkIdentifier: nearby.getAttribute("link-identifier"),
              ariaLabel: nearby.getAttribute("aria-label"),
              id: nearby.id,
              text: (nearby.textContent ?? "").trim().slice(0, 60),
            });
          }
        }
        return;
      }
      // If the user dismissed an earlier modal with a defer, let the natural
      // checkout flow run — don't trap them with a silently-suppressed modal.
      if (isHostInterventionDeferred(location.hostname)) {
        console.log("[Pause] commit deferred; letting Walmart click through");
        return;
      }
      console.log("[Pause] commit click intercepted", button);
      e.preventDefault();
      e.stopImmediatePropagation();
      void mountInterventionForCommit(button);
    },
    true // capture phase: catch before Walmart's own listeners
  );
}

/* ---------- Entry ---------- */

console.log("[Pause] Walmart content script loaded");
setupCommitIntercept();
attachRouteObserver(tickWalmart);
