// Background service worker
// Listens for messages from content scripts, manages wishlist updates,
// and opens the appropriate extension surface when the icon is clicked.

import { AppState, DEFAULT_STATE, STORAGE_KEY, WishlistItem } from "@/lib/types";

interface AddToWishlistRequest {
  action: "addToWishlist";
  data: {
    name: string;
    price: number;
    currency: string;
    url: string;
    imageUrl?: string;
  };
  website: WishlistItem["website"];
}

interface AddToWishlistResponse {
  success: boolean;
  error?: string;
  item?: WishlistItem;
}

async function getStoredState(): Promise<AppState> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const storedState = data[STORAGE_KEY] as AppState | undefined;

  if (!storedState || storedState.schemaVersion !== 1) {
    return DEFAULT_STATE;
  }

  return {
    ...DEFAULT_STATE,
    ...storedState,
    wishlist: storedState.wishlist ?? [],
  };
}

async function saveStoredState(state: AppState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

function openExtensionSurface(page: string) {
  chrome.tabs.create({ url: chrome.runtime.getURL(page) });
}

async function handleExtensionClick() {
  const state = await getStoredState();
  const page = state.config?.onboardingComplete ? "popup.html" : "setup.html";
  openExtensionSurface(page);
}

chrome.action.onClicked.addListener(() => {
  void handleExtensionClick();
});

chrome.runtime.onMessage.addListener(
  (
    request: AddToWishlistRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: AddToWishlistResponse) => void
  ) => {
    if (request.action === "addToWishlist") {
      void handleAddToWishlist(request, sender, sendResponse);
      return true;
    }
  }
);

async function handleAddToWishlist(
  request: AddToWishlistRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: AddToWishlistResponse) => void
) {
  try {
    const state = await getStoredState();
    const duplicate = state.wishlist.find((w: WishlistItem) => w.url === request.data.url);

    if (duplicate) {
      sendResponse({
        success: false,
        error: "Item already in wishlist",
      });
      return;
    }

    const wishlistItem: WishlistItem = {
      id: `${request.website}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: request.data.name,
      price: request.data.price,
      currency: request.data.currency,
      website: request.website,
      url: request.data.url,
      imageUrl: request.data.imageUrl,
      addedAt: Date.now(),
    };

    state.wishlist = [...state.wishlist, wishlistItem];
    await saveStoredState(state);

    chrome.runtime.sendMessage(
      {
        action: "wishlistUpdated",
        item: wishlistItem,
      },
      () => {
        chrome.runtime.lastError;
      }
    );

    sendResponse({
      success: true,
      item: wishlistItem,
    });
  } catch (error) {
    console.error("[Pause] Error adding to wishlist:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

console.log("[Pause] Service worker loaded");
