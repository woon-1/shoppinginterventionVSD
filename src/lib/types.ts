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

export interface AppState {
  config: UserConfig | null;
  cart: CartLine[];
  coolingOff: CoolingOffEntry[];
  purchases: PurchaseRecord[];
  savings: SavingsLedger;
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
  schemaVersion: 1,
};

export const STORAGE_KEY = "shoppingintervention.v1";
