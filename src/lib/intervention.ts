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

/**
 * Which footer action the modal should label as RECOMMENDED, given the cart's
 * fit against the user's remaining budget and chosen friction. A $1 drink with
 * $50 left this week shouldn't be told to wait 24 hours — that's
 * paternalistic. A cart that swallows half the remaining budget should.
 *
 * Returns null when neither action is clearly better — the modal hides the
 * label rather than picking arbitrarily.
 */
export type Recommendation = "buy" | "save" | null;

export interface RecommendationInput {
  cartTotal: number | null;
  remaining: number | null;
  friction: FrictionLevel;
}

export function deriveRecommendation({
  cartTotal,
  remaining,
  friction,
}: RecommendationInput): Recommendation {
  // No budget context — only strict friction has a clear default posture.
  if (cartTotal == null || remaining == null) {
    return friction === "strict" ? "save" : null;
  }

  // Already over budget — clear save signal regardless of friction.
  if (cartTotal > remaining) return "save";

  const ratio = remaining > 0 ? cartTotal / remaining : 1;

  // Tiny purchase relative to remaining — don't moralize a $1 drink even on
  // strict mode. The cart-size signal beats friction posture here.
  if (ratio < 0.1) return "buy";

  // Cart claims half or more of remaining budget — meaningful chunk, save
  // regardless of friction.
  if (ratio >= 0.5) return "save";

  // Middle band (10–50%) — friction posture decides.
  if (friction === "strict") return "save";
  if (friction === "light") return "buy";

  // Standard friction in the middle band — stay neutral, hide the label.
  return null;
}

export type InterventionState =
  | "initialPause"
  | "contextFraming"
  | "reflection"
  | "decision"
  | "postDecision";

export const interventionStateMachine = {
  initialPause: {
    next: "contextFraming",
  },
  contextFraming: {
    next: "reflection",
  },
  reflection: {
    next: "decision",
  },
  decision: {
    next: "postDecision",
  },
  postDecision: {
    next: null, // End of flow
  },
};
