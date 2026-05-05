// Background service worker
// Listens for messages from content scripts, manages wishlist updates,
// and opens the appropriate extension surface when the icon is clicked.

import {
  AppState,
  DEFAULT_STATE,
  FrictionLevel,
  STORAGE_KEY,
  normalizeAppState,
  WishlistItem,
  AmazonPauseSession,
} from "@/lib/types";
import {
  CART_INTERVENTION_STATS_KEY,
  normalizeStoredCartInterventionStats,
  updateCartInterventionStats,
  type CartInterventionPayload,
  type CartInterventionStats,
} from "@/lib/intervention-behavior";

const CART_EVENTS_KEY = "pause.cartInterventionEvents.v1";

interface RecordCartInterventionRequest {
  action: "recordCartIntervention";
  payload: CartInterventionPayload;
}

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

interface SaveAmazonPauseCartRequest {
  action: "saveAmazonPauseCart";
  payload: AmazonPauseSession;
}

interface AddToWishlistResponse {
  success: boolean;
  error?: string;
  item?: WishlistItem;
}

interface SaveAmazonPauseCartResponse {
  ok: boolean;
  error?: string;
}

async function getStoredState(): Promise<AppState> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const storedState = data[STORAGE_KEY] as AppState | undefined;

  return normalizeAppState(storedState ?? DEFAULT_STATE);
}

async function saveStoredState(state: AppState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

const INSTALL_META_KEY = "pause.installMeta.v1";

chrome.runtime.onInstalled.addListener((details) => {
  void chrome.storage.local.set({
    [INSTALL_META_KEY]: {
      installedAt: Date.now(),
      reason: details.reason,
    },
  });
});

chrome.runtime.onMessage.addListener(
  (
    request: AddToWishlistRequest | RecordCartInterventionRequest | SaveAmazonPauseCartRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: AddToWishlistResponse | SaveAmazonPauseCartResponse | { ok: boolean }) => void
  ) => {
    if (request.action === "addToWishlist") {
      void handleAddToWishlist(request, sender, sendResponse);
      return true;
    }
    if (request.action === "recordCartIntervention") {
      void appendCartInterventionEvent(request.payload, sender.tab?.id);
      sendResponse({ ok: true });
      return true;
    }
    if (request.action === "saveAmazonPauseCart") {
      void handleSaveAmazonPauseCart(request, sender, sendResponse);
      return true;
    }
  }
);

async function appendCartInterventionEvent(
  payload: CartInterventionPayload,
  tabId?: number
) {
  try {
    const data = await chrome.storage.local.get(CART_EVENTS_KEY);
    const prev = (data[CART_EVENTS_KEY] as unknown[]) ?? [];
    const next = [
      ...prev,
      { ...payload, at: Date.now(), tabId },
    ].slice(-40);
    await chrome.storage.local.set({ [CART_EVENTS_KEY]: next });

    const statsData = await chrome.storage.local.get(CART_INTERVENTION_STATS_KEY);
    const stats = normalizeStoredCartInterventionStats(
      statsData[CART_INTERVENTION_STATS_KEY] as CartInterventionStats | undefined
    );
    const nextStats = updateCartInterventionStats(stats, payload, Date.now());
    await chrome.storage.local.set({ [CART_INTERVENTION_STATS_KEY]: nextStats });
  } catch (e) {
    console.warn("[Pause] cart intervention log:", e);
  }
}

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
        void chrome.runtime.lastError;
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

async function handleSaveAmazonPauseCart(
  request: SaveAmazonPauseCartRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: SaveAmazonPauseCartResponse) => void
) {
  try {
    const state = await getStoredState();
    const nextSession: AmazonPauseSession = {
      ...request.payload,
      id: request.payload.id || `amazon-pause-${Date.now()}`,
    };

    state.amazonPauseSessions = [...(state.amazonPauseSessions ?? []), nextSession].slice(-20);
    await saveStoredState(state);

    const dashboardUrl = chrome.runtime.getURL("dashboard.html");
    const tabId = sender.tab?.id;
    try {
      if (typeof tabId === "number") {
        await chrome.tabs.update(tabId, { url: dashboardUrl });
      } else {
        await chrome.tabs.create({ url: dashboardUrl, active: true });
      }
    } catch {
      await chrome.tabs.create({ url: dashboardUrl, active: true });
    }

    sendResponse({ ok: true });
  } catch (error) {
    console.error("[Pause] Error saving Amazon pause session:", error);
    sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

console.log("[Pause] Service worker loaded");
