// Etsy content script
// Runs on etsy.com product pages to extract product data and inject wishlist button

import {
  extractCurrency,
  extractPrice,
  injectButton,
  injectReflectionPrompt,
  ProductData,
} from "./utils";

function extractEtsyProduct(): ProductData | null {
  try {
    // Product name
    const nameEl = document.querySelector(
      "h1, [data-section='title'], .wt-text-title-large"
    );
    const name = nameEl?.textContent?.trim();
    if (!name) return null;

    // Price - Etsy shows price in various formats
    let priceEl: Element | null = document.querySelector(
      ".wt-text-title-large, [data-qa='product-price'], .price"
    );
    let priceText = priceEl?.textContent?.trim() || "";

    // Alternative price selectors
    if (!priceText) {
      const allPrices = document.querySelectorAll(
        "span[data-qa*='price'], .wt-price"
      );
      if (allPrices.length > 0) {
        priceText = allPrices[0].textContent?.trim() || "";
      }
    }

    const price = extractPrice(priceText);
    const currency = extractCurrency(priceText);

    // Image URL
    const imageEl = document.querySelector(
      "img[alt*='product'], .wt-image-container img, [role='img']"
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
    console.error("[Pause] Error extracting Etsy product:", error);
    return null;
  }
}

function initEtsyWishlistButton() {
  try {
    // Find the button container (usually near Add to Cart button)
    let container = document.querySelector(
      "[data-section='product'], .wt-grid-item, [data-qa='product-form']"
    ) as HTMLElement;

    if (!container) {
      const priceSection = document.querySelector("[data-qa*='price']");
      if (priceSection?.parentElement) {
        container = priceSection.parentElement;
      } else {
        return;
      }
    }

    injectButton(container, "etsy", extractEtsyProduct);
    void injectReflectionPrompt("etsy", extractEtsyProduct);
  } catch (error) {
    console.error("[Pause] Error initializing Etsy wishlist button:", error);
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEtsyWishlistButton);
} else {
  initEtsyWishlistButton();
}

// Also try to initialize on dynamic content changes
const observer = new MutationObserver(() => {
  if (!document.querySelector("[data-pause-wishlist-button]")) {
    initEtsyWishlistButton();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
