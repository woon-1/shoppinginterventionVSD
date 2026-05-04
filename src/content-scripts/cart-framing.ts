import { remainingBudget } from "@/lib/budget";
import { formatCurrency } from "@/lib/format";
import type { PurchaseRecord, UserConfig } from "@/lib/types";

export interface PurchaseFramingLines {
  headline: string;
  supportingLines: string[];
}

function monthlyBudgetEquivalent(config: UserConfig): number {
  return config.budgetPeriod === "monthly"
    ? config.budgetAmount
    : config.budgetAmount * (52 / 12);
}

/**
 * Neutral, relatable translations of cart total — supportive, not moralizing.
 */
export function buildPurchaseFraming(
  cartTotal: number | null,
  config: UserConfig,
  purchases: PurchaseRecord[]
): PurchaseFramingLines {
  const supportingLines: string[] = [];
  const headline = "A calm pause before you continue.";

  if (cartTotal != null && cartTotal > 0) {
    const meals = Math.max(1, Math.round(cartTotal / 38));
    supportingLines.push(
      `${formatCurrency(cartTotal)} is roughly ${meals} casual meals out — a loose comparison, not a verdict.`
    );

    const monthlyEq = monthlyBudgetEquivalent(config);
    if (monthlyEq > 0) {
      const pct = Math.min(100, Math.round((cartTotal / monthlyEq) * 100));
      supportingLines.push(
        `That's about ${pct}% of the monthly discretionary budget implied by your Pause settings (${formatCurrency(monthlyEq)}).`
      );
    }

    const remaining = remainingBudget(config, purchases);
    const period = config.budgetPeriod === "weekly" ? "this week" : "this month";
    supportingLines.push(
      `Before this cart, about ${formatCurrency(remaining)} was left for ${period} in your plan.`
    );
  } else {
    supportingLines.push(
      "We couldn't read the order total from this page. If you know it, hold that number next to your goal for a moment."
    );
  }

  return { headline, supportingLines };
}

export function goalSkipDeltaCopy(
  cartTotal: number | null,
  saved: number,
  goalAmount: number,
  goalLabel: string
): string | null {
  if (cartTotal == null || cartTotal <= 0 || goalAmount <= 0) return null;
  const curPct = Math.min(100, (saved / goalAmount) * 100);
  const nextPct = Math.min(100, ((saved + cartTotal) / goalAmount) * 100);
  const delta = Math.round(nextPct - curPct);
  if (delta <= 0) return null;
  return `If you skip this purchase, you might picture yourself ~${delta}% closer to ${goalLabel} — one framing for the tradeoff, not a rule.`;
}
