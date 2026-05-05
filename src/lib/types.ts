export type Period = "weekly" | "monthly";
export type FrictionLevel = "light" | "standard" | "strict";
export type Necessity = "need" | "want" | "unsure";
export type ItemCategory =
  | "groceries"
  | "hygiene"
  | "clothing"
  | "gadgets"
  | "decor";

export const ALL_CATEGORIES: ItemCategory[] = [
  "groceries",
  "hygiene",
  "clothing",
  "gadgets",
  "decor",
];

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  groceries: "Groceries",
  hygiene: "Hygiene",
  clothing: "Clothing",
  gadgets: "Gadgets",
  decor: "Decor",
};

export interface CatalogItem {
  id: string;
  name: string;
  price: number;
  category: ItemCategory;
  defaultEssential: boolean;
  imageId: string;
  emoji: string;
}

/** Optional VSD hooks for future personalization (friction tone, reminders). */
export interface InterventionPreferences {
  /** Display label for goal type, e.g. travel, emergency fund. */
  goalTypeLabel?: string;
  reminderFrequency?: "low" | "standard" | "high";
}

export interface UserConfig {
  budgetAmount: number;
  budgetPeriod: Period;
  essentialCategories: ItemCategory[];
  essentialItemOverrides: Record<string, boolean>;
  friction: FrictionLevel;
  savingsGoal?: { label: string; amount: number };
  demoMode: boolean;
  createdAt: number;
  onboardingComplete: boolean;
  interventionPreferences?: InterventionPreferences;
}

export interface CartLine {
  itemId: string;
  qty: number;
}

export type CoolingOffStatus =
  | "pending"
  | "purchased"
  | "expired-saved"
  | "cancelled";

export interface CoolingOffEntry {
  id: string;
  itemId: string;
  qty: number;
  totalPrice: number;
  necessityTag: Necessity;
  addedAt: number;
  expiresAt: number;
  status: CoolingOffStatus;
}

export interface PurchaseRecord {
  id: string;
  items: { itemId: string; qty: number; price: number }[];
  total: number;
  necessityMix: Partial<Record<Necessity, number>>;
  purchasedAt: number;
  bypassedFriction: boolean;
}

export interface SavingsLedger {
  totalSaved: number;
  currentSkipStreak: number;
  longestSkipStreak: number;
  byDay: Record<string, number>;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  website: "amazon" | "ebay" | "etsy" | "target" | "walmart";
  url: string;
  imageUrl?: string;
  addedAt: number;
}

export interface AmazonPauseItem {
  id: string;
  name: string;
  price: number | null;
  quantity: number;
  productUrl: string | null;
  imageUrl: string | null;
  pausedAt: number;
  sourceSite: "amazon";
}

export interface AmazonPauseSession {
  id: string;
  sourceSite: "amazon";
  sourceUrl: string;
  pausedAt: number;
  cartSubtotal: number | null;
  itemCount: number;
  amountAvoided: number;
  currency: string;
  items: AmazonPauseItem[];
}

export interface AppState {
  config: UserConfig | null;
  cart: CartLine[];
  coolingOff: CoolingOffEntry[];
  purchases: PurchaseRecord[];
  savings: SavingsLedger;
  wishlist: WishlistItem[];
  amazonPauseSessions: AmazonPauseSession[];
  schemaVersion: 1;
}

export const DEFAULT_STATE: AppState = {
  config: null,
  cart: [],
  coolingOff: [],
  purchases: [],
  savings: {
    totalSaved: 0,
    currentSkipStreak: 0,
    longestSkipStreak: 0,
    byDay: {},
  },
  wishlist: [],
  amazonPauseSessions: [],
  schemaVersion: 1,
};

export function normalizeAppState(state: Partial<AppState> | null | undefined): AppState {
  if (!state || state.schemaVersion !== 1) return DEFAULT_STATE;
  return {
    ...DEFAULT_STATE,
    ...state,
    cart: state.cart ?? DEFAULT_STATE.cart,
    coolingOff: state.coolingOff ?? DEFAULT_STATE.coolingOff,
    purchases: state.purchases ?? DEFAULT_STATE.purchases,
    savings: {
      ...DEFAULT_STATE.savings,
      ...(state.savings ?? {}),
    },
    wishlist: state.wishlist ?? DEFAULT_STATE.wishlist,
    amazonPauseSessions: state.amazonPauseSessions ?? DEFAULT_STATE.amazonPauseSessions,
  };
}

export const STORAGE_KEY = "shoppingintervention.v1";
