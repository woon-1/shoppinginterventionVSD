// eBay content script
// Runs on ebay.com product pages to extract product data and inject wishlist button

import {
  attachRouteObserver,
  extractCurrency,
  extractPrice,
  injectButton,
  injectReflectionPrompt,
  ProductData,
} from "./utils";
import { detectCartCheckoutContext } from "./cart-detection";
import { mountCartIntervention } from "./cart-intervention-ui";

function extractEbayProduct(): ProductData | null {
  try {
    // Product name
    const nameEl = document.querySelector("h1.it-title, h1[class*='title']");
    const name = nameEl?.textContent?.trim();
    if (!name) return null;

    // Price - eBay displays price in various formats
    let priceEl: Element | null = document.querySelector(
      ".vi-VR-cvipPrice, [itemprop='price'], .notranslate.vi-VR-cvipPrice"
    );
    let priceText = priceEl?.textContent?.trim() || "";

    // Alternative price selectors
    if (!priceText) {
      const allPrices = document.querySelectorAll(
        ".vi-VR-cvipPrice, [data-testid*='price']"
      );
      if (allPrices.length > 0) {
        priceText = allPrices[0].textContent?.trim() || "";
      }
    }

    const price = extractPrice(priceText);
    const currency = extractCurrency(priceText);

    // Image URL
    const imageEl = document.querySelector(
      "#vi_main img, .vi-content img, img[role='presentation']"
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
    console.error("[Pause] Error extracting eBay product:", error);
    return null;
  }
}

function initEbayWishlistButton() {
  try {
    // Find the button container (usually near Add to Cart button)
    let container = document.querySelector(
      ".vi-content-panels, #vi_main, [role='main']"
    ) as HTMLElement;

    if (!container) {
      const priceSection = document.querySelector(".vi-VR-cvipPrice");
      if (priceSection?.parentElement) {
        container = priceSection.parentElement;
      } else {
        return;
      }
    }

    injectButton(container, "ebay", extractEbayProduct);
    void injectReflectionPrompt("ebay", extractEbayProduct);
  } catch (error) {
    console.error("[Pause] Error initializing eBay wishlist button:", error);
  }
}

function tickEbay(): boolean {
  const ctx = detectCartCheckoutContext("ebay", window.location.href);
  if (ctx.active) {
    if (document.querySelector("[data-pause-cart-host]")) return true;
    void mountCartIntervention("ebay", ctx.kind);
    return false;
  }
  if (!document.querySelector("[data-pause-wishlist-button]")) {
    initEbayWishlistButton();
  }
  return Boolean(document.querySelector("[data-pause-wishlist-button]"));
}

attachRouteObserver(tickEbay);
