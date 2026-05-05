import { FrictionLevel } from "@/lib/types";

export type CartInterventionOutcome = "wait_24h" | "continue" | "minimize";

export interface CartInterventionPayload {
  kind: CartInterventionOutcome;
  host: string;
  cartTotal: number | null;
  friction: FrictionLevel;
  engagedPrompt?: boolean;
}

export interface CartInterventionStats {
  totalTriggers: number;
  waits: number;
  continues: number;
  minimizes: number;
  promptEngagements: number;
  lastTriggeredAt: number | null;
  lastDecisionAt: number | null;
  lastDecisionKind: CartInterventionOutcome | null;
  byHost: Record<string, number>;
  byHour: Record<string, number>;
  lastCartTotal: number | null;
}

export interface AdaptiveIntervention {
  friction: FrictionLevel;
  pauseMs: number;
  requireJustification: boolean;
  headlineTone: "gentle" | "direct" | "firm";
  explanation: string;
  suppressUntil: number | null;
}

export const CART_INTERVENTION_STATS_KEY = "pause.cartInterventionStats.v1";

export function createEmptyCartInterventionStats(): CartInterventionStats {
  return {
    totalTriggers: 0,
    waits: 0,
    continues: 0,
    minimizes: 0,
    promptEngagements: 0,
    lastTriggeredAt: null,
    lastDecisionAt: null,
    lastDecisionKind: null,
    byHost: {},
    byHour: {},
    lastCartTotal: null,
  };
}

export async function loadStoredCartInterventionStats(): Promise<CartInterventionStats | null> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return null;
  const data = await chrome.storage.local.get(CART_INTERVENTION_STATS_KEY);
  return (data[CART_INTERVENTION_STATS_KEY] as CartInterventionStats | undefined) ?? null;
}

export function normalizeStoredCartInterventionStats(
  stats: CartInterventionStats | null | undefined
): CartInterventionStats {
  const empty = createEmptyCartInterventionStats();
  if (!stats) return empty;
  return {
    ...empty,
    ...stats,
    byHost: stats.byHost ?? {},
    byHour: stats.byHour ?? {},
  };
}

export function updateCartInterventionStats(
  stats: CartInterventionStats,
  payload: CartInterventionPayload,
  at: number = Date.now()
): CartInterventionStats {
  const hourKey = String(new Date(at).getHours()).padStart(2, "0");
  const next: CartInterventionStats = {
    ...stats,
    totalTriggers: stats.totalTriggers + 1,
    lastTriggeredAt: at,
    lastDecisionAt: at,
    lastDecisionKind: payload.kind,
    byHost: { ...stats.byHost, [payload.host]: (stats.byHost[payload.host] ?? 0) + 1 },
    byHour: { ...stats.byHour, [hourKey]: (stats.byHour[hourKey] ?? 0) + 1 },
    lastCartTotal: payload.cartTotal,
  };

  if (payload.kind === "wait_24h") next.waits += 1;
  if (payload.kind === "continue") next.continues += 1;
  if (payload.kind === "minimize") next.minimizes += 1;
  if (payload.engagedPrompt) next.promptEngagements += 1;

  return next;
}

function toStep(friction: FrictionLevel): number {
  if (friction === "light") return 0;
  if (friction === "strict") return 2;
  return 1;
}

function fromStep(step: number): FrictionLevel {
  if (step <= 0) return "light";
  if (step >= 2) return "strict";
  return "standard";
}

export function deriveAdaptiveIntervention(
  baseFriction: FrictionLevel,
  stats: CartInterventionStats | null,
  cartTotal: number | null
): AdaptiveIntervention {
  const normalized = normalizeStoredCartInterventionStats(stats);
  const step = toStep(baseFriction);
  const hourKey = String(new Date().getHours()).padStart(2, "0");
  const hourTriggers = normalized.byHour[hourKey] ?? 0;
  const continueRate = normalized.totalTriggers > 0 ? normalized.continues / normalized.totalTriggers : 0;
  const waitRate = normalized.totalTriggers > 0 ? normalized.waits / normalized.totalTriggers : 0;

  let score = step;

  if ((cartTotal ?? 0) >= 150) score += 1;
  if ((cartTotal ?? 0) >= 300) score += 1;
  if (normalized.totalTriggers >= 3 && continueRate >= 0.5) score += 1;
  if (normalized.minimizes >= 2) score += 1;
  if (hourTriggers >= 2) score += 1;
  if (waitRate >= 0.6) score -= 1;

  score = Math.max(0, Math.min(2, score));

  const friction = fromStep(score);
  const pauseMs = friction === "light" ? 0 : friction === "standard" ? 1600 : 4200;
  const requireJustification = friction === "strict" || (normalized.continues >= 2 && normalized.waits === 0);
  const headlineTone: AdaptiveIntervention["headlineTone"] =
    friction === "light" ? "gentle" : friction === "standard" ? "direct" : "firm";

  const explanation =
    friction === "strict"
      ? "Repeated fast continuations or a large cart justify a stronger pause."
      : friction === "standard"
        ? "This cart deserves a deliberate check before checkout."
        : "A brief, gentle pause is enough here.";

  return {
    friction,
    pauseMs,
    requireJustification,
    headlineTone,
    explanation,
    suppressUntil: normalized.minimizes >= 3 ? Date.now() + 30 * 60 * 1000 : null,
  };
}