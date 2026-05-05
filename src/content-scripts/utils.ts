// Shared utilities for content scripts

import {
  AppState,
  FrictionLevel,
  STORAGE_KEY,
  WishlistItem,
  normalizeAppState,
} from "@/lib/types";

export interface ProductData {
  name: string;
  price: number;
  currency: string;
  url: string;
  imageUrl?: string;
}

export function generateWishlistItem(
  data: ProductData,
  website: WishlistItem["website"]
): WishlistItem {
  return {
    id: `${website}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: data.name,
    price: data.price,
    currency: data.currency,
    website,
    url: data.url,
    imageUrl: data.imageUrl,
    addedAt: Date.now(),
  };
}

export function extractCurrency(priceText: string): string {
  if (priceText.includes("$")) return "USD";
  if (priceText.includes("€")) return "EUR";
  if (priceText.includes("£")) return "GBP";
  if (priceText.includes("¥")) return "JPY";
  return "USD";
}

export function extractPrice(priceText: string): number {
  const match = priceText.match(/[\d,]+\.?\d*/);
  if (!match) return 0;
  return parseFloat(match[0].replace(/,/g, ""));
}

function getReflectionCopy(
  friction: FrictionLevel,
  website: WishlistItem["website"],
  product: ProductData | null
) {
  const productLabel = product?.name ? `“${product.name}”` : "this item";

  if (friction === "light") {
    return {
      eyebrow: "Light friction",
      title: `Pause for 5 seconds before ${productLabel}`,
      body: `A short pause helps you decide if ${productLabel} still feels worth it on ${website}.`,
    };
  }

  if (friction === "strict") {
    return {
      eyebrow: "Strict friction",
      title: `Stop and reflect on ${productLabel}`,
      body: `Strict mode adds a stronger pause: check whether ${productLabel} belongs in essentials, wishlist, or neither.`,
    };
  }

  return {
    eyebrow: "Standard friction",
    title: `Is ${productLabel} a need, a want, or a maybe?`,
    body: `Standard mode asks for a quick reflection before you continue on ${website}.`,
  };
}

/** Shared by wishlist flow and cart/checkout intervention. */
export async function loadExtensionState(): Promise<AppState | null> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return null;

  try {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const state = data[STORAGE_KEY] as AppState | undefined;
    if (!state || state.schemaVersion !== 1) return null;
    return normalizeAppState(state);
  } catch {
    return null;
  }
}

export async function injectReflectionPrompt(
  website: WishlistItem["website"],
  getProduct: () => ProductData | null
) {
  if (typeof document === "undefined" || !document.body) return;
  if (document.querySelector("[data-pause-reflection]")) return;

  const state = await loadExtensionState();
  const friction = state?.config?.friction ?? "standard";
  const copy = getReflectionCopy(friction, website, getProduct());

  const prompt = document.createElement("section");
  prompt.setAttribute("data-pause-reflection", "true");
  prompt.setAttribute("aria-label", "Pause reflection prompt");
  prompt.style.cssText = `
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 2147483647;
    width: min(360px, calc(100vw - 40px));
    border: 1px solid rgba(10, 10, 10, 0.14);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
    color: #0a0a0a;
    padding: 14px;
    font-family: var(--font-geist-sans, ui-sans-serif, system-ui, sans-serif);
  `;

  prompt.innerHTML = `
    <div style="display:flex;align-items:start;justify-content:space-between;gap:12px;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#71717a;">${copy.eyebrow}</div>
        <div style="margin-top:6px;font-size:14px;font-weight:700;line-height:1.35;">${copy.title}</div>
        <div style="margin-top:8px;font-size:12px;line-height:1.5;color:#525252;">${copy.body}</div>
      </div>
      <button type="button" data-pause-dismiss style="border:none;background:transparent;color:#525252;font-size:18px;line-height:1;cursor:pointer;padding:0 2px;">×</button>
    </div>
  `;

  const dismissButton = prompt.querySelector("[data-pause-dismiss]");
  dismissButton?.addEventListener("click", () => {
    prompt.remove();
  });

  document.body.appendChild(prompt);
}

export function injectButton(
  container: HTMLElement,
  website: WishlistItem["website"],
  onExtractProduct: () => ProductData | null
) {
  if (container.querySelector("[data-pause-wishlist-button]")) {
    return;
  }

  const button = document.createElement("button");
  button.setAttribute("data-pause-wishlist-button", website);
  button.textContent = "Add to Wishlist";
  button.style.cssText = `
    position: relative;
    z-index: 2147483646;
    isolation: isolate;
    pointer-events: auto;
    padding: 10px 16px;
    margin: 8px 0;
    background-color: #111827;
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
    font-size: 14px;
    line-height: 1.1;
    transition: transform 0.15s ease, background-color 0.2s ease;
  `;

  button.addEventListener("mouseover", () => {
    button.style.backgroundColor = "#0b1220";
    button.style.transform = "translateY(-1px)";
  });

  button.addEventListener("mouseout", () => {
    button.style.backgroundColor = "#111827";
    button.style.transform = "translateY(0)";
  });

  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const product = onExtractProduct();
    if (!product) {
      alert("Could not extract product data. Please try again.");
      return;
    }

    chrome.runtime.sendMessage(
      {
        action: "addToWishlist",
        data: product,
        website,
      },
      (response) => {
        if (response?.success) {
          button.textContent = "Added to Wishlist";
          button.style.backgroundColor = "#16a34a";
          setTimeout(() => {
            button.textContent = "Add to Wishlist";
            button.style.backgroundColor = "#111827";
          }, 1800);
        } else {
          alert(response?.error || "Failed to add to wishlist");
        }
      }
    );
  });

  container.appendChild(button);
}
