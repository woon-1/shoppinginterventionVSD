import type { WishlistItem } from "@/lib/types";
import { debounce } from "lodash";

export type CartCheckoutKind = "cart" | "checkout";

export interface CartCheckoutContext {
  active: boolean;
  kind: CartCheckoutKind;
}

/**
 * Detect cart / checkout URLs for supported retailers.
 * Conservative: prefer explicit paths so product pages are never mistaken for cart.
 */
export function detectCartCheckoutContext(
  website: WishlistItem["website"],
  href: string
): CartCheckoutContext {
  try {
    const u = new URL(href);
    const path = u.pathname.toLowerCase();
    const search = u.search.toLowerCase();

    switch (website) {
      case "amazon": {
        const checkout =
          path.includes("/checkout/") ||
          path.includes("/gp/buy/spc/") ||
          path.includes("/buy/checkout") ||
          path.includes("/payment/checkout");
        const cart =
          path.includes("/gp/cart") ||
          path.includes("/cart/view") ||
          path.includes("smart-wagon") ||
          path === "/cart" ||
          path.startsWith("/cart/") ||
          path.startsWith("/gp/cart/") ||
          search.includes("ref_=nav_cart");
        if (checkout) return { active: true, kind: "checkout" };
        if (cart) return { active: true, kind: "cart" };
        break;
      }
      case "ebay": {
        const checkout =
          path.includes("/chk/") ||
          path.includes("/checkout/") ||
          path.includes("/pay/") ||
          path.includes("/pay/order");
        const cart =
          path.includes("/shoppingcart") ||
          path.includes("/cart") ||
          path.includes("/sc/view");
        if (checkout) return { active: true, kind: "checkout" };
        if (cart) return { active: true, kind: "cart" };
        break;
      }
      case "etsy": {
        const checkout =
          path.includes("/checkout") ||
          path.includes("/guest-checkout") ||
          path.includes("/payment/");
        const cart = path.includes("/cart");
        if (checkout) return { active: true, kind: "checkout" };
        if (cart) return { active: true, kind: "cart" };
        break;
      }
      case "target": {
        const checkout =
          path.includes("/cart") ||
          path.includes("/co-delivery") ||
          path.includes("/co-cart") ||
          path.includes("/co-shipping") ||
          path.includes("/co-payment");
        const cart = path.includes("/cart");
        if (checkout) return { active: true, kind: "checkout" };
        if (cart) return { active: true, kind: "cart" };
        break;
      }
      case "walmart": {
        const checkout =
          path.includes("/checkout") ||
          path.includes("/process-order") ||
          path.includes("/payment/");
        const cart = path.includes("/cart") || path.includes("/shopping-cart");
        if (checkout) return { active: true, kind: "checkout" };
        if (cart) return { active: true, kind: "cart" };
        break;
      }
      default:
        break;
    }
  } catch {
    return { active: false, kind: "cart" };
  }

  return { active: false, kind: "cart" };
}

// Enhanced detection for Amazon buttons
function detectAmazonButtons(): boolean {
  const checkoutButton = document.querySelector(
    "[name='proceedToCheckout'], .a-button-input, [aria-label*='Proceed to checkout'], [data-testid='checkout-button']"
  );
  const buyNowButton = document.querySelector(
    "[name='buyNow'], [aria-label*='Buy now'], [data-testid='buy-now-button']"
  );
  return Boolean(checkoutButton || buyNowButton);
}

// Debounced observer for dynamic content
const observeDynamicContent = debounce(() => {
  if (detectAmazonButtons()) {
    console.log("Amazon checkout button detected.");
    // Trigger intervention logic here
  }
}, 300);

export function enhancedDetectCartCheckoutContext(
  website: WishlistItem["website"],
  href: string
): CartCheckoutContext {
  const baseContext = detectCartCheckoutContext(website, href);

  if (website === "amazon") {
    // Observe dynamic content for Amazon
    const observer = new MutationObserver(() => {
      observeDynamicContent();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  return baseContext;
}
