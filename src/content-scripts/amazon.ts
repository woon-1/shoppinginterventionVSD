// Amazon content script
// Runs on amazon.com product pages to extract product data and inject wishlist button

import {
  extractCurrency,
  extractPrice,
  injectButton,
  injectReflectionPrompt,
  ProductData,
} from "./utils";
import { detectCartCheckoutContext } from "./cart-detection";
import { mountCartIntervention } from "./cart-intervention-ui";
import { extractAmazonCartDataWithRetry } from "@/lib/amazon-cart-data";
import { mountAmazonInterventionSteps } from "./amazon-intervention-steps";
import { loadExtensionState } from "./utils";

function extractAmazonProduct(): ProductData | null {
  try {
    // Product name
    const nameEl = document.querySelector("h1 span");
    const name = nameEl?.textContent?.trim();
    if (!name) return null;

    // Price - Amazon uses various selectors
    let priceEl: Element | null = document.querySelector(
      ".a-price-whole, [data-a-color='price'], .a-price"
    );
    let priceText = priceEl?.textContent?.trim() || "";

    // If price not found, try alternative selectors
    if (!priceText) {
      const allPrices = document.querySelectorAll(".a-price-whole");
      if (allPrices.length > 0) {
        priceText = allPrices[0].textContent?.trim() || "";
      }
    }

    const price = extractPrice(priceText);
    const currency = extractCurrency(priceText);

    // Image URL
    const imageEl = document.querySelector(
      "div.imageBlock img, img[alt*=product], [data-old-hires]"
    ) as HTMLImageElement;
    const imageUrl = imageEl?.src || imageEl?.getAttribute("data-old-hires");

    // URL
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
    // Find the button container (usually near Add to Cart button)
    let container = document.querySelector(
      "#dp-container, [data-feature-name='dp-atc-region'], .a-spacing-base"
    ) as HTMLElement;

    // If not found, create a container below the title
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

function routeAmazonFeatures() {
  const ctx = detectCartCheckoutContext("amazon", window.location.href);
  if (ctx.active) {
    // Cart/checkout page: use multi-step intervention with cart data
    if (!document.querySelector("[data-pause-intervention]")) {
      // Extract cart data and load user state
      void (async () => {
        try {
          const cartData = await extractAmazonCartDataWithRetry();
          const state = await loadExtensionState();
          const friction = state?.config?.friction || "standard";
          const savingsGoal = state?.config?.savingsGoal && state?.savings ? {
            amount: state.config.savingsGoal.amount,
            label: state.config.savingsGoal.label,
            saved: state.savings.totalSaved,
          } : null;

          console.log('[Pause] cart data and state loaded', { cartData, friction, savingsGoal });
          void mountAmazonInterventionSteps(cartData, friction, savingsGoal);
        } catch (err) {
          console.warn('[Pause] failed to load cart intervention', err);
          // Fallback to simple intervention if multi-step fails
          void mountCartIntervention("amazon", ctx.kind);
        }
      })();
    }
    return;
  }
  initAmazonWishlistButton();
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", routeAmazonFeatures);
} else {
  routeAmazonFeatures();
}

// Also try to initialize on dynamic content changes
const observer = new MutationObserver(() => {
  const ctx = detectCartCheckoutContext("amazon", window.location.href);
  if (ctx.active) {
    if (!document.querySelector("[data-pause-intervention], [data-pause-cart-host]")) {
      // Trigger multi-step intervention
      void (async () => {
        try {
          const cartData = await extractAmazonCartDataWithRetry();
          const state = await loadExtensionState();
          const friction = state?.config?.friction || "standard";
          const savingsGoal = state?.config?.savingsGoal && state?.savings ? {
            amount: state.config.savingsGoal.amount,
            label: state.config.savingsGoal.label,
            saved: state.savings.totalSaved,
          } : null;
          void mountAmazonInterventionSteps(cartData, friction, savingsGoal);
        } catch (err) {
          void mountCartIntervention("amazon", ctx.kind);
        }
      })();
    }
    return;
  }
  if (!document.querySelector("[data-pause-wishlist-button]")) {
    initAmazonWishlistButton();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
