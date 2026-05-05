// Target content script
// Runs on target.com product pages to extract product data and inject wishlist button

import {
  extractCurrency,
  extractPrice,
  injectButton,
  injectReflectionPrompt,
  ProductData,
} from "./utils";
import { detectCartCheckoutContext } from "./cart-detection";
import { mountCartIntervention } from "./cart-intervention-ui";

function extractTargetProduct(): ProductData | null {
  try {
    // Product name
    const nameEl = document.querySelector(
      "h1, [data-test='product-title'], .h1"
    );
    const name = nameEl?.textContent?.trim();
    if (!name) return null;

    // Price - Target displays price prominently
    let priceEl: Element | null = document.querySelector(
      "[data-test='product-price'], .h2, [class*='price']"
    );
    let priceText = priceEl?.textContent?.trim() || "";

    // Alternative price selectors
    if (!priceText) {
      const allPrices = document.querySelectorAll(
        "span[aria-label*='Price'], [data-test*='price']"
      );
      if (allPrices.length > 0) {
        priceText = allPrices[0].textContent?.trim() || "";
      }
    }

    const price = extractPrice(priceText);
    const currency = extractCurrency(priceText);

    // Image URL
    const imageEl = document.querySelector(
      "img[alt*='Product'], [role='img'] img, .product-image img"
    ) as HTMLImageElement;
    const imageUrl = imageEl?.src;

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
    console.error("[Pause] Error extracting Target product:", error);
    return null;
  }
}

function initTargetWishlistButton() {
  try {
    // Find the button container (usually near Add to Cart button)
    let container = document.querySelector(
      "[data-test='product-actions'], [data-component='ProductActions'], main"
    ) as HTMLElement;

    if (!container) {
      const priceSection = document.querySelector("[data-test*='price']");
      if (priceSection?.parentElement) {
        container = priceSection.parentElement;
      } else {
        return;
      }
    }

    injectButton(container, "target", extractTargetProduct);
    void injectReflectionPrompt("target", extractTargetProduct);
  } catch (error) {
    console.error("[Pause] Error initializing Target wishlist button:", error);
  }
}

function routeTargetFeatures() {
  const ctx = detectCartCheckoutContext("target", window.location.href);
  if (ctx.active) {
    if (!document.querySelector("[data-pause-cart-host]")) {
      void mountCartIntervention("target", ctx.kind);
    }
    return;
  }
  initTargetWishlistButton();
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", routeTargetFeatures);
} else {
  routeTargetFeatures();
}

// Also try to initialize on dynamic content changes
const observer = new MutationObserver(() => {
  const ctx = detectCartCheckoutContext("target", window.location.href);
  if (ctx.active) {
    if (!document.querySelector("[data-pause-cart-host]")) {
      void mountCartIntervention("target", ctx.kind);
    }
    return;
  }
  if (!document.querySelector("[data-pause-wishlist-button]")) {
    initTargetWishlistButton();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
