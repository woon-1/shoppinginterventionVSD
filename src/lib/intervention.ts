import { CATALOG, getCatalogItem } from "./catalog";
import {
  CartLine,
  CatalogItem,
  FrictionLevel,
  UserConfig,
} from "./types";

export interface CartBreakdown {
  essentials: { item: CatalogItem; qty: number; subtotal: number }[];
  nonEssentials: { item: CatalogItem; qty: number; subtotal: number }[];
  essentialsTotal: number;
  nonEssentialsTotal: number;
  total: number;
}

export function isItemEssential(itemId: string, config: UserConfig): boolean {
  const override = config.essentialItemOverrides[itemId];
  if (override !== undefined) return override;
  const item = getCatalogItem(itemId);
  if (!item) return false;
  return config.essentialCategories.includes(item.category);
}

export function breakdownCart(
  cart: CartLine[],
  config: UserConfig
): CartBreakdown {
  const essentials: CartBreakdown["essentials"] = [];
  const nonEssentials: CartBreakdown["nonEssentials"] = [];
  let essentialsTotal = 0;
  let nonEssentialsTotal = 0;

  for (const line of cart) {
    const item = getCatalogItem(line.itemId);
    if (!item) continue;
    const subtotal = item.price * line.qty;
    if (isItemEssential(item.id, config)) {
      essentials.push({ item, qty: line.qty, subtotal });
      essentialsTotal += subtotal;
    } else {
      nonEssentials.push({ item, qty: line.qty, subtotal });
      nonEssentialsTotal += subtotal;
    }
  }
  return {
    essentials,
    nonEssentials,
    essentialsTotal,
    nonEssentialsTotal,
    total: essentialsTotal + nonEssentialsTotal,
  };
}

export interface InterventionDecision {
  triggered: boolean;
  level: FrictionLevel | "none";
  reason: string;
}

export function decideIntervention(
  breakdown: CartBreakdown,
  config: UserConfig
): InterventionDecision {
  if (breakdown.nonEssentials.length === 0) {
    return {
      triggered: false,
      level: "none",
      reason: "Cart contains essentials only",
    };
  }
  return {
    triggered: true,
    level: config.friction,
    reason: `Cart contains ${breakdown.nonEssentials.length} non-essential item${
      breakdown.nonEssentials.length === 1 ? "" : "s"
    }`,
  };
}

export function findAlternatives(
  breakdown: CartBreakdown,
  remainingBudget: number,
  config: UserConfig
): CatalogItem[] {
  if (breakdown.nonEssentials.length === 0) return [];
  const focus = breakdown.nonEssentials.reduce((max, line) =>
    line.subtotal > max.subtotal ? line : max
  );
  const targetCategory = focus.item.category;
  const ceiling = Math.max(remainingBudget, 0);
  return CATALOG.filter(
    (c) =>
      c.category === targetCategory &&
      c.id !== focus.item.id &&
      c.price <= ceiling
  )
    .sort((a, b) => a.price - b.price)
    .slice(0, 3);
}
