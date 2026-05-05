"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AppState,
  CartLine,
  CoolingOffEntry,
  DEFAULT_STATE,
  Necessity,
  PurchaseRecord,
  STORAGE_KEY,
  normalizeAppState,
  UserConfig,
  WishlistItem,
} from "@/lib/types";
import { loadState, saveState, wipeState } from "@/lib/storage";
import { getCatalogItem } from "@/lib/catalog";
import { isItemEssential } from "@/lib/intervention";
import { uuid } from "@/lib/uuid";
import { dayKey } from "@/lib/format";

const COOLING_OFF_24H_MS = 24 * 60 * 60 * 1000;
const COOLING_OFF_DEMO_MS = 60 * 1000;

export function coolingOffDuration(demoMode: boolean): number {
  return demoMode ? COOLING_OFF_DEMO_MS : COOLING_OFF_24H_MS;
}

interface AppStateContextValue {
  state: AppState;
  hydrated: boolean;
  setConfig: (config: UserConfig) => void;
  updateConfig: (patch: Partial<UserConfig>) => void;
  addToCart: (itemId: string, qty?: number) => void;
  removeFromCart: (itemId: string) => void;
  setCartQty: (itemId: string, qty: number) => void;
  clearCart: () => void;
  purchaseCart: (
    cart: CartLine[],
    necessityMix: Partial<Record<Necessity, number>>,
    bypassedFriction: boolean
  ) => void;
  saveForLater: (
    cart: CartLine[],
    necessityTag: Necessity
  ) => void;
  buyCoolingOffEntry: (entryId: string) => void;
  cancelCoolingOffEntry: (entryId: string) => void;
  resolveExpiredCoolingOff: () => void;
  fastForwardCoolingOff: () => void;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  getWishlistByWebsite: (website: WishlistItem["website"]) => WishlistItem[];
  clearWishlist: () => void;
  wipe: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === "undefined") return DEFAULT_STATE;
    return loadState();
  });
  // Client: ready on first paint so extension UI is not stuck behind an effect tick.
  const [hydrated, setHydrated] = useState(
    () => typeof window !== "undefined"
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  // Re-read storage after mount; merge Chrome extension storage when present.
  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    if (typeof window !== "undefined") {
      setHydrated(true);
    }

    let cancelled = false;

    const syncFromChromeStorage = async () => {
      if (typeof chrome === "undefined" || !chrome.storage?.local) return;
      try {
        const data = await chrome.storage.local.get(STORAGE_KEY);
        const extensionState = data[STORAGE_KEY] as AppState | undefined;
        if (!cancelled && extensionState?.schemaVersion === 1) {
          setState(normalizeAppState(extensionState));
        }
      } catch {
        // Ignore storage sync failures outside the extension runtime.
      }
    };

    void syncFromChromeStorage();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist to both localStorage and extension storage after hydration.
  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      void chrome.storage.local.set({ [STORAGE_KEY]: state });
    }
  }, [state, hydrated]);

  const setConfig = useCallback((config: UserConfig) => {
    setState((s) => ({ ...s, config }));
  }, []);

  const updateConfig = useCallback((patch: Partial<UserConfig>) => {
    setState((s) =>
      s.config ? { ...s, config: { ...s.config, ...patch } } : s
    );
  }, []);

  const addToCart = useCallback((itemId: string, qty: number = 1) => {
    setState((s) => {
      const existing = s.cart.find((l) => l.itemId === itemId);
      if (existing) {
        return {
          ...s,
          cart: s.cart.map((l) =>
            l.itemId === itemId ? { ...l, qty: l.qty + qty } : l
          ),
        };
      }
      return { ...s, cart: [...s.cart, { itemId, qty }] };
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setState((s) => ({
      ...s,
      cart: s.cart.filter((l) => l.itemId !== itemId),
    }));
  }, []);

  const setCartQty = useCallback((itemId: string, qty: number) => {
    setState((s) => {
      if (qty <= 0)
        return { ...s, cart: s.cart.filter((l) => l.itemId !== itemId) };
      return {
        ...s,
        cart: s.cart.map((l) => (l.itemId === itemId ? { ...l, qty } : l)),
      };
    });
  }, []);

  const clearCart = useCallback(() => {
    setState((s) => ({ ...s, cart: [] }));
  }, []);

  const purchaseCart = useCallback(
    (
      cart: CartLine[],
      necessityMix: Partial<Record<Necessity, number>>,
      bypassedFriction: boolean
    ) => {
      const items = cart
        .map((l) => {
          const item = getCatalogItem(l.itemId);
          if (!item) return null;
          return { itemId: l.itemId, qty: l.qty, price: item.price };
        })
        .filter(Boolean) as PurchaseRecord["items"];
      const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
      const record: PurchaseRecord = {
        id: uuid(),
        items,
        total,
        necessityMix,
        purchasedAt: Date.now(),
        bypassedFriction,
      };
      setState((s) => ({
        ...s,
        cart: [],
        purchases: [...s.purchases, record],
      }));
    },
    []
  );

  const saveForLater = useCallback(
    (cart: CartLine[], necessityTag: Necessity) => {
      const now = Date.now();
      setState((s) => {
        if (!s.config) return s;
        const duration = coolingOffDuration(s.config.demoMode);
        const newEntries: CoolingOffEntry[] = [];
        const remainingCart: CartLine[] = [];
        for (const line of cart) {
          const item = getCatalogItem(line.itemId);
          if (!item) continue;
          if (isItemEssential(item.id, s.config)) {
            // essentials stay in the cart so the user can complete them separately
            remainingCart.push(line);
            continue;
          }
          newEntries.push({
            id: uuid(),
            itemId: line.itemId,
            qty: line.qty,
            totalPrice: item.price * line.qty,
            necessityTag,
            addedAt: now,
            expiresAt: now + duration,
            status: "pending",
          });
        }
        return {
          ...s,
          cart: remainingCart,
          coolingOff: [...s.coolingOff, ...newEntries],
        };
      });
    },
    []
  );

  const buyCoolingOffEntry = useCallback((entryId: string) => {
    setState((s) => {
      const entry = s.coolingOff.find((e) => e.id === entryId);
      if (!entry || entry.status !== "pending") return s;
      const item = getCatalogItem(entry.itemId);
      if (!item) return s;
      const record: PurchaseRecord = {
        id: uuid(),
        items: [{ itemId: entry.itemId, qty: entry.qty, price: item.price }],
        total: entry.totalPrice,
        necessityMix: { [entry.necessityTag]: 1 },
        purchasedAt: Date.now(),
        bypassedFriction: false,
      };
      return {
        ...s,
        coolingOff: s.coolingOff.map((e) =>
          e.id === entryId ? { ...e, status: "purchased" } : e
        ),
        purchases: [...s.purchases, record],
        savings: { ...s.savings, currentSkipStreak: 0 },
      };
    });
  }, []);

  const cancelCoolingOffEntry = useCallback((entryId: string) => {
    setState((s) => ({
      ...s,
      coolingOff: s.coolingOff.map((e) =>
        e.id === entryId && e.status === "pending"
          ? { ...e, status: "cancelled" }
          : e
      ),
    }));
  }, []);

  const resolveExpiredCoolingOff = useCallback(() => {
    const now = Date.now();
    setState((s) => {
      let changed = false;
      const newSavings = { ...s.savings, byDay: { ...s.savings.byDay } };
      const newCoolingOff = s.coolingOff.map((entry) => {
        if (entry.status !== "pending") return entry;
        if (now < entry.expiresAt) return entry;
        changed = true;
        newSavings.totalSaved += entry.totalPrice;
        newSavings.currentSkipStreak += 1;
        if (newSavings.currentSkipStreak > newSavings.longestSkipStreak) {
          newSavings.longestSkipStreak = newSavings.currentSkipStreak;
        }
        const k = dayKey(entry.expiresAt);
        newSavings.byDay[k] = (newSavings.byDay[k] ?? 0) + entry.totalPrice;
        return { ...entry, status: "expired-saved" as const };
      });
      if (!changed) return s;
      return { ...s, coolingOff: newCoolingOff, savings: newSavings };
    });
  }, []);

  const fastForwardCoolingOff = useCallback(() => {
    const now = Date.now();
    setState((s) => ({
      ...s,
      coolingOff: s.coolingOff.map((e) =>
        e.status === "pending" ? { ...e, expiresAt: now - 1 } : e
      ),
    }));
    // resolveExpiredCoolingOff will be called by the ticker on next tick
  }, []);

  const addToWishlist = useCallback((item: WishlistItem) => {
    setState((s) => ({
      ...s,
      wishlist: [...s.wishlist, item],
    }));
  }, []);

  const removeFromWishlist = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      wishlist: s.wishlist.filter((w) => w.id !== id),
    }));
  }, []);

  const getWishlistByWebsite = useCallback(
    (website: WishlistItem["website"]) => {
      return stateRef.current.wishlist.filter((w) => w.website === website);
    },
    []
  );

  const clearWishlist = useCallback(() => {
    setState((s) => ({
      ...s,
      wishlist: [],
    }));
  }, []);

  const wipe = useCallback(() => {
    wipeState();
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      void chrome.storage.local.remove(STORAGE_KEY);
    }
    setState(DEFAULT_STATE);
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      hydrated,
      setConfig,
      updateConfig,
      addToCart,
      removeFromCart,
      setCartQty,
      clearCart,
      purchaseCart,
      saveForLater,
      buyCoolingOffEntry,
      cancelCoolingOffEntry,
      resolveExpiredCoolingOff,
      fastForwardCoolingOff,
      addToWishlist,
      removeFromWishlist,
      getWishlistByWebsite,
      clearWishlist,
      wipe,
    }),
    [
      state,
      hydrated,
      setConfig,
      updateConfig,
      addToCart,
      removeFromCart,
      setCartQty,
      clearCart,
      purchaseCart,
      saveForLater,
      buyCoolingOffEntry,
      cancelCoolingOffEntry,
      resolveExpiredCoolingOff,
      fastForwardCoolingOff,
      addToWishlist,
      removeFromWishlist,
      getWishlistByWebsite,
      clearWishlist,
      wipe,
    ]
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx)
    throw new Error("useAppState must be used inside <AppStateProvider>");
  return ctx;
}
