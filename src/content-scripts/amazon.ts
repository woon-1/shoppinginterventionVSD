// Amazon content script.
//
// Two responsibilities:
//   1. Inject the "Add to Wishlist" button on product pages (route observer).
//   2. Intercept the user's commit click — Proceed to Checkout, Place order,
//      Buy Now — and mount the multi-step intervention BEFORE the navigation
//      happens. After the user picks Continue, replay the original click so
//      Amazon's own checkout flow proceeds untouched.
//
// We deliberately don't mount on cart-page load anymore — viewing the cart
// isn't a commitment to buy. Friction belongs at the moment of decision.

import {
  attachRouteObserver,
  extractCurrency,
  extractPrice,
  injectButton,
  injectReflectionPrompt,
  loadExtensionState,
  ProductData,
} from "./utils";
import { detectCartCheckoutContext } from "./cart-detection";
import { extractAmazonCartDataWithRetry } from "@/lib/amazon-cart-data";
import { mountAmazonInterventionSteps } from "./amazon-intervention-steps";

/* ---------- Product page: wishlist button ---------- */

function extractAmazonProduct(): ProductData | null {
  try {
    const nameEl = document.querySelector("h1 span");
    const name = nameEl?.textContent?.trim();
    if (!name) return null;

    let priceEl: Element | null = document.querySelector(
      ".a-price-whole, [data-a-color='price'], .a-price"
    );
    let priceText = priceEl?.textContent?.trim() || "";

    if (!priceText) {
      const allPrices = document.querySelectorAll(".a-price-whole");
      if (allPrices.length > 0) {
        priceText = allPrices[0].textContent?.trim() || "";
      }
    }

    const price = extractPrice(priceText);
    const currency = extractCurrency(priceText);

    const imageEl = document.querySelector(
      "div.imageBlock img, img[alt*=product], [data-old-hires]"
    ) as HTMLImageElement;
    const imageUrl = imageEl?.src || imageEl?.getAttribute("data-old-hires");

    const url = window.location.href;

    return {
      name,
      price,
      currency,
      url,
      imageUrl: imageUrl || undefined,
    };
  } catch (error) {
    console.error("[Pause] Error extracting Amazon product:", error);
    return null;
  }
}

function initAmazonWishlistButton() {
  try {
    let container = document.querySelector(
      "#dp-container, [data-feature-name='dp-atc-region'], .a-spacing-base"
    ) as HTMLElement;

    if (!container) {
      const titleSection = document.querySelector("h1");
      if (titleSection?.parentElement) {
        container = titleSection.parentElement;
      } else {
        return;
      }
    }

    injectButton(container, "amazon", extractAmazonProduct);
    void injectReflectionPrompt("amazon", extractAmazonProduct);
  } catch (error) {
    console.error("[Pause] Error initializing Amazon wishlist button:", error);
  }
}

function tickAmazon(): boolean {
  const ctx = detectCartCheckoutContext("amazon", window.location.href);
  // On cart/checkout pages we don't render anything until the user clicks
  // a commit button — settle the route observer and let the click intercept
  // do its job.
  if (ctx.active) return true;
  if (!document.querySelector("[data-pause-wishlist-button]")) {
    initAmazonWishlistButton();
  }
  return Boolean(document.querySelector("[data-pause-wishlist-button]"));
}

/* ---------- Commit click intercept ---------- */

/**
 * Selectors that represent a user's commit-to-buy click on Amazon. Cart
 * "Proceed to Checkout", checkout "Place your order", and product-page
 * "Buy Now". We `closest()` against these because Amazon nests text/spans
 * inside the actual button.
 */
const COMMIT_SELECTORS = [
  '[name="proceedToCheckout"]',
  '#sc-buy-box-ptc-button',
  '[data-feature-id="proceed-to-checkout-action"] input[type="submit"]',
  '[name="placeYourOrder1"]',
  '#submitOrderButtonId',
  '[name="submit.buy-now"]',
  '#buy-now-button',
];

function findCommitButton(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  for (const sel of COMMIT_SELECTORS) {
    const match = target.closest(sel);
    if (match) return match as HTMLElement;
  }
  return null;
}

async function mountInterventionForCommit(button: HTMLElement) {
  if (document.querySelector("[data-pause-intervention]")) return;

  const resume = () => {
    // Programmatic .click() fires with isTrusted=false, so our listener will
    // skip it and Amazon's natural form submit / navigation runs.
    button.click();
  };

  try {
    const cartData = await extractAmazonCartDataWithRetry();
    const state = await loadExtensionState();
    const friction = state?.config?.friction || "standard";
    const savingsGoal =
      state?.config?.savingsGoal && state?.savings
        ? {
            amount: state.config.savingsGoal.amount,
            label: state.config.savingsGoal.label,
            saved: state.savings.totalSaved,
          }
        : null;

    void mountAmazonInterventionSteps(cartData, friction, savingsGoal, resume);
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
      if (!button) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      void mountInterventionForCommit(button);
    },
    true // capture phase: catch before Amazon's own listeners
  );
}

/* ---------- Entry ---------- */

setupCommitIntercept();
attachRouteObserver(tickAmazon);
