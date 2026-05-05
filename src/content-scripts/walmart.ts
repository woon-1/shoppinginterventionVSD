// Walmart content script
// Runs on walmart.com product pages to extract product data and inject wishlist button

import {
  extractCurrency,
  extractPrice,
  injectButton,
  injectReflectionPrompt,
  ProductData,
} from "./utils";
import { detectCartCheckoutContext } from "./cart-detection";
import { mountCartIntervention } from "./cart-intervention-ui";

function extractWalmartProduct(): ProductData | null {
  try {
    // Product name
    const nameEl = document.querySelector(
      "h1, [data-testid='product-title'], .product-name"
    );
    const name = nameEl?.textContent?.trim();
    if (!name) return null;

    // Price - Walmart shows price prominently
    let priceEl: Element | null = document.querySelector(
      "[data-testid='product-price'], .price, [class*='Price']"
    );
    let priceText = priceEl?.textContent?.trim() || "";

    // Alternative price selectors
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

    // Image URL
    const imageEl = document.querySelector(
      "img[alt*='product'], [role='img'] img, .product-image img"
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
    console.error("[Pause] Error extracting Walmart product:", error);
    return null;
  }
}

function initWalmartWishlistButton() {
  try {
    // Find the button container (usually near Add to Cart button)
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

function routeWalmartFeatures() {
  const ctx = detectCartCheckoutContext("walmart", window.location.href);
  if (ctx.active) {
    if (!document.querySelector("[data-pause-cart-host]")) {
      void mountCartIntervention("walmart", ctx.kind);
    }
    return;
  }
  initWalmartWishlistButton();
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", routeWalmartFeatures);
} else {
  routeWalmartFeatures();
}

// Also try to initialize on dynamic content changes
const observer = new MutationObserver(() => {
  const ctx = detectCartCheckoutContext("walmart", window.location.href);
  if (ctx.active) {
    if (!document.querySelector("[data-pause-cart-host]")) {
      void mountCartIntervention("walmart", ctx.kind);
    }
    return;
  }
  if (!document.querySelector("[data-pause-wishlist-button]")) {
    initWalmartWishlistButton();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
